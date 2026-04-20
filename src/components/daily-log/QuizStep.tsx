'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VocabularyEntry } from '@/lib/supabase'
import { CheckCircle2, XCircle, Trophy, RotateCcw, PenLine, ListChecks } from 'lucide-react'

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

  const [mcSelected, setMcSelected] = useState<string | null>(null)
  const [mcFeedback, setMcFeedback] = useState<'correct' | 'wrong' | null>(null)

  const [fitbInput, setFitbInput] = useState('')
  const [fitbFeedback, setFitbFeedback] = useState<'correct' | 'wrong' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!done && quiz[idx]?.type === 'fitb') setTimeout(() => inputRef.current?.focus(), 300)
  }, [idx, done, quiz])

  if (vocabulary.length === 0) {
    return (
      <div className="card-editorial p-12 text-center">
        <ListChecks style={{ width: 48, height: 48, margin: '0 auto 12px', color: 'var(--ink-3)', opacity: 0.4 }} />
        <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>Complete the flashcards step first</p>
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

  if (done) {
    const pct = Math.round((correct / quiz.length) * 100)
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="card-editorial p-8 text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
          <Trophy style={{ width: 64, height: 64, margin: '0 auto', color: 'var(--saffron)' }} />
        </motion.div>
        <div>
          <h3 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 28, color: 'var(--ink)', marginBottom: 4 }}>Quiz Complete!</h3>
          <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>
            <span style={{ fontWeight: 700, color: pct >= 70 ? 'var(--lime)' : 'var(--coral)' }}>{correct}/{quiz.length}</span> correct — {pct}% accuracy
          </p>
        </div>

        <div className="flex justify-center gap-2">
          {Array.from({ length: quiz.length }).map((_, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < correct ? 'var(--lime)' : 'var(--coral)' }} />
          ))}
        </div>

        {pct < 70 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ padding: '12px 16px', background: 'var(--blush)', border: '1.5px solid var(--coral)', borderRadius: 12, textAlign: 'left' }}>
            <p className="caps" style={{ fontSize: 10, color: 'var(--coral)', marginBottom: 8 }}>Keep practicing these</p>
            <div className="flex flex-wrap gap-2">
              {vocabulary.slice(0, 5).map(v => (
                <span key={v.id} style={{ padding: '3px 10px', border: '1.5px solid var(--line-soft)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--ink)', background: 'var(--paper)' }}>
                  {v.word}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <button
          onClick={() => { setIdx(0); setCorrect(0); setDone(false); setMcSelected(null); setMcFeedback(null); setFitbInput(''); setFitbFeedback(null) }}
          className="btn-action ghost sm"
          style={{ margin: '0 auto' }}
        >
          <RotateCcw style={{ width: 14, height: 14 }} /> Try Again
        </button>
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
            ? <ListChecks style={{ width: 18, height: 18, color: 'var(--ink-2)' }} />
            : <PenLine style={{ width: 18, height: 18, color: 'var(--ink-2)' }} />}
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
            {q.type === 'mc' ? 'Multiple Choice' : 'Fill in the Blank'}
          </span>
          <span style={{ padding: '2px 8px', border: '1.5px solid var(--line-soft)', borderRadius: 999, fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', background: 'var(--chip)' }}>
            {idx + 1}/{quiz.length}
          </span>
        </div>
        <span className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 500, color: 'var(--lime)' }}>
          <CheckCircle2 style={{ width: 13, height: 13 }} /> {correct} correct
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 999, background: 'var(--line-soft)', overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', borderRadius: 999, background: 'var(--coral)' }}
          animate={{ width: `${quizProgress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

          {/* Multiple Choice */}
          {q.type === 'mc' && (
            <div className="space-y-4">
              <div className="card-editorial p-8 text-center">
                <p className="caps" style={{ fontSize: 10, color: 'var(--coral)', marginBottom: 16 }}>What does this mean?</p>
                <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 40, color: 'var(--ink)' }}>{q.entry.word}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {q.choices!.map((choice, i) => {
                  const isCorrect = choice === q.entry.meaning
                  const isSelected = mcSelected === choice
                  let bg = 'var(--paper-2)'
                  let border = '1.5px solid var(--line-soft)'
                  let color = 'var(--ink-2)'
                  if (mcFeedback && isSelected && !isCorrect) { bg = 'var(--blush)'; border = '1.5px solid var(--coral)'; color = 'var(--coral)' }
                  if (mcFeedback && isCorrect) { bg = 'rgba(125,219,168,0.15)'; border = '1.5px solid var(--mint)'; color = 'var(--ink)' }
                  return (
                    <button key={i} onClick={() => handleMC(choice)} disabled={!!mcFeedback}
                      className="text-left transition-all active:scale-95 disabled:cursor-default"
                      style={{ borderRadius: 12, padding: '12px 14px', fontSize: 14, background: bg, border, color, boxShadow: 'var(--shadow-sm)' }}>
                      <span style={{ fontSize: 11, opacity: 0.5, marginRight: 6 }}>{String.fromCharCode(65 + i)}.</span>
                      {choice}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Fill in the Blank */}
          {q.type === 'fitb' && (
            <div className="space-y-4">
              <div className="card-editorial p-8">
                <p className="caps text-center" style={{ fontSize: 10, color: 'var(--coral)', marginBottom: 20 }}>Type the missing word</p>
                <p style={{ fontSize: 17, lineHeight: 1.8, textAlign: 'center', color: 'var(--ink)' }}>
                  {q.sentence!.split('___').map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span style={{ display: 'inline-block', margin: '0 4px', padding: '2px 16px', borderRadius: 8, fontWeight: 700, background: 'var(--blush)', border: '1px dashed var(--coral)', color: 'var(--coral)', minWidth: 90, textAlign: 'center' }}>
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
                    style={{ flex: 1, borderRadius: 12, padding: '12px 16px', fontSize: 14, background: 'var(--paper-2)', border: '1.5px solid var(--line-soft)', color: 'var(--ink)', outline: 'none' }}
                  />
                  <button onClick={checkFITB} disabled={!fitbInput.trim()}
                    className="btn-action coral sm"
                    style={{ opacity: fitbInput.trim() ? 1 : 0.4 }}>
                    Check
                  </button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div style={{ borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
                    background: fitbFeedback === 'correct' ? 'rgba(125,219,168,0.12)' : 'var(--blush)',
                    border: `1.5px solid ${fitbFeedback === 'correct' ? 'var(--mint)' : 'var(--coral)'}` }}>
                    {fitbFeedback === 'correct'
                      ? <CheckCircle2 style={{ width: 18, height: 18, color: 'var(--mint)', flexShrink: 0 }} />
                      : <XCircle style={{ width: 18, height: 18, color: 'var(--coral)', flexShrink: 0 }} />}
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: fitbFeedback === 'correct' ? 'var(--lime)' : 'var(--coral)' }}>
                        {fitbFeedback === 'correct' ? 'Correct!' : `Answer: "${q.entry.word}"`}
                      </p>
                      {fitbFeedback === 'wrong' && (
                        <p style={{ fontSize: 12, marginTop: 2, color: 'var(--ink-3)' }}>You wrote: &ldquo;{fitbInput.trim()}&rdquo;</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => advance(fitbFeedback === 'correct')}
                    className="btn-action coral sm w-full justify-center">
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
