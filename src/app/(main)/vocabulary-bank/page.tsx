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

  return (
    <div id="tour-vocab-page" className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-h1" style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 40, color: 'var(--ink)', lineHeight: 1, marginBottom: 4 }}>
          Your vocab <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>bank</em>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Every word you&apos;ve collected</p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="mini-stat on">
          <div className="cap">total words</div>
          <div className="v">{allVocab.length}</div>
          <div className="h">collected</div>
        </div>
        <div className="mini-stat warm">
          <div className="cap">with sentence</div>
          <div className="v">{withSentence}</div>
          <div className="h">your examples</div>
        </div>
        <div className="mini-stat">
          <div className="cap">weeks active</div>
          <div className="v">{[1,2,3,4].filter(w => allVocab.some(v => v.week_number === w)).length}</div>
          <div className="h">out of 4</div>
        </div>
        <div className="mini-stat dark">
          <div className="cap">mastery</div>
          <div className="v">{masteryPct}%</div>
          <div className="h">with sentences</div>
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
            <div key={i} style={{ height: 160, borderRadius: 14, background: 'var(--chip)', border: '1.5px solid var(--line-soft)', animation: 'pulse 1.5s infinite' }} />
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
        <div>
          <span className="w">{entry.word}</span>
        </div>
        <div className="m">
          <span className="vn">{entry.meaning}</span>
        </div>
        {entry.example_sentence && (
          <div className="ex">{entry.example_sentence}</div>
        )}
        <div className="footer-row">
          <div className="chips">
            <span className="wc week">W{entry.week_number}</span>
            {entry.my_sentence && <span className="wc learned">✓ learned</span>}
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{format(parseISO(entry.date), 'MMM d')}</span>
          </div>
        </div>
      </div>
      <div className="right">
        <div
          className="mastery"
          style={{ '--p': `${masteryPct}%` } as React.CSSProperties}
        >
          <span>{masteryPct}%</span>
        </div>
        <button className="icon-btn" onClick={handleSpeak}>
          <Volume2 style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </motion.div>
  )
}
