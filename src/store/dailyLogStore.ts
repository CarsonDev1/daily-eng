import { create } from 'zustand'
import { VocabularyEntry, WritingSession, DailyLog } from '@/lib/supabase'

interface DailyLogState {
  // Current log
  currentLog: DailyLog | null
  setCurrentLog: (log: DailyLog | null) => void

  // Vocabulary
  vocabularyEntries: VocabularyEntry[]
  setVocabularyEntries: (entries: VocabularyEntry[]) => void
  updateMySentence: (id: string, sentence: string) => void

  // Writing
  writingSession: WritingSession | null
  setWritingSession: (session: WritingSession | null) => void

  // UI state
  isGeneratingVocab: boolean
  setIsGeneratingVocab: (v: boolean) => void

  activeStep: 1 | 2 | 3
  setActiveStep: (step: 1 | 2 | 3) => void
}

export const useDailyLogStore = create<DailyLogState>((set) => ({
  currentLog: null,
  setCurrentLog: (log) => set({ currentLog: log }),

  vocabularyEntries: [],
  setVocabularyEntries: (entries) => set({ vocabularyEntries: entries }),
  updateMySentence: (id, sentence) =>
    set((state) => ({
      vocabularyEntries: state.vocabularyEntries.map((e) =>
        e.id === id ? { ...e, my_sentence: sentence } : e
      ),
    })),

  writingSession: null,
  setWritingSession: (session) => set({ writingSession: session }),

  isGeneratingVocab: false,
  setIsGeneratingVocab: (v) => set({ isGeneratingVocab: v }),

  activeStep: 1,
  setActiveStep: (step) => set({ activeStep: step }),
}))
