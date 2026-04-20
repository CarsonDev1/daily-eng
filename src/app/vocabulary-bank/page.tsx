'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAllVocabulary } from '@/hooks/useDailyLog'
import type { VocabularyEntry } from '@/lib/supabase'
import { Search, Volume2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const WEEKS = [0, 1, 2, 3, 4]
const COLORS = ['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10'] as const

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

  const withSentence = allVocab.filter((v) => !!v.my_sentence).length
  const masteryPct = allVocab.length > 0 ? Math.round((withSentence / allVocab.length) * 100) : 0
  const circumference = 2 * Math.PI * 18
  const dash = (masteryPct / 100) * circumference

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 40, color: 'var(--ink)', lineHeight: 1, marginBottom: 4 }}>
          Your vocab <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>bank</em>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Every word you&apos;ve collected</p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="mini-stat">
          <div className="val">{allVocab.length}</div>
          <div className="lbl">total words</div>
        </div>
        <div className="mini-stat">
          <div className="val">{withSentence}</div>
          <div className="lbl">with sentence</div>
        </div>
        <div className="mini-stat">
          <div className="val">{[1,2,3,4].filter(w => allVocab.some(v => v.week_number === w)).length}</div>
          <div className="lbl">weeks active</div>
        </div>
        {/* Mastery ring */}
        <div className="mini-stat">
          <div className="mastery" style={{ justifyContent: 'center' }}>
            <div className="mastery-ring">
              <svg viewBox="0 0 40 40" width="40" height="40">
                <circle className="track" cx="20" cy="20" r="18" />
                <circle
                  className="fill"
                  cx="20" cy="20" r="18"
                  strokeDasharray={`${dash} ${circumference}`}
                  strokeDashoffset="0"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
              </svg>
            </div>
            <div>
              <div className="mastery-pct">{masteryPct}%</div>
              <div className="mastery-label">mastery</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--ink-3)' }} />
        <input
          placeholder="Search words or meanings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px 10px 42px',
            border: '1.5px solid var(--line-soft)', borderRadius: 12,
            background: 'var(--paper)', color: 'var(--ink)', fontSize: 14,
            outline: 'none', boxShadow: 'var(--shadow-sm)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--ink)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--line-soft)')}
        />
      </div>

      {/* Week filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {WEEKS.map((w) => {
          const isActive = activeWeek === w
          const count = weekCount(w)
          return (
            <button key={w} onClick={() => setActiveWeek(w)} style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${isActive ? 'var(--ink)' : 'var(--line-soft)'}`,
              background: isActive ? 'var(--ink)' : 'var(--paper-2)',
              color: isActive ? 'var(--paper)' : 'var(--ink-2)',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.1s', cursor: 'pointer',
            }}>
              {w === 0 ? 'All' : `Week ${w}`}
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.65 }}>({count})</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="vb-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 140, borderRadius: 14, background: 'var(--chip)', border: '1.5px solid var(--line-soft)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-editorial p-16 text-center">
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>
            {search ? `No words match "${search}"` : activeWeek > 0 ? `No words for Week ${activeWeek} yet` : 'No words yet'}
          </p>
          <p style={{ fontSize: 12, marginTop: 4, color: 'var(--ink-3)' }}>
            {search ? 'Try a different search' : "Go to Today's Log and generate vocabulary"}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeWeek}-${search}`}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="vb-grid"
          >
            {filtered.map((entry, idx) => (
              <VBCard key={entry.id} entry={entry} idx={idx} colorClass={COLORS[idx % 10]} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

function VBCard({ entry, idx, colorClass }: { entry: VocabularyEntry; idx: number; colorClass: string }) {
  const masteryPct = entry.my_sentence ? 100 : 40
  const circumference = 2 * Math.PI * 14
  const dash = (masteryPct / 100) * circumference

  const handleSpeak = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(entry.word)
      utt.lang = 'en-US'
      window.speechSynthesis.speak(utt)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.03, 0.3), type: 'spring', stiffness: 300, damping: 30 }}
      className={`vb-card vb-card-${colorClass}`}
    >
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="vb-word">{entry.word}</div>
            <div className="vb-meaning">{entry.meaning}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {/* Mastery ring */}
            <div className="mastery-ring" style={{ width: 32, height: 32 }}>
              <svg viewBox="0 0 32 32" width="32" height="32">
                <circle className="track" cx="16" cy="16" r="14" strokeWidth="3" />
                <circle
                  className="fill" cx="16" cy="16" r="14" strokeWidth="3"
                  strokeDasharray={`${dash} ${circumference}`}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
              </svg>
            </div>
            <button className="icon-btn" onClick={handleSpeak}>
              <Volume2 style={{ width: 12, height: 12 }} />
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'var(--chip)', border: '1.5px solid var(--line-soft)', color: 'var(--ink-2)' }}>
            W{entry.week_number}
          </span>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {format(parseISO(entry.date), 'MMM d')}
          </span>
          {entry.my_sentence && (
            <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, background: 'rgba(125,219,168,0.15)', color: 'var(--mint)', border: '1px solid rgba(125,219,168,0.3)' }}>
              ✓ sentence
            </span>
          )}
        </div>

        {/* Example */}
        {entry.example_sentence && (
          <div style={{ marginTop: 10, fontSize: 12, fontStyle: 'italic', color: 'var(--ink-3)', borderLeft: '2px solid var(--lime)', paddingLeft: 8 }}>
            {entry.example_sentence}
          </div>
        )}
      </div>
    </motion.div>
  )
}
