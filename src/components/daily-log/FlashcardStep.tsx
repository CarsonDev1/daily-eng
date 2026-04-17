'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VocabularyEntry } from '@/lib/supabase'
import { BrainCircuit, CheckCircle2, XCircle, RotateCcw, Trophy, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  const total = vocabulary.length
  const current = vocabulary[currentIdx]
  const knownCount = Object.values(results).filter(r => r === 'know').length
  const progress = total > 0 ? (currentIdx / total) * 100 : 0

  if (total === 0) {
    return (
      <div className="rounded-2xl p-12 text-center"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)', backdropFilter: 'blur(16px)' }}>
        <BrainCircuit className="w-12 h-12 mx-auto mb-3 text-violet-400 opacity-40" />
        <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>Generate vocabulary first to start flashcard review</p>
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
        className="rounded-2xl p-8 text-center space-y-5"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)', backdropFilter: 'blur(16px)', boxShadow: 'var(--c-card-shadow)' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
          <Trophy className="w-16 h-16 mx-auto text-yellow-400" style={{ filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.5))' }} />
        </motion.div>
        <div>
          <h3 className="text-2xl font-bold" style={{ color: 'var(--c-text-1)' }}>Flashcards Complete!</h3>
          <p className="mt-1" style={{ color: 'var(--c-text-2)' }}>
            You knew <span className="text-emerald-500 font-bold">{knownCount}</span> out of <span className="font-bold" style={{ color: 'var(--c-text-1)' }}>{total}</span> words
          </p>
        </div>
        {skipWords.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-xl p-4 text-left"
            style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-3">Review these again</p>
            <div className="flex flex-wrap gap-2">
              {skipWords.map(v => (
                <div key={v.id} className="rounded-lg px-3 py-1.5 text-sm"
                  style={{ background: 'var(--c-bg)', border: '1px solid var(--c-card-border)' }}>
                  <span className="font-semibold" style={{ color: 'var(--c-text-1)' }}>{v.word}</span>
                  <span className="mx-1" style={{ color: 'var(--c-text-3)' }}>—</span>
                  <span style={{ color: 'var(--c-text-2)' }}>{v.meaning}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        <Button variant="outline" onClick={restart}
          className="gap-2 border-violet-500/30 text-violet-600 dark:text-violet-300 hover:bg-violet-500/10">
          <RotateCcw className="w-4 h-4" /> Review Again
        </Button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-violet-500" />
          <span className="font-semibold" style={{ color: 'var(--c-text-1)' }}>Flashcards</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#7c3aed', border: '1px solid rgba(139,92,246,0.3)' }}>
            {currentIdx + 1}/{total}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {knownCount}</span>
          <span className="text-orange-500 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> {currentIdx - knownCount}</span>
        </div>
      </div>

      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--c-card-border)' }}>
        <motion.div className="h-full rounded-full progress-shimmer"
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentIdx}
          initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ perspective: 1000 }}>
          <motion.div onClick={() => setFlipped(!flipped)}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            style={{ transformStyle: 'preserve-3d', cursor: 'pointer', position: 'relative', minHeight: 260 }}>
            {/* Front */}
            <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 select-none"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: 'var(--c-card)', border: '1px solid var(--c-accent-border)', backdropFilter: 'blur(16px)', boxShadow: 'var(--c-card-shadow)' }}>
              <p className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-4">Tap to reveal meaning</p>
              <p className="text-5xl font-bold tracking-tight" style={{ color: 'var(--c-text-1)' }}>{current?.word}</p>
              <ChevronRight className="w-5 h-5 mt-6 rotate-90" style={{ color: 'var(--c-text-3)' }} />
            </div>
            {/* Back */}
            <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 select-none"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'var(--c-card)', border: '1px solid var(--c-blue-border)', backdropFilter: 'blur(16px)', boxShadow: 'var(--c-card-shadow)' }}>
              <p className="text-3xl font-bold mb-4" style={{ color: 'var(--c-text-1)' }}>{current?.word}</p>
              <div className="w-full space-y-3">
                <div className="rounded-xl px-4 py-3 text-center" style={{ background: 'var(--c-purple-bg)', border: '1px solid var(--c-purple-border)' }}>
                  <p className="text-xs text-violet-500 font-medium mb-1">Meaning</p>
                  <p className="text-lg font-semibold" style={{ color: 'var(--c-text-1)' }}>{current?.meaning}</p>
                </div>
                <div className="rounded-xl px-4 py-3 text-left" style={{ background: 'var(--c-blue-bg)', border: '1px solid var(--c-blue-border)' }}>
                  <p className="text-xs text-cyan-500 font-medium mb-1">Example</p>
                  <p className="text-sm italic" style={{ color: 'var(--c-text-2)' }}>{current?.example_sentence}</p>
                </div>
                {current?.my_sentence && (
                  <div className="rounded-xl px-4 py-3 text-left" style={{ background: 'var(--c-green-bg)', border: '1px solid var(--c-green-border)' }}>
                    <p className="text-xs text-emerald-500 font-medium mb-1">Your sentence</p>
                    <p className="text-sm italic" style={{ color: 'var(--c-text-2)' }}>{current?.my_sentence}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {flipped && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="grid grid-cols-2 gap-3">
            <button onClick={() => next('skip')}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-orange-500 transition-all active:scale-95"
              style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(251,146,60,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(251,146,60,0.08)')}>
              <XCircle className="w-5 h-5" /> Forgot
            </button>
            <button onClick={() => next('know')}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all active:scale-95"
              style={{ background: 'var(--c-green-bg)', border: '1px solid var(--c-green-border)', color: 'var(--c-text-1)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,211,153,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--c-green-bg)')}>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Got it!
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {!flipped && <p className="text-center text-xs" style={{ color: 'var(--c-text-3)' }}>Tap card to reveal meaning</p>}
    </div>
  )
}
