'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { RefreshCw, CheckCircle2, XCircle, Trophy, ChevronRight, Sparkles, AlertTriangle } from 'lucide-react'
import { useWordsForReview, useUpdateWordReview } from '@/hooks/useDailyLog'
import { ReviewItem } from '@/lib/supabase'

interface Props {
  date: string
  onComplete: () => void
}

type Result = 'know' | 'skip'

function intervalLabel(days: number) {
  if (days === 1) return '1 day'
  if (days < 7) return `${days} days`
  if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) > 1 ? 's' : ''}`
  return '1 month'
}

export function SpacedRepetitionStep({ date, onComplete }: Props) {
  const { data: items = [], isLoading, isError, error } = useWordsForReview(date)
  const updateReview = useUpdateWordReview()

  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<Record<string, Result>>({})
  const [finished, setFinished] = useState(false)

  // Auto-complete only when genuinely no words to review (not on error)
  useEffect(() => {
    if (!isLoading && !isError && items.length === 0) {
      const t = setTimeout(onComplete, 600)
      return () => clearTimeout(t)
    }
  }, [isLoading, isError, items.length, onComplete])

  if (isLoading) {
    return (
      <div
        className="rounded-2xl p-12 text-center"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)', backdropFilter: 'blur(16px)' }}
      >
        <RefreshCw className="w-8 h-8 mx-auto mb-3 text-amber-400 animate-spin" />
        <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>Loading review words...</p>
      </div>
    )
  }

  if (isError) {
    const msg = (error as { message?: string })?.message ?? ''
    const tableNotFound = msg.includes('does not exist') || msg.includes('relation')
    return (
      <div
        className="rounded-2xl p-8 text-center space-y-3"
        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', backdropFilter: 'blur(16px)' }}
      >
        <AlertTriangle className="w-10 h-10 mx-auto text-red-400" />
        <p className="font-semibold text-red-400">
          {tableNotFound ? 'Table word_reviews not found' : 'Failed to load review data'}
        </p>
        {tableNotFound && (
          <p className="text-xs" style={{ color: 'var(--c-text-2)' }}>
            Run the following SQL in your <strong>Supabase SQL Editor</strong>, then reload:
          </p>
        )}
        {tableNotFound && (
          <pre
            className="text-left text-xs rounded-xl p-4 overflow-x-auto"
            style={{ background: 'var(--c-input-bg)', border: '1px solid var(--c-input-border)', color: 'var(--c-text-2)' }}
          >{`create table if not exists word_reviews (
  id                  uuid primary key default gen_random_uuid(),
  vocabulary_entry_id uuid not null references vocabulary_entries(id) on delete cascade,
  next_review_date    date not null,
  interval_days       int not null default 1,
  review_count        int not null default 0,
  last_reviewed_at    timestamptz,
  created_at          timestamptz not null default now(),
  unique(vocabulary_entry_id)
);
create index if not exists idx_word_reviews_next_review_date on word_reviews(next_review_date);
alter table word_reviews enable row level security;
create policy "allow all" on word_reviews for all using (true) with check (true);`}</pre>
        )}
        {!tableNotFound && (
          <p className="text-xs text-red-300">{msg}</p>
        )}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-12 text-center space-y-3"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)', backdropFilter: 'blur(16px)' }}
      >
        <Sparkles className="w-12 h-12 mx-auto text-amber-400" style={{ filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.5))' }} />
        <p className="text-lg font-bold" style={{ color: 'var(--c-text-1)' }}>No words due for review today!</p>
        <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>
          Keep learning new words and the system will schedule reviews at the right time.
        </p>
      </motion.div>
    )
  }

  const total = items.length
  const current: ReviewItem = items[currentIdx]
  const knownCount = Object.values(results).filter((r) => r === 'know').length
  const progress = total > 0 ? (currentIdx / total) * 100 : 0

  const next = (result: Result) => {
    setResults((prev) => ({ ...prev, [current.reviewId]: result }))
    setFlipped(false)

    updateReview.mutate({
      reviewId: current.reviewId,
      result,
      today: date,
      currentInterval: current.intervalDays,
      currentReviewCount: current.reviewCount,
    })

    setTimeout(() => {
      if (currentIdx + 1 >= total) {
        setFinished(true)
        onComplete()
      } else {
        setCurrentIdx((i) => i + 1)
      }
    }, 100)
  }

  if (finished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-8 text-center space-y-5"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)', backdropFilter: 'blur(16px)', boxShadow: 'var(--c-card-shadow)' }}
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
          <Trophy className="w-16 h-16 mx-auto text-amber-400" style={{ filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.5))' }} />
        </motion.div>
        <div>
          <h3 className="text-2xl font-bold" style={{ color: 'var(--c-text-1)' }}>Review Complete!</h3>
          <p className="mt-1" style={{ color: 'var(--c-text-2)' }}>
            You remembered{' '}
            <span className="text-emerald-500 font-bold">{knownCount}</span>
            {' '}out of{' '}<span className="font-bold" style={{ color: 'var(--c-text-1)' }}>{total}</span> words
          </p>
        </div>
        {knownCount < total && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl p-4 text-left"
            style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}
          >
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-3">
              Review again tomorrow
            </p>
            <div className="flex flex-wrap gap-2">
              {items
                .filter((item) => results[item.reviewId] === 'skip')
                .map((item) => (
                  <div key={item.reviewId} className="rounded-lg px-3 py-1.5 text-sm" style={{ background: 'var(--c-bg)', border: '1px solid var(--c-card-border)' }}>
                    <span className="font-semibold" style={{ color: 'var(--c-text-1)' }}>{item.entry.word}</span>
                    <span className="mx-1" style={{ color: 'var(--c-text-3)' }}>—</span>
                    <span style={{ color: 'var(--c-text-2)' }}>{item.entry.meaning}</span>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    )
  }

  const learnedDate = (() => {
    try { return format(parseISO(current.entry.date), 'dd/MM') } catch { return current.entry.date }
  })()
  const nextInterval = intervalLabel(current.intervalDays * 2 > 30 ? 30 : current.intervalDays * 2)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-amber-500" />
          <span className="font-semibold" style={{ color: 'var(--c-text-1)' }}>Review</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#d97706', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            {currentIdx + 1}/{total}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-emerald-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> {knownCount}
          </span>
          <span className="text-orange-500 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> {currentIdx - knownCount}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--c-card-border)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ perspective: 1000 }}
        >
          <motion.div
            onClick={() => setFlipped(!flipped)}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            style={{ transformStyle: 'preserve-3d', cursor: 'pointer', position: 'relative', minHeight: 320 }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-3 p-10 select-none"
              style={{
                backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                background: 'var(--c-card)', border: '1px solid var(--c-card-border)',
                backdropFilter: 'blur(16px)', boxShadow: 'var(--c-card-shadow)',
              }}
            >
              <span
                className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                Learned {learnedDate}
              </span>
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest">Tap to reveal</p>
              <p className="text-5xl font-bold tracking-tight text-center" style={{ color: 'var(--c-text-1)' }}>
                {current.entry.word}
              </p>
              <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>Review #{current.reviewCount + 1}</p>
              <ChevronRight className="w-4 h-4 rotate-90 opacity-40" style={{ color: 'var(--c-text-3)' }} />
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-2xl flex flex-col justify-center gap-3 px-6 py-6 select-none"
              style={{
                backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: 'var(--c-card)', border: '1px solid var(--c-card-border)',
                backdropFilter: 'blur(16px)', boxShadow: 'var(--c-card-shadow)',
              }}
            >
              <p className="text-2xl font-bold text-center" style={{ color: 'var(--c-text-1)' }}>{current.entry.word}</p>
              <div
                className="rounded-xl px-4 py-3 text-center"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}
              >
                <p className="text-xs text-amber-500 font-medium mb-1">Meaning</p>
                <p className="text-base font-semibold" style={{ color: 'var(--c-text-1)' }}>{current.entry.meaning}</p>
              </div>
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: 'var(--c-blue-bg)', border: '1px solid var(--c-blue-border)' }}
              >
                <p className="text-xs text-cyan-500 font-medium mb-1">Example</p>
                <p className="text-sm italic leading-relaxed" style={{ color: 'var(--c-text-2)' }}>{current.entry.example_sentence}</p>
              </div>
              {current.entry.my_sentence && (
                <div
                  className="rounded-xl px-4 py-3"
                  style={{ background: 'var(--c-green-bg)', border: '1px solid var(--c-green-border)' }}
                >
                  <p className="text-xs text-emerald-500 font-medium mb-1">Your sentence</p>
                  <p className="text-sm italic leading-relaxed" style={{ color: 'var(--c-text-2)' }}>{current.entry.my_sentence}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Action buttons */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => next('skip')}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-orange-500 transition-all active:scale-95"
                style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(251,146,60,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(251,146,60,0.08)')}
              >
                <XCircle className="w-5 h-5" /> Forgot
              </button>
              <button
                onClick={() => next('know')}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all active:scale-95"
                style={{ background: 'var(--c-green-bg)', border: '1px solid var(--c-green-border)', color: 'var(--c-text-1)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,211,153,0.18)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--c-green-bg)')}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Got it!
              </button>
            </div>
            <p className="text-center text-xs" style={{ color: 'var(--c-text-3)' }}>
              Got it → next review in <span className="font-semibold text-amber-500">{nextInterval}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!flipped && (
        <p className="text-center text-xs" style={{ color: 'var(--c-text-3)' }}>
          Tap card to reveal meaning
        </p>
      )}
    </div>
  )
}
