'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { RefreshCw, CheckCircle2, XCircle, Trophy, ChevronRight, Sparkles, AlertTriangle } from 'lucide-react'
import { useWordsForReview, useUpdateWordReview } from '@/hooks/useDailyLog'
import { ReviewItem } from '@/lib/supabase'
import { SpeakButton } from './SpeakButton'

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

  useEffect(() => {
    if (!isLoading && !isError && items.length === 0) {
      const t = setTimeout(onComplete, 600)
      return () => clearTimeout(t)
    }
  }, [isLoading, isError, items.length, onComplete])

  if (isLoading) {
    return (
      <div className="card-editorial p-12 text-center">
        <RefreshCw style={{ width: 32, height: 32, margin: '0 auto 12px', color: 'var(--saffron)', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>Loading review words...</p>
      </div>
    )
  }

  if (isError) {
    const msg = (error as { message?: string })?.message ?? ''
    const tableNotFound = msg.includes('does not exist') || msg.includes('relation')
    return (
      <div style={{ borderRadius: 14, padding: 24, textAlign: 'center', background: 'var(--blush)', border: '1.5px solid var(--coral)' }}>
        <AlertTriangle style={{ width: 40, height: 40, margin: '0 auto 8px', color: 'var(--coral)' }} />
        <p style={{ fontWeight: 600, color: 'var(--coral)', marginBottom: 8 }}>
          {tableNotFound ? 'Table word_reviews not found' : 'Failed to load review data'}
        </p>
        {tableNotFound && (
          <>
            <p style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 8 }}>
              Run the following SQL in your <strong>Supabase SQL Editor</strong>, then reload:
            </p>
            <pre style={{ textAlign: 'left', fontSize: 11, borderRadius: 10, padding: 14, background: 'var(--paper-2)', border: '1.5px solid var(--line-soft)', color: 'var(--ink-2)', overflowX: 'auto' }}>{`create table if not exists word_reviews (
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
          </>
        )}
        {!tableNotFound && <p style={{ fontSize: 12, color: 'var(--coral)' }}>{msg}</p>}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="card-editorial p-12 text-center space-y-3">
        <Sparkles style={{ width: 48, height: 48, margin: '0 auto', color: 'var(--saffron)' }} />
        <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 20, color: 'var(--ink)' }}>No words due for review today!</p>
        <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>Keep learning new words and the system will schedule reviews at the right time.</p>
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
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="card-editorial p-8 text-center space-y-5">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
          <Trophy style={{ width: 64, height: 64, margin: '0 auto', color: 'var(--saffron)' }} />
        </motion.div>
        <div>
          <h3 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 28, color: 'var(--ink)', marginBottom: 4 }}>Review Complete!</h3>
          <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>
            You remembered{' '}
            <span style={{ color: 'var(--lime)', fontWeight: 700 }}>{knownCount}</span>
            {' '}out of{' '}
            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{total}</span> words
          </p>
        </div>
        {knownCount < total && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ padding: '12px 16px', background: 'var(--blush)', border: '1.5px solid var(--coral)', borderRadius: 12, textAlign: 'left' }}>
            <p className="caps" style={{ fontSize: 10, color: 'var(--coral)', marginBottom: 10 }}>Review again tomorrow</p>
            <div className="flex flex-wrap gap-2">
              {items
                .filter((item) => results[item.reviewId] === 'skip')
                .map((item) => (
                  <div key={item.reviewId} style={{ padding: '4px 10px', border: '1.5px solid var(--line-soft)', borderRadius: 8, background: 'var(--paper)', fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.entry.word}</span>
                    <span style={{ margin: '0 4px', color: 'var(--ink-3)' }}>—</span>
                    <span style={{ color: 'var(--ink-2)' }}>{item.entry.meaning}</span>
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
          <RefreshCw style={{ width: 18, height: 18, color: 'var(--saffron)' }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>Review</span>
          <span style={{ padding: '2px 8px', border: '1.5px solid rgba(255,217,61,0.4)', borderRadius: 999, fontSize: 12, fontWeight: 600, color: 'var(--saffron)', background: 'rgba(255,217,61,0.1)' }}>
            {currentIdx + 1}/{total}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1" style={{ fontSize: 13, color: 'var(--lime)' }}>
            <CheckCircle2 style={{ width: 13, height: 13 }} /> {knownCount}
          </span>
          <span className="flex items-center gap-1" style={{ fontSize: 13, color: 'var(--coral)' }}>
            <XCircle style={{ width: 13, height: 13 }} /> {currentIdx - knownCount}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 999, background: 'var(--line-soft)', overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', borderRadius: 999, background: 'var(--saffron)' }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div key={currentIdx}
          initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ perspective: 1000 }}>
          <motion.div
            onClick={() => setFlipped(!flipped)}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            style={{ transformStyle: 'preserve-3d', cursor: 'pointer', position: 'relative', minHeight: 320 }}
          >
            {/* Front */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-10 select-none"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: 'var(--paper-2)', border: '1.5px solid var(--ink)', borderRadius: 14, boxShadow: 'var(--shadow)' }}>
              <span style={{ position: 'absolute', top: 14, right: 14, padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: 'rgba(255,217,61,0.1)', border: '1px solid rgba(255,217,61,0.3)', color: 'var(--saffron)' }}>
                Learned {learnedDate}
              </span>
              <p className="caps" style={{ fontSize: 10, color: 'var(--saffron)' }}>Tap to reveal</p>
              <div className="flex items-center gap-3">
                <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 52, color: 'var(--ink)', textAlign: 'center' }}>{current.entry.word}</p>
                <SpeakButton word={current.entry.word} size="md" />
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>Review #{current.reviewCount + 1}</p>
              <ChevronRight style={{ width: 16, height: 16, transform: 'rotate(90deg)', opacity: 0.4, color: 'var(--ink-3)' }} />
            </div>

            {/* Back */}
            <div className="absolute inset-0 flex flex-col justify-center gap-3 px-6 py-6 select-none"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'var(--paper-2)', border: '1.5px solid var(--ink)', borderRadius: 14, boxShadow: 'var(--shadow)' }}>
              <div className="flex items-center justify-center gap-2">
                <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 28, color: 'var(--ink)', textAlign: 'center' }}>{current.entry.word}</p>
                <SpeakButton word={current.entry.word} size="md" />
              </div>
              <div style={{ borderRadius: 10, padding: '10px 14px', textAlign: 'center', background: 'rgba(255,217,61,0.1)', border: '1px solid rgba(255,217,61,0.25)' }}>
                <p className="caps" style={{ fontSize: 9, color: 'var(--saffron)', marginBottom: 4 }}>Meaning</p>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{current.entry.meaning}</p>
              </div>
              <div style={{ borderRadius: 10, padding: '10px 14px', background: 'var(--sky)', border: '1px solid var(--line-soft)' }}>
                <p className="caps" style={{ fontSize: 9, color: 'var(--lime)', marginBottom: 4 }}>Example</p>
                <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--ink-2)' }}>{current.entry.example_sentence}</p>
              </div>
              {current.entry.my_sentence && (
                <div style={{ borderRadius: 10, padding: '10px 14px', background: 'rgba(125,219,168,0.12)', border: '1px solid rgba(125,219,168,0.3)' }}>
                  <p className="caps" style={{ fontSize: 9, color: 'var(--mint)', marginBottom: 4 }}>Your sentence</p>
                  <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--ink-2)' }}>{current.entry.my_sentence}</p>
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
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => next('skip')}
                className="flex items-center justify-center gap-2 py-3"
                style={{ borderRadius: 12, fontWeight: 600, color: 'var(--coral)', background: 'var(--blush)', border: '1.5px solid var(--coral)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.08s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}>
                <XCircle style={{ width: 18, height: 18 }} /> Forgot
              </button>
              <button onClick={() => next('know')}
                className="flex items-center justify-center gap-2 py-3"
                style={{ borderRadius: 12, fontWeight: 600, color: '#fff', background: 'var(--lime)', border: '1.5px solid var(--ink)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.08s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}>
                <CheckCircle2 style={{ width: 18, height: 18 }} /> Got it!
              </button>
            </div>
            <p className="text-center" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              Got it → next review in <span style={{ fontWeight: 600, color: 'var(--saffron)' }}>{nextInterval}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!flipped && (
        <p className="text-center" style={{ fontSize: 12, color: 'var(--ink-3)' }}>Tap card to reveal meaning</p>
      )}
    </div>
  )
}
