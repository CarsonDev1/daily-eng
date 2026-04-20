'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format, parseISO, isValid } from 'date-fns'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  useDailyLog, useUpsertDailyLog,
  useVocabularyEntries, useWritingSession, useUpsertProgressDay,
} from '@/hooks/useDailyLog'
import { VocabularyStep }      from '@/components/daily-log/VocabularyStep'
import { WritingStep }          from '@/components/daily-log/WritingStep'
import { ReviewStep }           from '@/components/daily-log/ReviewStep'
import { FlashcardStep }        from '@/components/daily-log/FlashcardStep'
import { SpacedRepetitionStep } from '@/components/daily-log/SpacedRepetitionStep'
import { QuizStep }             from '@/components/daily-log/QuizStep'
import { AnalyzeStep }          from '@/components/daily-log/AnalyzeStep'
import { Skeleton }             from '@/components/ui/skeleton'
import { DailyLog }             from '@/lib/supabase'
import {
  BookOpen, BrainCircuit, PenLine,
  ClipboardCheck, RefreshCw, Target, Languages,
} from 'lucide-react'

// ─── Steps config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'vocabulary',  label: 'Vocabulary',    sub: '10 new words',       icon: BookOpen,       num: '01' },
  { id: 'spaced-rep',  label: 'Spaced Review', sub: 'Yesterday & beyond', icon: RefreshCw,      num: '02' },
  { id: 'flashcards',  label: 'Flashcards',    sub: 'Flip & memorise',    icon: BrainCircuit,   num: '03' },
  { id: 'quiz',        label: 'Quiz',          sub: 'MC + fill-in-blank', icon: Target,         num: '04' },
  { id: 'writing',     label: 'Writing',       sub: '5–8 sentences',      icon: PenLine,        num: '05' },
  { id: 'analyze',     label: 'Analyze',       sub: 'Fix "Việt hóa"',     icon: Languages,      num: '06' },
  { id: 'review',      label: 'Reflect',       sub: 'End of session',     icon: ClipboardCheck, num: '07' },
] as const

type StepId = typeof STEPS[number]['id']
type DoneMap = Record<StepId, boolean>

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: size, height: size }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 16, height: 16 }}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

// ─── Compact field ────────────────────────────────────────────────────────────

function CompactField({
  label, value, placeholder = '', type = 'text', onBlur,
}: {
  label: string; value: string; placeholder?: string; type?: string
  onBlur: (v: string) => void
}) {
  return (
    <div>
      <div className="caps" style={{ color: 'var(--ink-3)', marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        onBlur={(e) => onBlur(e.target.value)}
        style={{
          width: '100%', padding: '8px 10px',
          border: '1.5px solid var(--ink)',
          borderRadius: 8,
          background: 'var(--paper)',
          color: 'var(--ink)',
          fontFamily: 'inherit',
          fontSize: 14, fontWeight: 500,
          outline: 'none',
        }}
      />
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  activeStep, setActiveStep,
  log, doneMap, completedCount,
  onUpdateLog,
}: {
  activeStep: StepId
  setActiveStep: (s: StepId) => void
  log: DailyLog | null | undefined
  doneMap: DoneMap
  completedCount: number
  onUpdateLog: (f: Partial<DailyLog>) => void
}) {
  return (
    <aside style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Progress hero */}
      <div style={{
        padding: '18px 20px 20px',
        background: 'var(--ink)', color: 'var(--paper)',
        border: '1.5px solid var(--ink)',
        borderRadius: 14, boxShadow: 'var(--shadow)',
      }}>
        <div className="caps" style={{ opacity: 0.7 }}>
          Week {log?.week_number ?? 1} · Session today
        </div>
        <div style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 52, lineHeight: 1, margin: '10px 0 4px' }}>
          <em style={{ fontStyle: 'italic', color: 'var(--lime)' }}>{completedCount}</em>
          <span style={{ fontSize: 24, opacity: 0.5 }}>/{STEPS.length}</span>
        </div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>stations completed today</div>
        <div style={{ display: 'flex', gap: 5, marginTop: 16 }}>
          {STEPS.map((s) => (
            <div
              key={s.id}
              style={{
                flex: 1, height: 10, borderRadius: 999,
                background: doneMap[s.id] ? 'var(--lime)' : 'rgba(255,255,255,0.14)',
                border: doneMap[s.id] ? '1.5px solid var(--lime)' : '1.5px solid transparent',
              }}
            />
          ))}
        </div>
      </div>

      {/* Route map */}
      <div style={{
        background: 'var(--paper-2)',
        border: '1.5px solid var(--ink)',
        borderRadius: 14, boxShadow: 'var(--shadow)',
        padding: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="caps" style={{ color: 'var(--ink-3)' }}>Today&apos;s route</span>
          <span style={{
            padding: '4px 10px',
            border: '1.5px solid var(--ink)', borderRadius: 999,
            fontSize: 12, fontWeight: 600,
            background: 'var(--lime)', color: '#fff',
          }}>
            {completedCount}/{STEPS.length}
          </span>
        </div>

        <div style={{ position: 'relative', paddingLeft: 4 }}>
          {/* Vertical connector line */}
          <div style={{
            position: 'absolute', left: 17, top: 14, bottom: 14,
            width: 2.5, background: 'var(--ink)', borderRadius: 2, zIndex: 0,
          }} />

          {STEPS.map((s) => {
            const done   = doneMap[s.id]
            const active = activeStep === s.id
            return (
              <div
                key={s.id}
                className={`route-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}
                onClick={() => setActiveStep(s.id)}
              >
                <div className="route-step-node">
                  {done ? <CheckIcon /> : parseInt(s.num)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600, fontSize: 14, lineHeight: 1.2,
                    color: done ? 'var(--ink-3)' : 'var(--ink)',
                    textDecoration: done ? 'line-through' : 'none',
                    textDecorationThickness: '1.5px',
                  }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{s.sub}</div>
                </div>
                <div style={{
                  width: 20, height: 20,
                  border: '1.5px solid var(--ink)', borderRadius: 6,
                  background: done ? 'var(--ink)' : 'var(--paper-2)',
                  flexShrink: 0, display: 'grid', placeItems: 'center',
                  color: 'var(--paper)',
                }}>
                  {done && <CheckIcon />}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Session ticket */}
      <div style={{
        background: 'var(--paper-2)',
        border: '1.5px solid var(--ink)',
        borderRadius: 14, boxShadow: 'var(--shadow)',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ position: 'absolute', width: 14, height: 14, background: 'var(--paper)', border: '1.5px solid var(--ink)', borderRadius: '50%', left: -8, top: 'calc(50% - 7px)' }} />
        <div style={{ position: 'absolute', width: 14, height: 14, background: 'var(--paper)', border: '1.5px solid var(--ink)', borderRadius: '50%', right: -8, top: 'calc(50% - 7px)' }} />
        <div style={{
          background: 'var(--ink)', color: 'var(--paper)',
          padding: '10px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          <span>Session Ticket</span>
          <span style={{ fontFamily: 'var(--font-mono, monospace)', opacity: 0.7 }}>
            № 0420 · W{log?.week_number ?? 1}
          </span>
        </div>
        <div style={{ padding: '16px 20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <CompactField
            label="Topic today"
            value={log?.topic ?? ''}
            placeholder="e.g. Travel..."
            onBlur={(v) => onUpdateLog({ topic: v || null })}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <CompactField label="Start" value={log?.started_at ?? ''} type="time" onBlur={(v) => onUpdateLog({ started_at: v || null })} />
            <CompactField label="End"   value={log?.finished_at ?? ''} type="time" onBlur={(v) => onUpdateLog({ finished_at: v || null })} />
          </div>
          <div>
            <div className="caps" style={{ color: 'var(--ink-3)', marginBottom: 6 }}>Week of sprint</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1,2,3,4].map((w) => {
                const active = (log?.week_number ?? 1) === w
                return (
                  <button
                    key={w}
                    onClick={() => onUpdateLog({ week_number: w })}
                    style={{
                      flex: 1, padding: '8px 0',
                      border: '1.5px solid var(--ink)', borderRadius: 8,
                      background: active ? 'var(--saffron)' : 'var(--paper)',
                      boxShadow: active ? 'var(--shadow-sm)' : 'none',
                      fontFamily: 'var(--font-serif, serif)',
                      fontSize: 18, lineHeight: 1,
                      cursor: 'pointer', color: 'var(--ink)',
                    }}
                  >
                    {w}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ─── Right Rail ───────────────────────────────────────────────────────────────

function RightRail({ doneMap }: { doneMap: DoneMap }) {
  const items: { key: StepId; label: string; time: string }[] = [
    { key: 'vocabulary', label: '10 words learned',   time: '30m' },
    { key: 'spaced-rep', label: 'Spaced review done', time: '10m' },
    { key: 'flashcards', label: 'Flashcards flipped', time: '10m' },
    { key: 'quiz',       label: 'Quiz passed',        time: '10m' },
    { key: 'writing',    label: 'Writing complete',   time: '20m' },
    { key: 'review',     label: 'Reflection written', time: '5m'  },
  ]
  const doneCount = items.filter((i) => doneMap[i.key]).length

  return (
    <aside style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Tonight checklist */}
      <div style={{
        background: 'var(--paper-2)',
        border: '1.5px solid var(--ink)',
        borderRadius: 14, boxShadow: 'var(--shadow)',
        padding: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="caps" style={{ color: 'var(--ink-3)' }}>Tonight</div>
            <div style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 26, marginTop: 2, lineHeight: 1 }}>
              Checklist <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>moon</em>
            </div>
          </div>
          <span style={{
            padding: '4px 10px',
            border: '1.5px solid var(--ink)', borderRadius: 999,
            fontSize: 12, fontWeight: 600,
            background: 'var(--coral)', color: '#fff',
          }}>
            {doneCount}/6
          </span>
        </div>

        <div>
          {items.map((it) => {
            const done = doneMap[it.key]
            return (
              <div key={it.key} className={`tonight-item ${done ? 'done' : ''}`}>
                <div className="tonight-item-bullet">
                  {done && <CheckIcon />}
                </div>
                <span style={{
                  fontSize: 13, flex: 1,
                  color: done ? 'var(--ink-3)' : 'var(--ink)',
                  textDecoration: done ? 'line-through' : 'none',
                }}>
                  {it.label}
                </span>
                <span style={{
                  fontSize: 10, padding: '2px 7px',
                  border: '1.5px solid var(--ink)', borderRadius: 999,
                  background: 'var(--paper-2)', fontWeight: 600,
                }}>
                  {it.time}
                </span>
              </div>
            )
          })}
        </div>

        {doneCount === items.length && (
          <div style={{
            marginTop: 14, padding: '12px 14px',
            background: 'var(--mint)',
            border: '1.5px solid var(--ink)', borderRadius: 10,
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, lineHeight: 1.1 }}>
              Keep the <em style={{ fontStyle: 'italic' }}>streak</em>.
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4 }}>Show up again tomorrow ▶</div>
          </div>
        )}
      </div>

      {/* Coach's note */}
      <div style={{
        background: 'var(--ink)', color: 'var(--paper)',
        border: '1.5px solid var(--ink)',
        borderRadius: 14, boxShadow: 'var(--shadow)',
        padding: 20,
      }}>
        <div className="caps" style={{ color: 'var(--saffron)' }}>Coach&apos;s note</div>
        <div style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, lineHeight: 1.2, marginTop: 8 }}>
          Don&apos;t aim for{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--lime)' }}>perfect</em>.
          {' '}Aim for{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>done</em>.
        </div>
        <p style={{ fontSize: 13, opacity: 0.72, marginTop: 10, lineHeight: 1.5 }}>
          A messy 5-sentence paragraph beats a flawless one you never finish. Write, then fix.
        </p>
      </div>
    </aside>
  )
}

// ─── Animation ────────────────────────────────────────────────────────────────

const slideIn: Variants = {
  hidden: { opacity: 0, x: 24 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit:   { opacity: 0, x: -24, transition: { duration: 0.2 } },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LogPage() {
  const { date } = useParams<{ date: string }>()
  const [activeStep, setActiveStep] = useState<StepId>('vocabulary')

  const { data: log, isLoading: logLoading, error: logError } = useDailyLog(date)
  const { data: vocabulary = [], isLoading: vocabLoading } = useVocabularyEntries(date)
  const { data: writing } = useWritingSession(date)
  const upsertLog = useUpsertDailyLog()
  const upsertProgressDay = useUpsertProgressDay()

  const parsedDate = parseISO(date)
  const dow = isValid(parsedDate) ? format(parsedDate, 'EEEE') : ''
  const mo  = isValid(parsedDate) ? format(parsedDate, 'MMMM') : ''
  const day = isValid(parsedDate) ? format(parsedDate, 'd') : ''

  const checklist: DailyLog['checklist'] = log?.checklist ?? {
    learned_10_words: false, finished_writing: false,
    wrote_journal: false, reviewed_flashcards: false, reviewed_old_words: false, quiz_done: false,
  }

  const doneMap: DoneMap = {
    'vocabulary': vocabulary.length >= 10,
    'spaced-rep': checklist.reviewed_old_words ?? false,
    'flashcards': checklist.reviewed_flashcards,
    'quiz':       checklist.quiz_done ?? false,
    'writing':    !!writing?.content,
    'analyze':    false,
    'review':     !!writing?.mini_journal,
  }
  const completedCount = Object.values(doneMap).filter(Boolean).length

  const handleSpacedRepComplete = () =>
    upsertLog.mutate({ date, checklist: { ...checklist, reviewed_old_words: true }, week_number: log?.week_number ?? 1 })

  const handleFlashcardComplete = () =>
    upsertLog.mutate({ date, checklist: { ...checklist, reviewed_flashcards: true }, week_number: log?.week_number ?? 1 })

  const handleQuizComplete = () =>
    upsertLog.mutate({ date, checklist: { ...checklist, quiz_done: true }, week_number: log?.week_number ?? 1 })

  const sessionDone =
    vocabulary.length >= 10 && checklist.reviewed_flashcards &&
    !!writing?.content && !!writing?.mini_journal

  useEffect(() => {
    if (sessionDone) {
      upsertProgressDay.mutate({
        date, completed: true,
        words_count: vocabulary.length, writing_done: !!writing?.content,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionDone, date])

  // ── Error ──
  if (logError) {
    return (
      <div style={{
        borderRadius: 14, padding: 32, textAlign: 'center', maxWidth: 480, margin: '48px auto',
        background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)',
      }}>
        <p style={{ color: '#ef4444', fontWeight: 600, fontSize: 18, marginBottom: 8 }}>🔌 Database not connected</p>
        <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>
          Run{' '}
          <code style={{ padding: '2px 6px', borderRadius: 4, fontSize: 12, fontFamily: 'var(--font-mono, monospace)', background: 'var(--chip)', border: '1.5px solid var(--ink)' }}>
            supabase-schema.sql
          </code>{' '}
          in your Supabase SQL Editor, then add your env variables.
        </p>
      </div>
    )
  }

  // ── Loading ──
  if (logLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 280px', gap: 22 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  const nextStep = STEPS[STEPS.findIndex((s) => s.id === activeStep) + 1]

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto',
        gap: 24, alignItems: 'flex-end',
        padding: '8px 0 28px',
        borderBottom: '1.5px solid var(--line-soft)',
        marginBottom: 28,
      }}>
        <div>
          {/* Big editorial date */}
          <div style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 64, lineHeight: 0.95, letterSpacing: '-0.03em' }}>
            <span style={{ color: 'var(--ink)' }}>{dow},</span>{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>{mo}</em>{' '}
            <span style={{
              display: 'inline-block', marginLeft: 4,
              padding: '0 14px 2px',
              background: 'var(--lime)',
              border: '1.5px solid var(--ink)', borderRadius: 14,
              boxShadow: 'var(--shadow-sm)',
              transform: 'rotate(-1.2deg)',
              color: '#fff',
            }}>
              {day}
            </span>
          </div>
          <p style={{ marginTop: 10, fontSize: 15, color: 'var(--ink-2)', maxWidth: '52ch' }}>
            Session{' '}
            <em style={{ fontFamily: 'var(--font-serif, serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink)' }}>
              {String(parseInt(day)).padStart(2, '0')}
            </em>{' '}
            of your 30-day sprint. Seven stations ahead —{' '}
            <em style={{ fontFamily: 'var(--font-serif, serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink)' }}>
              vocabulary, writing, reflection
            </em>. Show up, then keep going.
          </p>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {[
            { k: 'Today',      v: `${completedCount}`, detail: `/ ${STEPS.length}`,  unit: 'stations done', bg: 'var(--lime)',    color: '#fff' },
            { k: 'Vocab bank', v: `${vocabulary.length}`, detail: '',                unit: 'words today',   bg: 'var(--sky)',    color: 'var(--ink)' },
            { k: 'Writing',    v: writing?.content ? '✓' : '–', detail: '',          unit: 'this session',  bg: 'var(--blush)', color: 'var(--ink)' },
          ].map((stat) => (
            <div key={stat.k} style={{
              border: '1.5px solid var(--ink)', borderRadius: 12,
              padding: '10px 14px', minWidth: 108,
              background: stat.bg, boxShadow: 'var(--shadow-sm)',
              color: stat.color,
            }}>
              <div className="caps" style={{ opacity: 0.75 }}>{stat.k}</div>
              <div style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 32, lineHeight: 1, marginTop: 4 }}>
                {stat.v}
                {stat.detail && <span style={{ fontSize: 20, opacity: 0.6 }}>{stat.detail}</span>}
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 3 }}>{stat.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3-column grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 280px', gap: 22, alignItems: 'start' }}>

        {/* Left sidebar */}
        <Sidebar
          activeStep={activeStep}
          setActiveStep={setActiveStep}
          log={log}
          doneMap={doneMap}
          completedCount={completedCount}
          onUpdateLog={(fields) => upsertLog.mutate({ date, week_number: log?.week_number ?? 1, ...fields })}
        />

        {/* Main content */}
        <main style={{ minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeStep} variants={slideIn} initial="hidden" animate="show" exit="exit">
              {activeStep === 'vocabulary' && (
                <VocabularyStep date={date} log={log} vocabulary={vocabulary} isLoading={vocabLoading} />
              )}
              {activeStep === 'spaced-rep' && (
                <SpacedRepetitionStep date={date} onComplete={handleSpacedRepComplete} />
              )}
              {activeStep === 'flashcards' && (
                <FlashcardStep vocabulary={vocabulary} onComplete={handleFlashcardComplete} />
              )}
              {activeStep === 'quiz' && (
                <QuizStep vocabulary={vocabulary} onComplete={handleQuizComplete} />
              )}
              {activeStep === 'writing' && (
                <WritingStep date={date} log={log} vocabulary={vocabulary} writing={writing ?? null} />
              )}
              {activeStep === 'analyze' && <AnalyzeStep />}
              {activeStep === 'review' && (
                <ReviewStep date={date} log={log} writing={writing ?? null} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Next step nudge */}
          {nextStep && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                marginTop: 22,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 18px',
                border: '1.5px dashed var(--ink)',
                borderRadius: 12,
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{
                  width: 36, height: 36,
                  border: '1.5px solid var(--ink)', borderRadius: '50%',
                  background: 'var(--saffron)',
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-serif, serif)', fontSize: 18,
                  color: 'var(--ink)',
                }}>
                  {parseInt(nextStep.num)}
                </div>
                <div>
                  <div className="caps" style={{ color: 'var(--ink-3)' }}>Up next</div>
                  <div style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, lineHeight: 1, marginTop: 2 }}>
                    {nextStep.label}{' '}
                    <em style={{ fontStyle: 'italic', color: 'var(--ink-3)', fontSize: 15 }}>· {nextStep.sub}</em>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveStep(nextStep.id)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 18px',
                  border: '1.5px solid var(--ink)', borderRadius: 12,
                  background: 'var(--ink)', color: 'var(--paper)',
                  fontWeight: 600, fontSize: 14,
                  boxShadow: 'var(--shadow)', cursor: 'pointer',
                  transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                }}
              >
                Continue <ArrowIcon />
              </button>
            </motion.div>
          )}
        </main>

        {/* Right rail */}
        <RightRail doneMap={doneMap} />
      </div>
    </div>
  )
}
