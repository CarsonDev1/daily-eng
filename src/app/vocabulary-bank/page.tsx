'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAllVocabulary } from '@/hooks/useDailyLog'
import type { VocabularyEntry } from '@/lib/supabase'
import { Search, Library, BookOpen, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const WEEK_COLORS = [
  { accent: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.28)', glow: 'rgba(96,165,250,0.18)' },
  { accent: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.28)', glow: 'rgba(167,139,250,0.18)' },
  { accent: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.28)',  glow: 'rgba(52,211,153,0.18)'  },
  { accent: '#fb923c', bg: 'rgba(251,146,60,0.10)',  border: 'rgba(251,146,60,0.28)',  glow: 'rgba(251,146,60,0.18)'  },
]

const WEEKS = [0, 1, 2, 3, 4] // 0 = All

export default function VocabularyBankPage() {
  const { data: allVocab = [], isLoading } = useAllVocabulary()
  const [search, setSearch] = useState('')
  const [activeWeek, setActiveWeek] = useState(0)

  const filtered = allVocab.filter((v) => {
    const matchSearch =
      v.word.toLowerCase().includes(search.toLowerCase()) ||
      v.meaning.toLowerCase().includes(search.toLowerCase())
    const matchWeek = activeWeek === 0 || v.week_number === activeWeek
    return matchSearch && matchWeek
  })

  const weekCount = (w: number) =>
    w === 0
      ? allVocab.filter((v) => search === '' || v.word.toLowerCase().includes(search.toLowerCase()) || v.meaning.toLowerCase().includes(search.toLowerCase())).length
      : allVocab.filter((v) => v.week_number === w && (search === '' || v.word.toLowerCase().includes(search.toLowerCase()) || v.meaning.toLowerCase().includes(search.toLowerCase()))).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="float text-3xl select-none">📖</div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Vocabulary Bank</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>All words you&apos;ve learned</p>
          </div>
        </div>
        <div className="rounded-xl px-3 py-1.5 text-sm font-bold"
          style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }}>
          {allVocab.length} words
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-text-3)' }} />
        <input
          placeholder="Search words or meanings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
          style={{
            background: 'var(--c-input-bg)',
            border: '1px solid var(--c-input-border)',
            color: 'var(--c-text-1)',
          }}
        />
      </div>

      {/* Week filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {WEEKS.map((w) => {
          const c = w > 0 ? WEEK_COLORS[w - 1] : null
          const isActive = activeWeek === w
          const count = weekCount(w)
          return (
            <button
              key={w}
              onClick={() => setActiveWeek(w)}
              className="rounded-xl px-4 py-1.5 text-sm font-semibold transition-all"
              style={
                isActive
                  ? {
                      background: c ? c.bg : 'rgba(167,139,250,0.15)',
                      border: `1px solid ${c ? c.border : 'rgba(167,139,250,0.4)'}`,
                      color: c ? c.accent : '#a78bfa',
                    }
                  : {
                      background: 'var(--c-card)',
                      border: '1px solid var(--c-card-border)',
                      color: 'var(--c-text-3)',
                    }
              }
            >
              {w === 0 ? 'All' : `Week ${w}`}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl h-32 animate-pulse" style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState search={search} week={activeWeek} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeWeek}-${search}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {filtered.map((entry, idx) => (
              <WordCard key={entry.id} entry={entry} idx={idx} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

function WordCard({ entry, idx }: { entry: VocabularyEntry; idx: number }) {
  const [expanded, setExpanded] = useState(false)
  const c = WEEK_COLORS[(entry.week_number - 1) % WEEK_COLORS.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.03, 0.3), type: 'spring', stiffness: 300, damping: 30 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--c-card)', border: `1px solid var(--c-card-border)`, boxShadow: 'var(--c-card-shadow)' }}
    >
      {/* Top accent bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${c.accent}60, transparent)` }} />

      <div className="p-5">
        {/* Word row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: c.bg, color: c.accent, border: `1px solid ${c.border}` }}>
              {idx + 1}
            </div>
            <h3 className="text-xl font-bold tracking-tight truncate" style={{ color: c.accent }}>
              {entry.word}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-lg px-2 py-0.5 text-xs font-semibold"
              style={{ background: c.bg, color: c.accent, border: `1px solid ${c.border}` }}>
              W{entry.week_number}
            </span>
            <span className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--c-text-3)' }}>
              <Calendar className="w-3 h-3" />
              {format(parseISO(entry.date), 'MMM d')}
            </span>
          </div>
        </div>

        {/* Meaning */}
        <div className="rounded-xl px-3.5 py-2.5 mb-3"
          style={{ background: c.bg, border: `1px solid ${c.border}` }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: c.accent, opacity: 0.8 }}>Meaning</p>
          <p className="text-sm font-medium leading-snug" style={{ color: 'var(--c-text-1)' }}>{entry.meaning}</p>
        </div>

        {/* Expandable: example + my sentence */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs font-medium py-1 transition-colors"
          style={{ color: 'var(--c-text-3)' }}
        >
          <span>Example & notes</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-2">
                <div className="rounded-xl px-3.5 py-2.5"
                  style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)' }}>
                  <p className="text-xs font-semibold text-cyan-500 uppercase tracking-widest mb-1">Example</p>
                  <p className="text-sm italic leading-relaxed" style={{ color: 'var(--c-text-2)' }}>
                    {entry.example_sentence}
                  </p>
                </div>
                {entry.my_sentence ? (
                  <div className="rounded-xl px-3.5 py-2.5"
                    style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
                    <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">Your sentence</p>
                    <p className="text-sm italic leading-relaxed" style={{ color: 'var(--c-text-2)' }}>
                      {entry.my_sentence}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-center py-1" style={{ color: 'var(--c-text-3)' }}>No personal sentence yet</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function EmptyState({ search, week }: { search: string; week: number }) {
  const c = week > 0 ? WEEK_COLORS[week - 1] : WEEK_COLORS[1]
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="rounded-2xl p-16 text-center"
      style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }}>
      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: c.accent }} />
      {search ? (
        <>
          <p className="text-sm font-semibold" style={{ color: 'var(--c-text-2)' }}>No words match &ldquo;{search}&rdquo;</p>
          <p className="text-xs mt-1" style={{ color: 'var(--c-text-3)' }}>Try a different search</p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold" style={{ color: 'var(--c-text-2)' }}>
            {week > 0 ? `No words for Week ${week} yet` : 'No words yet'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--c-text-3)' }}>Go to Today&apos;s Log and generate vocabulary</p>
        </>
      )}
    </motion.div>
  )
}
