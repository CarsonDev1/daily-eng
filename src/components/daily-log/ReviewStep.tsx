'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DailyLog, WritingSession } from '@/lib/supabase'
import { useUpsertWritingSession } from '@/hooks/useDailyLog'
import { ClipboardCheck, Star } from 'lucide-react'

interface Props {
  date: string
  log: DailyLog | null | undefined
  writing: WritingSession | null
}

const CRITERIA = [
  { key: 'vocabulary_correct', label: 'Used new vocabulary correctly' },
  { key: 'sentences_clear', label: 'Sentences are clear & understandable' },
  { key: 'thought_in_english', label: 'Thought in English (not translating)' },
  { key: 'wrote_without_stopping', label: 'Wrote without stopping too much' },
] as const

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-xl transition-transform hover:scale-110"
        >
          <Star
            className={`w-5 h-5 ${
              star <= (hovered || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-slate-600'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export function ReviewStep({ date, log, writing }: Props) {
  const upsertWriting = useUpsertWritingSession()

  const defaultReview = writing?.self_review ?? {
    vocabulary_correct: 0,
    sentences_clear: 0,
    thought_in_english: 0,
    wrote_without_stopping: 0,
  }

  const [review, setReview] = useState(defaultReview)
  const [miniJournal, setMiniJournal] = useState(writing?.mini_journal ?? '')
  const [learned, setLearned] = useState('')
  const [unsure, setUnsure] = useState('')

  const handleSave = () => {
    if (!log?.id) return
    upsertWriting.mutate({
      log_id: log.id,
      date,
      topic: writing?.topic ?? '',
      content: writing?.content ?? '',
      new_words_used: writing?.new_words_used ?? [],
      mini_journal: miniJournal,
      self_review: review,
    })
  }

  const avgScore = CRITERIA.reduce((sum, c) => sum + (review[c.key] ?? 0), 0) / CRITERIA.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-orange-500" />
          Review & Reflect
        </CardTitle>
        <CardDescription>10 mins · How did today&apos;s session go?</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mini Journal */}
        <div>
          <Label className="text-sm font-medium">Mini Journal</Label>
          <p className="text-xs mb-2" style={{ color: 'var(--c-text-3)' }}>
            How are you feeling? What happened today? (1–2 sentences in English)
          </p>
          <Textarea
            placeholder="Today I felt... / Something interesting happened..."
            value={miniJournal}
            onChange={(e) => setMiniJournal(e.target.value)}
            className="min-h-[80px] text-sm"
          />
        </div>

        {/* Self Review */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Self-Review</Label>
            {avgScore > 0 && (
              <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                Avg: {avgScore.toFixed(1)}/5
              </span>
            )}
          </div>
          <div className="space-y-1">
            {CRITERIA.map((c) => (
              <div
                key={c.key}
                className="flex items-center justify-between py-2.5"
                style={{ borderBottom: '1px solid var(--c-card-border)' }}
              >
                <span className="text-sm" style={{ color: 'var(--c-text-2)' }}>{c.label}</span>
                <StarRating
                  value={review[c.key] ?? 0}
                  onChange={(v) => setReview({ ...review, [c.key]: v })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* What I Learned */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-green-600">What I Learned Today</Label>
            <Textarea
              placeholder="- ..."
              value={learned}
              onChange={(e) => setLearned(e.target.value)}
              className="mt-1 min-h-[80px] text-sm"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-orange-600">Things I&apos;m Not Sure About</Label>
            <Textarea
              placeholder="- ..."
              value={unsure}
              onChange={(e) => setUnsure(e.target.value)}
              className="mt-1 min-h-[80px] text-sm"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={upsertWriting.isPending || !log?.id}
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          {upsertWriting.isPending ? 'Saving...' : 'Save Review'}
        </Button>
      </CardContent>
    </Card>
  )
}
