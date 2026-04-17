// Browser client — use in Client Components and hooks
export { createClient } from '@/lib/client'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DailyLog {
  id: string
  date: string
  week_number: number
  topic: string | null
  started_at: string | null
  finished_at: string | null
  checklist: {
    learned_10_words: boolean
    finished_writing: boolean
    wrote_journal: boolean
    reviewed_flashcards: boolean
    reviewed_old_words?: boolean
    quiz_done?: boolean
  }
  created_at: string
}

export interface WordReview {
  id: string
  vocabulary_entry_id: string
  next_review_date: string
  interval_days: number
  review_count: number
  last_reviewed_at: string | null
  created_at: string
}

export interface ReviewItem {
  reviewId: string
  intervalDays: number
  reviewCount: number
  nextReviewDate: string
  entry: VocabularyEntry
}

export interface VocabularyEntry {
  id: string
  log_id: string
  date: string
  word: string
  meaning: string
  example_sentence: string
  my_sentence: string
  week_number: number
  created_at: string
}

export interface WritingSession {
  id: string
  log_id: string
  date: string
  topic: string
  content: string
  new_words_used: string[]
  mini_journal: string
  self_review: {
    vocabulary_correct: number
    sentences_clear: number
    thought_in_english: number
    wrote_without_stopping: number
  }
  created_at: string
}

export interface ProgressDay {
  id: string
  date: string
  completed: boolean
  words_count: number
  writing_done: boolean
  created_at: string
}
