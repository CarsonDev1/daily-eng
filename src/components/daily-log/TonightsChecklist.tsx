'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { DailyLog } from '@/lib/supabase'
import { CheckSquare } from 'lucide-react'

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

const ITEMS: { key: keyof Checklist; label: string; emoji: string; auto: boolean }[] = [
  { key: 'learned_10_words',     label: 'Learned 10 new words',             emoji: '🔵', auto: true },
  { key: 'reviewed_flashcards',  label: 'Reviewed flashcards',              emoji: '🟣', auto: true },
  { key: 'finished_writing',     label: 'Finished writing (5–8 sentences)', emoji: '🟢', auto: true },
  { key: 'wrote_journal',        label: 'Wrote mini journal entry',         emoji: '🟠', auto: true },
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
  const progress = (completedCount / total) * 100

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckSquare className="w-5 h-5" style={{ color: 'var(--c-text-2)' }} />
            Tonight&apos;s Checklist
          </CardTitle>
          <span className="text-sm font-medium" style={{ color: 'var(--c-text-3)' }}>
            {completedCount}/{total}
          </span>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {ITEMS.map(({ key, label, emoji }) => {
            const checked = checklist[key]
            return (
              <div
                key={key}
                className="flex items-center gap-3 p-2 rounded-lg transition-colors"
                style={checked ? {
                  background: 'var(--c-green-bg)',
                  border: '1px solid var(--c-green-border)',
                } : {
                  border: '1px solid transparent',
                }}
              >
                <Checkbox
                  checked={checked}
                  disabled
                  className={checked ? 'text-green-600 border-green-400' : ''}
                />
                <Label
                  className="flex items-center gap-2 text-sm cursor-default"
                  style={checked ? { color: '#16a34a' } : { color: 'var(--c-text-2)' }}
                >
                  <span>{emoji}</span>
                  <span className={checked ? 'line-through opacity-75' : ''}>{label}</span>
                  <span className="text-xs opacity-50 no-underline">(auto)</span>
                </Label>
              </div>
            )
          })}
        </div>

        {completedCount === total && (
          <div
            className="mt-4 p-3 rounded-lg text-center"
            style={{ background: 'var(--c-green-bg)', border: '1px solid var(--c-green-border)' }}
          >
            <p className="text-sm font-semibold text-green-600">
              Session complete! Keep up the streak! 🔥
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
