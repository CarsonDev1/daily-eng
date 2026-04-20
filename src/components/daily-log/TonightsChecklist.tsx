'use client'

import { DailyLog } from '@/lib/supabase'
import { CheckSquare, Check } from 'lucide-react'

type Checklist = DailyLog['checklist']

interface Props {
  date: string
  log: DailyLog | null | undefined
  vocabCount: number
  writingDone: boolean
  journalDone: boolean
  flashcardsDone: boolean
  onChecklistChange: (checklist: Checklist) => void
}

const ITEMS: { key: keyof Checklist; label: string }[] = [
  { key: 'learned_10_words',    label: 'Learned 10 new words' },
  { key: 'reviewed_flashcards', label: 'Reviewed flashcards' },
  { key: 'finished_writing',    label: 'Finished writing (5–8 sentences)' },
  { key: 'wrote_journal',       label: 'Wrote mini journal entry' },
]

export function TonightsChecklist({
  vocabCount,
  writingDone,
  journalDone,
  flashcardsDone,
}: Props) {
  const checklist: Checklist = {
    learned_10_words:    vocabCount >= 10,
    reviewed_flashcards: flashcardsDone,
    finished_writing:    writingDone,
    wrote_journal:       journalDone,
  }

  const completedCount = Object.values(checklist).filter(Boolean).length
  const total = ITEMS.length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare style={{ width: 14, height: 14, color: 'var(--ink-2)' }} />
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>Tonight&apos;s Checklist</span>
        </div>
        <span className="caps" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{completedCount}/{total}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, borderRadius: 999, background: 'var(--line-soft)', marginBottom: 12, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${(completedCount / total) * 100}%`,
            background: 'var(--lime)',
            borderRadius: 999,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div className="space-y-1.5">
        {ITEMS.map(({ key, label }) => {
          const checked = checklist[key]
          return (
            <div
              key={key}
              className="tonight-item"
              style={checked ? {} : { background: 'transparent' }}
            >
              <div className="tonight-item-bullet">
                {checked && <Check style={{ width: 10, height: 10 }} />}
              </div>
              <span style={{
                fontSize: 13,
                color: checked ? 'var(--ink)' : 'var(--ink-3)',
                textDecoration: checked ? 'line-through' : 'none',
                opacity: checked ? 0.7 : 1,
              }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {completedCount === total && (
        <div
          className="mt-3 p-3 text-center"
          style={{
            background: 'rgba(49,156,246,0.08)',
            border: '1.5px solid rgba(49,156,246,0.25)',
            borderRadius: 10,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--lime)' }}>
            Session complete! Keep up the streak!
          </p>
        </div>
      )}
    </div>
  )
}
