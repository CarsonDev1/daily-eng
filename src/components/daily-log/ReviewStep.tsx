'use client'

import { useState } from 'react'
import { DailyLog, WritingSession } from '@/lib/supabase'
import { useUpsertWritingSession } from '@/hooks/useDailyLog'
import { ClipboardCheck, Star } from 'lucide-react'

interface Props {
  date: string
  log: DailyLog | null | undefined
  writing: WritingSession | null
}

const CRITERIA = [
  { key: 'vocabulary_correct',    label: 'Used new vocabulary correctly' },
  { key: 'sentences_clear',       label: 'Sentences are clear & understandable' },
  { key: 'thought_in_english',    label: 'Thought in English (not translating)' },
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
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, transition: 'transform 0.1s' }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Star style={{
            width: 18, height: 18,
            fill: star <= (hovered || value) ? 'var(--saffron)' : 'none',
            color: star <= (hovered || value) ? 'var(--saffron)' : 'var(--line-soft)',
            transition: 'all 0.1s',
          }} />
        </button>
      ))}
    </div>
  )
}

const taStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 80,
  resize: 'vertical',
  padding: '10px 12px',
  border: '1.5px solid var(--line-soft)',
  borderRadius: 10,
  background: 'var(--paper)',
  color: 'var(--ink)',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'var(--font-sans)',
  lineHeight: 1.6,
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
    <div className="card-editorial p-5 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ClipboardCheck style={{ width: 16, height: 16, color: 'var(--ink-2)' }} />
          <span style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 20, color: 'var(--ink)' }}>Review &amp; Reflect</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>10 mins · How did today&apos;s session go?</p>
      </div>

      {/* Mini Journal */}
      <div>
        <label className="caps" style={{ fontSize: 10, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>Mini Journal</label>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>
          How are you feeling? What happened today? (1–2 sentences in English)
        </p>
        <textarea
          placeholder="Today I felt... / Something interesting happened..."
          value={miniJournal}
          onChange={(e) => setMiniJournal(e.target.value)}
          style={taStyle}
          onFocus={(e) => (e.target.style.borderColor = 'var(--ink)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--line-soft)')}
        />
      </div>

      {/* Self Review */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="caps" style={{ fontSize: 10, color: 'var(--ink-3)' }}>Self-Review</label>
          {avgScore > 0 && (
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--saffron)' }}>
              Avg: {avgScore.toFixed(1)}/5
            </span>
          )}
        </div>
        <div>
          {CRITERIA.map((c) => (
            <div
              key={c.key}
              className="flex items-center justify-between py-2.5"
              style={{ borderBottom: '1px solid var(--line-soft)' }}
            >
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{c.label}</span>
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
          <label className="caps" style={{ fontSize: 10, color: 'var(--lime)', display: 'block', marginBottom: 6 }}>What I Learned Today</label>
          <textarea
            placeholder="- ..."
            value={learned}
            onChange={(e) => setLearned(e.target.value)}
            style={taStyle}
            onFocus={(e) => (e.target.style.borderColor = 'var(--lime)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--line-soft)')}
          />
        </div>
        <div>
          <label className="caps" style={{ fontSize: 10, color: 'var(--coral)', display: 'block', marginBottom: 6 }}>Things I&apos;m Not Sure About</label>
          <textarea
            placeholder="- ..."
            value={unsure}
            onChange={(e) => setUnsure(e.target.value)}
            style={taStyle}
            onFocus={(e) => (e.target.style.borderColor = 'var(--coral)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--line-soft)')}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={upsertWriting.isPending || !log?.id}
        className="btn-action coral w-full justify-center"
        style={{ opacity: (upsertWriting.isPending || !log?.id) ? 0.5 : 1, cursor: !log?.id ? 'not-allowed' : 'pointer' }}
      >
        {upsertWriting.isPending ? 'Saving...' : 'Save Review'}
      </button>
    </div>
  )
}
