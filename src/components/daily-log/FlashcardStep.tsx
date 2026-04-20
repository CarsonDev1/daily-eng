'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VocabularyEntry } from '@/lib/supabase'
import { BrainCircuit, CheckCircle2, XCircle, RotateCcw, Trophy, ChevronRight, Lightbulb } from 'lucide-react'
import { SpeakButton } from './SpeakButton'
import { api } from '@/lib/axios'

interface Props {
  vocabulary: VocabularyEntry[]
  onComplete: () => void
}

type Result = 'know' | 'skip'

export function FlashcardStep({ vocabulary, onComplete }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<Record<string, Result>>({})
  const [finished, setFinished] = useState(false)
  const [mnemonics, setMnemonics] = useState<Record<string, string>>({})
  const [mnemonicLoading, setMnemonicLoading] = useState(false)

  const total = vocabulary.length
  const current = vocabulary[currentIdx]
  const knownCount = Object.values(results).filter(r => r === 'know').length
  const progress = total > 0 ? (currentIdx / total) * 100 : 0

  useEffect(() => {
    if (vocabulary.length === 0) return
    setMnemonicLoading(true)
    api.post('/generate-mnemonics', {
      words: vocabulary.map((v) => ({ word: v.word, meaning: v.meaning })),
    })
      .then(({ data }) => {
        const map: Record<string, string> = {}
        const list = data.mnemonics as Array<{ word: string; mnemonic: string }>
        list.forEach((m) => {
          const entry = vocabulary.find(v => v.word.toLowerCase() === m.word.toLowerCase())
          if (entry) map[entry.id] = m.mnemonic
        })
        setMnemonics(map)
      })
      .catch(() => {})
      .finally(() => setMnemonicLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabulary.map(v => v.id).join(',')])

  if (total === 0) {
    return (
      <div className="card-editorial p-12 text-center">
        <BrainCircuit style={{ width: 48, height: 48, margin: '0 auto 12px', color: 'var(--ink-3)', opacity: 0.4 }} />
        <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>Generate vocabulary first to start flashcard review</p>
      </div>
    )
  }

  const next = (result: Result) => {
    setResults(prev => ({ ...prev, [current.id]: result }))
    setFlipped(false)
    setTimeout(() => {
      if (currentIdx + 1 >= total) {
        setFinished(true)
        onComplete()
      } else {
        setCurrentIdx(i => i + 1)
      }
    }, 100)
  }

  const restart = () => {
    setCurrentIdx(0)
    setFlipped(false)
    setResults({})
    setFinished(false)
  }

  if (finished) {
    const skipWords = vocabulary.filter(v => results[v.id] === 'skip')
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="card-editorial p-8 text-center space-y-5">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
          <Trophy style={{ width: 64, height: 64, margin: '0 auto', color: 'var(--saffron)' }} />
        </motion.div>
        <div>
          <h3 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 28, color: 'var(--ink)', marginBottom: 4 }}>Flashcards Complete!</h3>
          <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>
            You knew <span style={{ color: 'var(--lime)', fontWeight: 700 }}>{knownCount}</span> out of <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{total}</span> words
          </p>
        </div>
        {skipWords.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ padding: '12px 16px', background: 'var(--blush)', border: '1.5px solid var(--coral)', borderRadius: 12, textAlign: 'left' }}>
            <p className="caps" style={{ fontSize: 10, color: 'var(--coral)', marginBottom: 10 }}>Review these again</p>
            <div className="flex flex-wrap gap-2">
              {skipWords.map(v => (
                <div key={v.id} style={{ padding: '4px 10px', border: '1.5px solid var(--line-soft)', borderRadius: 8, background: 'var(--paper)', fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{v.word}</span>
                  <span style={{ margin: '0 4px', color: 'var(--ink-3)' }}>—</span>
                  <span style={{ color: 'var(--ink-2)' }}>{v.meaning}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        <button onClick={restart} className="btn-action ghost sm" style={{ margin: '0 auto' }}>
          <RotateCcw style={{ width: 14, height: 14 }} /> Review Again
        </button>
      </motion.div>
    )
  }

  const currentMnemonic = current ? mnemonics[current.id] : undefined

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit style={{ width: 18, height: 18, color: 'var(--ink-2)' }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>Flashcards</span>
          <span style={{ padding: '2px 8px', border: '1.5px solid var(--line-soft)', borderRadius: 999, fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', background: 'var(--chip)' }}>
            {currentIdx + 1}/{total}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {mnemonicLoading && (
            <span className="flex items-center gap-1" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              <Lightbulb style={{ width: 12, height: 12, color: 'var(--saffron)', animation: 'pulse 1s infinite' }} /> Loading hints...
            </span>
          )}
          <span className="flex items-center gap-1" style={{ color: 'var(--lime)' }}><CheckCircle2 style={{ width: 13, height: 13 }} /> {knownCount}</span>
          <span className="flex items-center gap-1" style={{ color: 'var(--coral)' }}><XCircle style={{ width: 13, height: 13 }} /> {currentIdx - knownCount}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 999, background: 'var(--line-soft)', overflow: 'hidden' }}>
        <motion.div
          className="progress-shimmer"
          style={{ height: '100%', borderRadius: 999 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      {/* Flip card */}
      <AnimatePresence mode="wait">
        <motion.div key={currentIdx}
          initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ perspective: 1000 }}>
          <motion.div onClick={() => setFlipped(!flipped)}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            style={{ transformStyle: 'preserve-3d', cursor: 'pointer', position: 'relative', minHeight: 260 }}>

            {/* Front */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 select-none"
              style={{
                backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                background: 'var(--paper-2)',
                border: '1.5px solid var(--ink)',
                borderRadius: 14,
                boxShadow: 'var(--shadow)',
              }}>
              <p className="caps" style={{ fontSize: 10, color: 'var(--lime)', marginBottom: 16 }}>Tap to reveal meaning</p>
              <div className="flex items-center gap-3">
                <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 48, color: 'var(--ink)' }}>{current?.word}</p>
                <SpeakButton word={current?.word ?? ''} size="md" />
              </div>
              <ChevronRight style={{ width: 20, height: 20, marginTop: 24, transform: 'rotate(90deg)', color: 'var(--ink-3)' }} />
            </div>

            {/* Back */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 select-none"
              style={{
                backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: 'var(--paper-2)',
                border: '1.5px solid var(--ink)',
                borderRadius: 14,
                boxShadow: 'var(--shadow)',
              }}>
              <div className="flex items-center justify-center gap-2 mb-4">
                <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 28, color: 'var(--ink)' }}>{current?.word}</p>
                <SpeakButton word={current?.word ?? ''} size="md" />
              </div>
              <div className="w-full space-y-3">
                <div style={{ borderRadius: 10, padding: '10px 14px', textAlign: 'center', background: 'var(--sky)', border: '1px solid var(--line-soft)' }}>
                  <p className="caps" style={{ fontSize: 10, color: 'var(--lime)', marginBottom: 4 }}>Meaning</p>
                  <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>{current?.meaning}</p>
                </div>
                <div style={{ borderRadius: 10, padding: '10px 14px', background: 'var(--chip)', border: '1px solid var(--line-soft)' }}>
                  <p className="caps" style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Example</p>
                  <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--ink-2)' }}>{current?.example_sentence}</p>
                </div>
                {current?.my_sentence && (
                  <div style={{ borderRadius: 10, padding: '10px 14px', background: 'rgba(125,219,168,0.12)', border: '1px solid rgba(125,219,168,0.3)' }}>
                    <p className="caps" style={{ fontSize: 10, color: 'var(--mint)', marginBottom: 4 }}>Your sentence</p>
                    <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--ink-2)' }}>{current?.my_sentence}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Mnemonic hint */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25, delay: 0.1 }}
          >
            {currentMnemonic ? (
              <div style={{ borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(255,217,61,0.1)', border: '1px solid rgba(255,217,61,0.35)' }}>
                <Lightbulb style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1, color: 'var(--saffron)' }} />
                <div>
                  <p className="caps" style={{ fontSize: 9, color: 'var(--saffron)', marginBottom: 3 }}>Mẹo nhớ</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>{currentMnemonic}</p>
                </div>
              </div>
            ) : mnemonicLoading ? (
              <div style={{ borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,217,61,0.06)', border: '1px solid rgba(255,217,61,0.2)' }}>
                <Lightbulb style={{ width: 14, height: 14, color: 'var(--saffron)', animation: 'pulse 1s infinite' }} />
                <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>Đang tạo mẹo nhớ...</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Know / Forgot buttons */}
      <AnimatePresence>
        {flipped && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="grid grid-cols-2 gap-3">
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
          </motion.div>
        )}
      </AnimatePresence>

      {!flipped && (
        <p className="text-center" style={{ fontSize: 12, color: 'var(--ink-3)' }}>Tap card to reveal meaning</p>
      )}
    </div>
  )
}
