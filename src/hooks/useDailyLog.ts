import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/client'
import { DailyLog, VocabularyEntry, WritingSession, ReviewItem } from '@/lib/supabase'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { format, addDays, parseISO } from 'date-fns'

// ─── Daily Log ───────────────────────────────────────────────────────────────

export function useDailyLog(date: string) {
  return useQuery({
    queryKey: ['daily-log', date],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('date', date)
        .maybeSingle()
      if (error) throw error
      return data as DailyLog | null
    },
  })
}

export function useUpsertDailyLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (log: Partial<DailyLog> & { date: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('daily_logs')
        .upsert(log, { onConflict: 'date' })
        .select()
        .single()
      if (error) throw error
      return data as DailyLog
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['daily-log', data.date] })
    },
    onError: () => toast.error('Failed to save log'),
  })
}

// ─── Vocabulary ──────────────────────────────────────────────────────────────

export function useVocabularyEntries(date: string) {
  return useQuery({
    queryKey: ['vocabulary', date],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vocabulary_entries')
        .select('*')
        .eq('date', date)
        .order('created_at')
      if (error) throw error
      return (data ?? []) as VocabularyEntry[]
    },
  })
}

export function useAllVocabulary() {
  return useQuery({
    queryKey: ['vocabulary', 'all'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vocabulary_entries')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as VocabularyEntry[]
    },
  })
}

export function useGenerateVocabulary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      logId,
      date,
      topic,
      weekNumber,
      existingWords,
    }: {
      logId: string
      date: string
      topic: string
      weekNumber: number
      existingWords: string[]
    }) => {
      // 1. Call Claude API
      const { data: generated } = await api.post('/generate-vocabulary', {
        topic,
        week_number: weekNumber,
        existing_words: existingWords,
      })

      // 2. Insert into Supabase
      const supabase = createClient()
      const rows = generated.words.map((w: { word: string; meaning: string; example_sentence: string }) => ({
        log_id: logId,
        date,
        word: w.word,
        meaning: w.meaning,
        example_sentence: w.example_sentence,
        my_sentence: '',
        week_number: weekNumber,
      }))

      const { data, error } = await supabase
        .from('vocabulary_entries')
        .insert(rows)
        .select()

      if (error) throw error
      const vocabData = data as VocabularyEntry[]

      // Create SRS review entries: first review is tomorrow
      const tomorrow = format(addDays(parseISO(date), 1), 'yyyy-MM-dd')
      const reviewRows = vocabData.map((v) => ({
        vocabulary_entry_id: v.id,
        next_review_date: tomorrow,
        interval_days: 1,
        review_count: 0,
      }))
      await supabase.from('word_reviews').insert(reviewRows)

      return vocabData
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['vocabulary', variables.date] })
      qc.invalidateQueries({ queryKey: ['vocabulary', 'all'] })
      toast.success('Generated 10 new words!')
    },
    onError: () => toast.error('Failed to generate vocabulary'),
  })
}

export function useDeleteVocabularyByDate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (date: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('vocabulary_entries')
        .delete()
        .eq('date', date)
      if (error) throw error
    },
    onSuccess: (_, date) => {
      qc.invalidateQueries({ queryKey: ['vocabulary', date] })
      qc.invalidateQueries({ queryKey: ['vocabulary', 'all'] })
    },
  })
}

// ─── Spaced Repetition ───────────────────────────────────────────────────────

export function useWordsForReview(date: string) {
  return useQuery({
    queryKey: ['word-reviews', date],
    queryFn: async () => {
      const supabase = createClient()

      // Get recent vocabulary entries from previous days (up to 60 words lookback)
      const { data: oldEntries, error: entErr } = await supabase
        .from('vocabulary_entries')
        .select('*')
        .lt('date', date)
        .order('date', { ascending: false })
        .limit(60)
      if (entErr) throw entErr
      if (!oldEntries?.length) return [] as ReviewItem[]

      // Get existing word_reviews for those entries
      const entryIds = oldEntries.map((e) => e.id)
      const { data: reviews, error: revErr } = await supabase
        .from('word_reviews')
        .select('*')
        .in('vocabulary_entry_id', entryIds)
      if (revErr) throw revErr

      const reviewMap = new Map((reviews ?? []).map((r) => [r.vocabulary_entry_id, r]))

      // Due words = entries with overdue review OR entries with no review row (backfill)
      const dueEntries = (oldEntries as VocabularyEntry[])
        .filter((entry) => {
          const review = reviewMap.get(entry.id)
          if (!review) return true // no row yet → due immediately
          return review.next_review_date <= date
        })
        .slice(0, 15)

      if (!dueEntries.length) return [] as ReviewItem[]

      // Auto-create word_reviews for entries that never had one (backfill)
      const noReview = dueEntries.filter((e) => !reviewMap.has(e.id))
      if (noReview.length > 0) {
        const { data: inserted, error: insErr } = await supabase
          .from('word_reviews')
          .insert(noReview.map((e) => ({
            vocabulary_entry_id: e.id,
            next_review_date: date,
            interval_days: 1,
            review_count: 0,
          })))
          .select()
        if (insErr) throw insErr
        ;(inserted ?? []).forEach((r) => reviewMap.set(r.vocabulary_entry_id, r))
      }

      return dueEntries
        .filter((entry) => reviewMap.has(entry.id))
        .map((entry) => {
          const review = reviewMap.get(entry.id)!
          return {
            reviewId: review.id,
            intervalDays: review.interval_days,
            reviewCount: review.review_count,
            nextReviewDate: review.next_review_date,
            entry,
          }
        }) as ReviewItem[]
    },
  })
}

export function useUpdateWordReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      reviewId, result, today, currentInterval, currentReviewCount,
    }: {
      reviewId: string
      result: 'know' | 'skip'
      today: string
      currentInterval: number
      currentReviewCount: number
    }) => {
      const supabase = createClient()
      const newInterval = result === 'know' ? Math.min(currentInterval * 2, 30) : 1
      const nextDate = format(addDays(parseISO(today), newInterval), 'yyyy-MM-dd')
      const { error } = await supabase
        .from('word_reviews')
        .update({
          interval_days: newInterval,
          next_review_date: nextDate,
          review_count: currentReviewCount + 1,
          last_reviewed_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
      if (error) throw error
      return today
    },
    onSuccess: (today) => {
      qc.invalidateQueries({ queryKey: ['word-reviews', today] })
    },
    onError: () => toast.error('Failed to save review'),
  })
}

export function useUpdateMySentence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, my_sentence, date }: { id: string; my_sentence: string; date: string }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('vocabulary_entries')
        .update({ my_sentence })
        .eq('id', id)
      if (error) throw error
      return { id, my_sentence, date }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['vocabulary', data.date] })
    },
  })
}

// ─── Writing Session ─────────────────────────────────────────────────────────

export function useAllWritingSessions() {
  return useQuery({
    queryKey: ['writing', 'all'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('writing_sessions')
        .select('date, content, mini_journal')
        .order('date', { ascending: false })
      if (error) throw error
      return (data ?? []) as Pick<WritingSession, 'date' | 'content' | 'mini_journal'>[]
    },
  })
}

export function useWritingSession(date: string) {
  return useQuery({
    queryKey: ['writing', date],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('writing_sessions')
        .select('*')
        .eq('date', date)
        .maybeSingle()
      if (error) throw error
      return data as WritingSession | null
    },
  })
}

export function useUpsertWritingSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (session: Partial<WritingSession> & { date: string; log_id: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('writing_sessions')
        .upsert(session, { onConflict: 'date' })
        .select()
        .single()
      if (error) throw error
      return data as WritingSession
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['writing', data.date] })
      toast.success('Writing saved!')
    },
    onError: () => toast.error('Failed to save writing'),
  })
}

export function useGenerateWritingTopic() {
  return useMutation({
    mutationFn: async (vocabularyWords: string[]) => {
      const { data } = await api.post('/generate-writing-topic', {
        vocabulary_words: vocabularyWords,
      })
      return data as { topic: string; prompt: string }
    },
    onError: () => toast.error('Failed to generate topic'),
  })
}

// ─── Progress ────────────────────────────────────────────────────────────────

export function useProgressDays() {
  return useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('progress_days')
        .select('*')
        .order('date', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useUpsertProgressDay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (day: { date: string; completed: boolean; words_count: number; writing_done: boolean }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('progress_days')
        .upsert(day, { onConflict: 'date' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress'] })
    },
  })
}
