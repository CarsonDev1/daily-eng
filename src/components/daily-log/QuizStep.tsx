'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VocabularyEntry } from '@/lib/supabase'
import { CheckCircle2, XCircle, Trophy, RotateCcw, PenLine, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  vocabulary: VocabularyEntry[]
  onComplete: () => void
}

interface QuizQ {
  type: 'mc' | 'fitb'
  entry: VocabularyEntry
  choices?: string[]
  sentence?: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuiz(vocab: VocabularyEntry[]): QuizQ[] {
  return shuffle(vocab).map((entry, i) => {
    if (i % 2 === 0) {
      const distractors = shuffle(vocab.filter(v => v.id !== entry.id)).slice(0, 3).map(v => v.meaning)
      return { type: 'mc', entry, choices: shuffle([entry.meaning, ...distractors]) }
    } else {
      const regex = new RegExp(`\\b${entry.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      return { type: 'fitb', entry, sentence: entry.example_sentence.replace(regex, '___') }
    }
  })
}

export function QuizStep({ vocabulary, onComplete }: Props) {
  const [quiz] = useState<QuizQ[]>(() => buildQuiz(vocabulary))
  const [idx, setIdx] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  // MC state
  const [mcSelected, setMcSelected] = useState<string | null>(null)
  const [mcFeedback, setMcFeedback] = useState<'correct' | 'wrong' | null>(null)

  // FITB state
  const [fitbInput, setFitbInput] = useState('')
  const [fitbFeedback, setFitbFeedback] = useState<'correct' | 'wrong' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!done && quiz[idx]?.type === 'fitb') setTimeout(() => inputRef.current?.focus(), 300)
  }, [idx, done, quiz])

  if (vocabulary.length === 0) {
    return (
      <div className="rounded-2xl p-12 text-center"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)', backdropFilter: 'blur(16px)' }}>
        <ListChecks className="w-12 h-12 mx-auto mb-3 text-pink-400 opacity-40" />
        <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>Complete the flashcards step first</p>
      </div>
    )
  }

  const advance = (isCorrect: boolean) => {
    if (isCorrect) setCorrect(c => c + 1)
    setMcSelected(null); setMcFeedback(null)
    setFitbInput(''); setFitbFeedback(null)
    if (idx + 1 >= quiz.length) { setDone(true); onComplete() }
    else setIdx(i => i + 1)
  }

  const handleMC = (choice: string) => {
    if (mcFeedback) return
    const isCorrect = choice === quiz[idx].entry.meaning
    setMcSelected(choice)
    setMcFeedback(isCorrect ? 'correct' : 'wrong')
    setTimeout(() => advance(isCorrect), 900)
  }

  const checkFITB = () => {
    if (fitbFeedback || !fitbInput.trim()) return
    const isCorrect = fitbInput.trim().toLowerCase() === quiz[idx].entry.word.toLowerCase()
    setFitbFeedback(isCorrect ? 'correct' : 'wrong')
  }

  // ── Done screen ──
  if (done) {
    const pct = Math.round((correct / quiz.length) * 100)
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-8 text-center space-y-6"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)', backdropFilter: 'blur(16px)', boxShadow: 'var(--c-card-shadow)' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
          <Trophy className="w-16 h-16 mx-auto text-yellow-400" style={{ filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.5))' }} />
        </motion.div>
        <div>
          <h3 className="text-2xl font-bold" style={{ color: 'var(--c-text-1)' }}>Quiz Complete!</h3>
          <p className="mt-1" style={{ color: 'var(--c-text-2)' }}>
            <span className="font-bold" style={{ color: pct >= 70 ? '#34d399' : '#fb923c' }}>{correct}/{quiz.length}</span> correct — {pct}% accuracy
          </p>
        </div>

        <div className="flex justify-center gap-3">
          {Array.from({ length: quiz.length }).map((_, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: i < correct ? '#34d399' : '#f87171', boxShadow: i < correct ? '0 0 6px #34d399' : 'none' }} />
          ))}
        </div>

        {pct < 70 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-xl p-4 text-left"
            style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-2">Keep practicing these</p>
            <div className="flex flex-wrap gap-2">
              {vocabulary.slice(0, 5).map(v => (
                <span key={v.id} className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                  style={{ background: 'var(--c-bg)', border: '1px solid var(--c-card-border)', color: 'var(--c-text-1)' }}>
                  {v.word}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <Button variant="outline"
          onClick={() => { setIdx(0); setCorrect(0); setDone(false); setMcSelected(null); setMcFeedback(null); setFitbInput(''); setFitbFeedback(null) }}
          className="gap-2 border-pink-500/30 text-pink-600 dark:text-pink-300 hover:bg-pink-500/10">
          <RotateCcw className="w-4 h-4" /> Try Again
        </Button>
      </motion.div>
    )
  }

  const q = quiz[idx]
  const quizProgress = (idx / quiz.length) * 100

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {q.type === 'mc'
            ? <ListChecks className="w-5 h-5 text-pink-500" />
            : <PenLine className="w-5 h-5 text-pink-500" />}
          <span className="font-semibold" style={{ color: 'var(--c-text-1)' }}>
            {q.type === 'mc' ? 'Multiple Choice' : 'Fill in the Blank'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)' }}>
            {idx + 1}/{quiz.length}
          </span>
        </div>
        <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> {correct} correct
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--c-card-border)' }}>
        <motion.div className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #db2777, #ec4899)' }}
          animate={{ width: `${quizProgress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

          {/* ── Multiple Choice ── */}
          {q.type === 'mc' && (
            <div className="space-y-4">
              <div className="rounded-2xl p-8 text-center"
                style={{ background: 'var(--c-card)', border: '1px solid rgba(236,72,153,0.25)', backdropFilter: 'blur(16px)', boxShadow: 'var(--c-card-shadow)' }}>
                <p className="text-xs font-semibold text-pink-500 uppercase tracking-widest mb-4">What does this mean?</p>
                <p className="text-4xl font-bold tracking-tight" style={{ color: 'var(--c-text-1)' }}>{q.entry.word}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {q.choices!.map((choice, i) => {
                  const isCorrect = choice === q.entry.meaning
                  const isSelected = mcSelected === choice
                  let bg = 'var(--c-card)'
                  let border = '1px solid var(--c-card-border)'
                  let color = 'var(--c-text-1)'
                  if (mcFeedback && isSelected && !isCorrect) { bg = 'rgba(239,68,68,0.12)'; border = '1px solid rgba(239,68,68,0.4)'; color = '#f87171' }
                  if (mcFeedback && isCorrect) { bg = 'rgba(52,211,153,0.12)'; border = '1px solid rgba(52,211,153,0.4)'; color = '#34d399' }
                  return (
                    <button key={i} onClick={() => handleMC(choice)} disabled={!!mcFeedback}
                      className="rounded-xl px-4 py-3.5 text-sm font-medium text-left transition-all active:scale-95 disabled:cursor-default"
                      style={{ background: bg, border, color }}>
                      <span className="text-xs opacity-40 mr-2 font-normal">{String.fromCharCode(65 + i)}.</span>
                      {choice}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Fill in the Blank ── */}
          {q.type === 'fitb' && (
            <div className="space-y-4">
              <div className="rounded-2xl p-8"
                style={{ background: 'var(--c-card)', border: '1px solid rgba(236,72,153,0.25)', backdropFilter: 'blur(16px)', boxShadow: 'var(--c-card-shadow)' }}>
                <p className="text-xs font-semibold text-pink-500 uppercase tracking-widest mb-5 text-center">Type the missing word</p>
                <p className="text-lg leading-relaxed text-center" style={{ color: 'var(--c-text-1)' }}>
                  {q.sentence!.split('___').map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="inline-block mx-1 px-4 py-0.5 rounded-lg font-bold"
                          style={{ background: 'rgba(236,72,153,0.12)', border: '1px dashed rgba(236,72,153,0.35)', color: '#ec4899', minWidth: 90, textAlign: 'center' }}>
                          {fitbFeedback ? q.entry.word : '___'}
                        </span>
                      )}
                    </span>
                  ))}
                </p>
              </div>

              {!fitbFeedback ? (
                <div className="flex gap-3">
                  <input ref={inputRef} value={fitbInput}
                    onChange={e => setFitbInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fitbInput.trim() && checkFITB()}
                    placeholder="Type the word..."
                    className="flex-1 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-500/30"
                    style={{ background: 'var(--c-input-bg)', border: '1px solid var(--c-input-border)', color: 'var(--c-text-1)' }} />
                  <button onClick={checkFITB} disabled={!fitbInput.trim()}
                    className="px-5 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-40"
                    style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.3)', color: '#ec4899' }}>
                    Check
                  </button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="rounded-xl p-4 flex items-center gap-3"
                    style={fitbFeedback === 'correct'
                      ? { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }
                      : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    {fitbFeedback === 'correct'
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      : <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                    <div>
                      <p className="text-sm font-semibold" style={{ color: fitbFeedback === 'correct' ? '#34d399' : '#f87171' }}>
                        {fitbFeedback === 'correct' ? 'Correct!' : `Answer: "${q.entry.word}"`}
                      </p>
                      {fitbFeedback === 'wrong' && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>You wrote: &ldquo;{fitbInput.trim()}&rdquo;</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => advance(fitbFeedback === 'correct')}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
                    style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.3)', color: '#ec4899' }}>
                    Next →
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
