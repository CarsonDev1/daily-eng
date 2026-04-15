import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/client'
import { DailyLog, VocabularyEntry, WritingSession } from '@/lib/supabase'
import { api } from '@/lib/axios'
import { toast } from 'sonner'

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
      return data as VocabularyEntry[]
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
