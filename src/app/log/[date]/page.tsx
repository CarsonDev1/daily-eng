'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { format, parseISO, isValid } from 'date-fns'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  useDailyLog, useUpsertDailyLog,
  useVocabularyEntries, useWritingSession,
} from '@/hooks/useDailyLog'
import { VocabularyStep } from '@/components/daily-log/VocabularyStep'
import { WritingStep }    from '@/components/daily-log/WritingStep'
import { ReviewStep }     from '@/components/daily-log/ReviewStep'
import { FlashcardStep }  from '@/components/daily-log/FlashcardStep'
import { Skeleton }       from '@/components/ui/skeleton'
import { DailyLog }       from '@/lib/supabase'
import {
  BookOpen, BrainCircuit, PenLine,
  ClipboardCheck, Clock, ChevronRight,
  CheckCircle2, Circle,
} from 'lucide-react'

// ─── Steps config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'vocabulary',  label: 'Vocabulary',  sub: '10 new words',       icon: BookOpen,       emoji: '📚', color: '#60a5fa', num: 1 },
  { id: 'flashcards',  label: 'Flashcards',  sub: 'Review & memorise',  icon: BrainCircuit,   emoji: '🧠', color: '#a78bfa', num: 2 },
  { id: 'writing',     label: 'Writing',     sub: '5–8 sentences',      icon: PenLine,        emoji: '✍️', color: '#34d399', num: 3 },
  { id: 'review',      label: 'Review',      sub: 'Self-reflect',       icon: ClipboardCheck, emoji: '⭐', color: '#fb923c', num: 4 },
] as const

type StepId = typeof STEPS[number]['id']

// ─── Animation variants ───────────────────────────────────────────────────────

const slideIn: Variants = {
  hidden: { opacity: 0, x: 24 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit:   { opacity: 0, x: -24, transition: { duration: 0.2 } },
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  activeStep, setActiveStep,
  log, vocabCount, writingDone, journalDone, flashcardsDone,
  onUpdateLog,
}: {
  activeStep: StepId
  setActiveStep: (s: StepId) => void
  date: string
  log: DailyLog | null | undefined
  vocabCount: number
  writingDone: boolean
  journalDone: boolean
  flashcardsDone: boolean
  onUpdateLog: (f: Partial<DailyLog>) => void
}) {
  const checklist = {
    learned_10_words:    vocabCount >= 10,
    reviewed_flashcards: flashcardsDone,
    finished_writing:    writingDone,
    wrote_journal:       journalDone,
  }
  const completedCount = Object.values(checklist).filter(Boolean).length
  const S = { background: 'var(--c-card)', border: '1px solid var(--c-card-border)', backdropFilter: 'blur(16px)' }

  const checklistItems = [
    { key: 'learned_10_words',    label: '10 words learned',   done: checklist.learned_10_words,    emoji: '📚', color: '#60a5fa' },
    { key: 'reviewed_flashcards', label: 'Flashcards done',    done: checklist.reviewed_flashcards,  emoji: '🧠', color: '#a78bfa' },
    { key: 'finished_writing',    label: 'Writing done',       done: checklist.finished_writing,     emoji: '✍️', color: '#34d399' },
    { key: 'wrote_journal',       label: 'Mini journal',       done: checklist.wrote_journal,        emoji: '⭐', color: '#fb923c' },
  ]

  return (
    <aside className="w-56 shrink-0 sticky top-20 self-start space-y-3">

      {/* Progress */}
      <div className="rounded-2xl p-4" style={S}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold" style={{ color: 'var(--c-text-2)' }}>
            Week {log?.week_number ?? 1}
          </span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: completedCount === 4 ? 'rgba(52,211,153,0.15)' : 'var(--c-accent-bg)',
              color: completedCount === 4 ? '#34d399' : '#a78bfa',
              border: completedCount === 4 ? '1px solid rgba(52,211,153,0.3)' : '1px solid var(--c-accent-border)',
            }}
          >
            {completedCount}/4 {completedCount === 4 ? '🔥' : ''}
          </span>
        </div>
        {/* Animated progress bar */}
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--c-input-bg)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #7c3aed, #60a5fa, #a78bfa, #60a5fa, #7c3aed)',
              backgroundSize: '200% 100%',
            }}
            animate={{
              width: `${(completedCount / 4) * 100}%`,
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              width: { type: 'spring', stiffness: 120, damping: 20 },
              backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
            }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                background: (s.id === 'vocabulary' ? checklist.learned_10_words
                  : s.id === 'flashcards' ? checklist.reviewed_flashcards
                  : s.id === 'writing' ? checklist.finished_writing
                  : checklist.wrote_journal)
                  ? s.color : 'var(--c-input-border)',
                boxShadow: (s.id === 'vocabulary' ? checklist.learned_10_words
                  : s.id === 'flashcards' ? checklist.reviewed_flashcards
                  : s.id === 'writing' ? checklist.finished_writing
                  : checklist.wrote_journal)
                  ? `0 0 6px ${s.color}` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Step navigation */}
      <nav className="rounded-2xl p-2 space-y-1" style={S}>
        {STEPS.map((step) => {
          const isActive = activeStep === step.id
          const Icon = step.icon
          const done = step.id === 'vocabulary' ? checklist.learned_10_words
                     : step.id === 'flashcards' ? checklist.reviewed_flashcards
                     : step.id === 'writing'     ? checklist.finished_writing
                     : checklist.wrote_journal

          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200"
              style={isActive ? {
                background: `${step.color}14`,
                border: `1px solid ${step.color}35`,
                boxShadow: `0 0 14px ${step.color}18`,
              } : {
                background: 'transparent',
                border: '1px solid transparent',
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all text-base"
                style={isActive ? {
                  background: `${step.color}20`,
                  border: `1px solid ${step.color}40`,
                  boxShadow: `0 0 10px ${step.color}25`,
                } : {
                  background: 'var(--c-input-bg)',
                  border: '1px solid var(--c-input-border)',
                }}
              >
                {isActive ? step.emoji : <Icon className="w-4 h-4" style={{ color: 'var(--c-text-3)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-none mb-0.5 truncate"
                  style={{ color: isActive ? step.color : 'var(--c-text-2)' }}>
                  {step.label}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--c-text-3)' }}>{step.sub}</p>
              </div>
              {done
                ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                : isActive
                  ? <ChevronRight className="w-4 h-4 shrink-0" style={{ color: step.color }} />
                  : <Circle className="w-4 h-4 shrink-0" style={{ color: 'var(--c-text-3)', opacity: 0.4 }} />
              }
            </button>
          )
        })}
      </nav>

      {/* Session info */}
      <div className="rounded-2xl p-4 space-y-3" style={S}>
        <p className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--c-text-3)' }}>
          <Clock className="w-3 h-3" /> Session
        </p>
        <CompactField label="Topic" value={log?.topic ?? ''} placeholder="e.g. Travel..."
          onBlur={(v) => onUpdateLog({ topic: v || null })} />
        <div className="grid grid-cols-2 gap-2">
          <CompactField label="Start" value={log?.started_at ?? ''} type="time" onBlur={(v) => onUpdateLog({ started_at: v || null })} />
          <CompactField label="End"   value={log?.finished_at ?? ''} type="time" onBlur={(v) => onUpdateLog({ finished_at: v || null })} />
        </div>
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--c-text-3)' }}>Week</p>
          <div className="flex gap-1">
            {[1,2,3,4].map((w) => {
              const active = (log?.week_number ?? 1) === w
              return (
                <button key={w} onClick={() => onUpdateLog({ week_number: w })}
                  className="flex-1 py-1 text-xs rounded-lg font-bold transition-all"
                  style={{
                    background: active ? 'var(--c-accent-bg)' : 'var(--c-input-bg)',
                    color: active ? '#a78bfa' : 'var(--c-text-2)',
                    border: active ? '1px solid var(--c-accent-border)' : '1px solid var(--c-input-border)',
                    boxShadow: active ? '0 0 8px rgba(167,139,250,0.2)' : 'none',
                  }}>
                  {w}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tonight's checklist */}
      <div className="rounded-2xl p-4 space-y-2" style={S}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--c-text-3)' }}>
          🌙 Tonight
        </p>
        {checklistItems.map(({ key, label, done, emoji, color }) => (
          <div key={key} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-all"
            style={done ? { background: `${color}10`, border: `1px solid ${color}25` } : { border: '1px solid transparent' }}>
            <span className="text-sm shrink-0">{emoji}</span>
            <span
              className="text-xs flex-1 transition-colors"
              style={{
                color: done ? color : 'var(--c-text-2)',
                textDecoration: done ? 'line-through' : 'none',
                opacity: done ? 0.85 : 1,
              }}
            >
              {label}
            </span>
            {done && (
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
            )}
          </div>
        ))}
        {completedCount === 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 pt-3 text-center"
            style={{ borderTop: '1px solid var(--c-card-border)' }}
          >
            <span className="text-xs text-emerald-500 font-bold">All done! Keep the streak! 🔥</span>
          </motion.div>
        )}
      </div>
    </aside>
  )
}

// ─── Compact text field ───────────────────────────────────────────────────────

function CompactField({
  label, value, placeholder = '', type = 'text', onBlur,
}: {
  label: string; value: string; placeholder?: string; type?: string
  onBlur: (v: string) => void
}) {
  return (
    <div>
      <p className="text-xs mb-1" style={{ color: 'var(--c-text-3)' }}>{label}</p>
      <input
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        onBlur={(e) => onBlur(e.target.value)}
        className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors focus:ring-1 focus:ring-violet-500/30"
        style={{
          background: 'var(--c-input-bg)',
          border: '1px solid var(--c-input-border)',
          color: 'var(--c-text-1)',
        }}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LogPage() {
  const { date } = useParams<{ date: string }>()
  const [activeStep, setActiveStep] = useState<StepId>('vocabulary')

  const { data: log, isLoading: logLoading, error: logError } = useDailyLog(date)
  const { data: vocabulary = [], isLoading: vocabLoading } = useVocabularyEntries(date)
  const { data: writing } = useWritingSession(date)
  const upsertLog = useUpsertDailyLog()

  const parsedDate = parseISO(date)
  const displayDate = isValid(parsedDate) ? format(parsedDate, 'EEEE, MMMM d') : date
  const displayYear = isValid(parsedDate) ? format(parsedDate, 'yyyy') : ''

  const checklist: DailyLog['checklist'] = log?.checklist ?? {
    learned_10_words: false, finished_writing: false,
    wrote_journal: false,    reviewed_flashcards: false,
  }

  const handleFlashcardComplete = () => {
    upsertLog.mutate({ date, checklist: { ...checklist, reviewed_flashcards: true }, week_number: log?.week_number ?? 1 })
  }

  // ── Error state ──
  if (logError) {
    return (
      <div
        className="rounded-2xl p-8 text-center space-y-3 max-w-lg mx-auto mt-12"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
      >
        <p className="text-red-500 font-semibold text-lg">🔌 Database not connected</p>
        <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>
          Run{' '}
          <code
            className="px-1.5 py-0.5 rounded text-xs font-mono"
            style={{ background: 'var(--c-input-bg)', border: '1px solid var(--c-input-border)', color: 'var(--c-text-1)' }}
          >
            supabase-schema.sql
          </code>{' '}
          in your Supabase SQL Editor, then add your env variables.
        </p>
      </div>
    )
  }

  // ── Loading state ──
  if (logLoading) {
    return (
      <div className="flex gap-6">
        <div className="w-56 shrink-0 space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" style={{ background: 'var(--c-card-border)' }} />
          <Skeleton className="h-60 w-full rounded-2xl" style={{ background: 'var(--c-card-border)' }} />
          <Skeleton className="h-36 w-full rounded-2xl" style={{ background: 'var(--c-card-border)' }} />
        </div>
        <div className="flex-1 space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" style={{ background: 'var(--c-card-border)' }} />
          <Skeleton className="h-96 w-full rounded-2xl" style={{ background: 'var(--c-card-border)' }} />
        </div>
      </div>
    )
  }

  const nextStepConfig = STEPS[STEPS.findIndex(s => s.id === activeStep) + 1]

  return (
    <div className="flex gap-5 items-start">
      {/* ── Sidebar — hidden on mobile ── */}
      <div className="hidden md:block">
        <Sidebar
          activeStep={activeStep}
          setActiveStep={setActiveStep}
          date={date}
          log={log}
          vocabCount={vocabulary.length}
          writingDone={!!writing?.content}
          journalDone={!!writing?.mini_journal}
          flashcardsDone={checklist.reviewed_flashcards}
          onUpdateLog={(fields) => upsertLog.mutate({ date, week_number: log?.week_number ?? 1, ...fields })}
        />
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 pb-20 md:pb-0">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="float text-3xl select-none">🚀</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight gradient-text">
                {displayDate}
                <span className="text-base font-normal opacity-60 ml-2" style={{ color: 'var(--c-text-3)', WebkitTextFillColor: 'var(--c-text-3)' }}>
                  {displayYear}
                </span>
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--c-text-2)' }}>
                Daily English Session · Let&apos;s level up ✨
              </p>
            </div>
          </div>

          {/* Step indicator strip (mobile visible, desktop hidden) */}
          <div className="flex gap-2 mt-4 md:hidden">
            {STEPS.map((step) => {
              const isActive = activeStep === step.id
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={isActive ? {
                    background: `${step.color}18`,
                    border: `1px solid ${step.color}40`,
                    color: step.color,
                  } : {
                    background: 'var(--c-card)',
                    border: '1px solid var(--c-card-border)',
                    color: 'var(--c-text-3)',
                  }}
                >
                  {step.emoji}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Active step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            variants={slideIn}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {activeStep === 'vocabulary' && (
              <VocabularyStep date={date} log={log} vocabulary={vocabulary} isLoading={vocabLoading} />
            )}
            {activeStep === 'flashcards' && (
              <FlashcardStep vocabulary={vocabulary} onComplete={handleFlashcardComplete} />
            )}
            {activeStep === 'writing' && (
              <WritingStep date={date} log={log} vocabulary={vocabulary} writing={writing ?? null} />
            )}
            {activeStep === 'review' && (
              <ReviewStep date={date} log={log} writing={writing ?? null} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Next step nudge */}
        {nextStepConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 flex justify-end"
          >
            <button
              onClick={() => setActiveStep(nextStepConfig.id)}
              className="flex items-center gap-2 text-xs rounded-xl px-3 py-2 transition-all"
              style={{
                color: nextStepConfig.color,
                background: `${nextStepConfig.color}10`,
                border: `1px solid ${nextStepConfig.color}25`,
              }}
            >
              <span>{nextStepConfig.emoji}</span>
              Next: {nextStepConfig.label}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Mobile bottom nav ── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{
          background: 'var(--c-nav-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--c-nav-border)',
        }}
      >
        {STEPS.map((step) => {
          const isActive = activeStep === step.id
          const Icon = step.icon
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all"
              style={{ color: isActive ? step.color : 'var(--c-text-3)' }}
            >
              {isActive
                ? <span className="text-xl">{step.emoji}</span>
                : <Icon className="w-5 h-5" />
              }
              <span className="text-[10px] font-medium">{step.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: step.color, boxShadow: `0 0 4px ${step.color}` }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
