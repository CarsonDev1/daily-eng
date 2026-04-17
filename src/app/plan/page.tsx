'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Mic, ChevronDown, ChevronUp, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import type { WeeklyPlan } from '@/app/api/generate-plan/route'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'phrases' | 'vocabulary' | 'grammar' | 'speaking' | 'test'

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; emoji: string; color: string }[] = [
  { id: 'phrases',    label: 'Phrases',    emoji: '💬', color: '#60a5fa' },
  { id: 'vocabulary', label: 'Vocabulary', emoji: '📚', color: '#a78bfa' },
  { id: 'grammar',    label: 'Grammar',    emoji: '📖', color: '#34d399' },
  { id: 'speaking',   label: 'Speaking',   emoji: '🎤', color: '#f59e0b' },
  { id: 'test',       label: 'Test',       emoji: '🎯', color: '#ec4899' },
]

const TOPICS = [
  { value: 'Daily Life',  emoji: '☀️' },
  { value: 'Work',        emoji: '💼' },
  { value: 'Social',      emoji: '👥' },
  { value: 'Travel',      emoji: '✈️' },
  { value: 'Technology',  emoji: '💻' },
]

const STORAGE_KEY = (week: number) => `weekly-plan-w${week}`

function savePlan(plan: WeeklyPlan) {
  try { localStorage.setItem(STORAGE_KEY(plan.week), JSON.stringify(plan)) } catch { /* no-op */ }
}

function loadPlan(week: number): WeeklyPlan | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(week))
    return raw ? (JSON.parse(raw) as WeeklyPlan) : null
  } catch { return null }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhrasesTab({ phrases }: { phrases: WeeklyPlan['phrases'] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {phrases.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          className="rounded-xl p-4"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }}
        >
          <div className="flex items-start gap-2.5">
            <span
              className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--c-text-1)' }}>
                {p.phrase}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#60a5fa' }}>{p.meaning_vi}</p>
              <p className="text-xs mt-1.5 italic leading-relaxed" style={{ color: 'var(--c-text-3)' }}>
                &ldquo;{p.example}&rdquo;
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function VocabGroup({
  label, emoji, color, words,
}: {
  label: string; emoji: string; color: string
  words: WeeklyPlan['vocabulary']['work']
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{emoji}</span>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>{label}</span>
      </div>
      <div className="space-y-2">
        {words.map((w, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background: 'var(--c-card)', border: `1px solid ${color}25` }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
              style={{ background: `${color}15`, color }}
            >
              {w.word[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-semibold" style={{ color: 'var(--c-text-1)' }}>{w.word}</span>
                <span className="text-xs" style={{ color }}>{w.meaning_vi}</span>
              </div>
              <p className="text-xs mt-1 italic" style={{ color: 'var(--c-text-3)' }}>
                &ldquo;{w.example}&rdquo;
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function VocabularyTab({ vocabulary }: { vocabulary: WeeklyPlan['vocabulary'] }) {
  return (
    <div className="space-y-6">
      <VocabGroup label="Work"   emoji="💼" color="#60a5fa" words={vocabulary.work}   />
      <VocabGroup label="Social" emoji="👥" color="#a78bfa" words={vocabulary.social} />
      <VocabGroup label="Travel" emoji="✈️" color="#34d399" words={vocabulary.travel} />
    </div>
  )
}

function GrammarTab({ grammar }: { grammar: WeeklyPlan['grammar'] }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="space-y-3">
      {grammar.map((g, i) => {
        const isOpen = open === i
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl overflow-hidden"
            style={{ border: isOpen ? '1px solid rgba(52,211,153,0.35)' : '1px solid var(--c-card-border)' }}
          >
            <button
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
              style={{ background: isOpen ? 'rgba(52,211,153,0.08)' : 'var(--c-card)' }}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}
              >
                {i + 1}
              </div>
              <span className="flex-1 text-sm font-semibold text-left" style={{ color: 'var(--c-text-1)' }}>
                {g.point}
              </span>
              {isOpen
                ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: '#34d399' }} />
                : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--c-text-3)' }} />
              }
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="px-4 pb-4 pt-1 space-y-3" style={{ background: 'var(--c-card)' }}>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text-2)' }}>
                      {g.explanation_vi}
                    </p>
                    <div className="space-y-2">
                      {g.examples.map((ex, j) => (
                        <div
                          key={j}
                          className="rounded-lg px-3 py-2 flex items-start gap-2"
                          style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}
                        >
                          <span className="text-xs font-bold mt-0.5" style={{ color: '#34d399' }}>
                            {j + 1}.
                          </span>
                          <p className="text-sm italic" style={{ color: 'var(--c-text-1)' }}>{ex}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}

function SpeakingTab({ speaking }: { speaking: WeeklyPlan['speaking'] }) {
  return (
    <div className="space-y-4">
      {/* Scenario */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#f59e0b' }}>
          🎬 Tình huống
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text-2)' }}>
          {speaking.scenario_vi}
        </p>
      </div>

      {/* Script */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--c-card-border)' }}
      >
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ background: 'var(--c-card)', borderBottom: '1px solid var(--c-card-border)' }}
        >
          <Mic className="w-4 h-4" style={{ color: '#f59e0b' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#f59e0b' }}>
            Kịch bản luyện nói (~3 phút)
          </span>
        </div>
        <div className="px-4 py-4" style={{ background: 'var(--c-bg)' }}>
          <p
            className="text-sm leading-8 whitespace-pre-line"
            style={{ color: 'var(--c-text-1)', fontFamily: 'inherit' }}
          >
            {speaking.script}
          </p>
        </div>
      </div>

      {/* Tips */}
      <div
        className="rounded-xl p-4 space-y-2.5"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--c-text-3)' }}>
          💡 Mẹo luyện tập
        </p>
        {speaking.tips_vi.map((tip, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
            >
              {i + 1}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text-2)' }}>{tip}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TestTab({ test }: { test: WeeklyPlan['test'] }) {
  const [revealed, setRevealed] = useState<Record<number, number | null>>({})
  const [done, setDone] = useState(false)

  const handleAnswer = (qi: number, oi: number) => {
    if (revealed[qi] !== undefined) return
    setRevealed((prev) => ({ ...prev, [qi]: oi }))
  }

  const allAnswered = test.length > 0 && Object.keys(revealed).length === test.length
  const score = Object.entries(revealed).filter(([qi, oi]) => test[Number(qi)]?.correct_index === oi).length

  return (
    <div className="space-y-4">
      {!done ? (
        <>
          {test.map((q, qi) => {
            const chosen = revealed[qi]
            const isAnswered = chosen !== undefined
            return (
              <motion.div
                key={qi}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qi * 0.07 }}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--c-card-border)' }}
              >
                <div className="px-4 py-3" style={{ background: 'var(--c-card)' }}>
                  <div className="flex items-start gap-2.5">
                    <span
                      className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899' }}
                    >
                      {qi + 1}
                    </span>
                    <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--c-text-1)' }}>
                      {q.question}
                    </p>
                  </div>
                </div>

                <div className="p-3 space-y-2" style={{ background: 'var(--c-bg)' }}>
                  {q.options.map((opt, oi) => {
                    const isCorrect  = oi === q.correct_index
                    const isChosen   = chosen === oi
                    const showResult = isAnswered

                    let bg    = 'var(--c-card)'
                    let border = 'var(--c-card-border)'
                    let color  = 'var(--c-text-2)'

                    if (showResult && isCorrect) {
                      bg = 'rgba(52,211,153,0.10)'; border = 'rgba(52,211,153,0.4)'; color = '#34d399'
                    } else if (showResult && isChosen && !isCorrect) {
                      bg = 'rgba(248,113,113,0.10)'; border = 'rgba(248,113,113,0.4)'; color = '#f87171'
                    }

                    return (
                      <button
                        key={oi}
                        onClick={() => handleAnswer(qi, oi)}
                        disabled={isAnswered}
                        className="w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-2.5 transition-all text-sm"
                        style={{ background: bg, border: `1px solid ${border}`, color }}
                      >
                        {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
                        {showResult && isChosen && !isCorrect && <XCircle className="w-4 h-4 shrink-0 text-red-400" />}
                        {(!showResult || (!isCorrect && !isChosen)) && (
                          <span
                            className="text-xs font-bold w-4 h-4 rounded flex items-center justify-center shrink-0"
                            style={{ background: 'var(--c-input-bg)', color: 'var(--c-text-3)' }}
                          >
                            {['A','B','C','D'][oi]}
                          </span>
                        )}
                        <span>{opt.replace(/^[A-D]\.\s*/, '')}</span>
                      </button>
                    )
                  })}

                  {isAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg px-3 py-2 mt-1"
                      style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}
                    >
                      <p className="text-xs" style={{ color: 'var(--c-text-2)' }}>
                        <span className="font-semibold" style={{ color: '#60a5fa' }}>Giải thích: </span>
                        {q.explanation_vi}
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}

          {allAnswered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl p-5 text-center"
              style={{
                background: score === test.length
                  ? 'rgba(52,211,153,0.08)'
                  : score >= test.length / 2
                    ? 'rgba(245,158,11,0.08)'
                    : 'rgba(248,113,113,0.08)',
                border: `1px solid ${score === test.length ? 'rgba(52,211,153,0.3)' : score >= test.length / 2 ? 'rgba(245,158,11,0.3)' : 'rgba(248,113,113,0.3)'}`,
              }}
            >
              <p className="text-3xl mb-2">
                {score === test.length ? '🎉' : score >= test.length / 2 ? '💪' : '📖'}
              </p>
              <p className="text-lg font-bold" style={{ color: 'var(--c-text-1)' }}>
                {score}/{test.length} câu đúng
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--c-text-3)' }}>
                {score === test.length
                  ? 'Xuất sắc! Bạn đã nắm vững tuần này.'
                  : score >= test.length / 2
                    ? 'Tốt lắm! Ôn thêm một chút nữa nhé.'
                    : 'Hãy xem lại phần Phrases và Grammar nhé!'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => { setRevealed({}); setDone(false) }}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Làm lại
              </Button>
            </motion.div>
          )}
        </>
      ) : null}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const [selectedWeek,  setSelectedWeek]  = useState(1)
  const [selectedTopic, setSelectedTopic] = useState('Daily Life')
  const [plan,          setPlan]          = useState<WeeklyPlan | null>(null)
  const [activeTab,     setActiveTab]     = useState<TabId>('phrases')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const [fromCache,     setFromCache]     = useState(false)

  // Load saved plan whenever week changes
  useEffect(() => {
    const saved = loadPlan(selectedWeek)
    if (saved) { setPlan(saved); setSelectedTopic(saved.topic); setFromCache(true) }
    else { setPlan(null); setFromCache(false) }
  }, [selectedWeek])

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setFromCache(false)
    try {
      const { data } = await api.post<WeeklyPlan>('/generate-plan', {
        week: selectedWeek,
        topic: selectedTopic,
      })
      setPlan(data)
      savePlan(data)
      setActiveTab('phrases')
    } catch {
      setError('Tạo kế hoạch thất bại. Thử lại nhé!')
    } finally {
      setLoading(false)
    }
  }

  const S = { background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }
  const activeTabConfig = TABS.find((t) => t.id === activeTab)!

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      {/* Page title */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">📅</span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight gradient-text">7-Day Learning Plan</h1>
            <p className="text-sm" style={{ color: 'var(--c-text-3)' }}>
              Lộ trình học cá nhân hoá theo tuần &amp; chủ đề
            </p>
          </div>
        </div>
      </motion.div>

      {/* Controls card */}
      <div className="rounded-2xl p-5 space-y-4" style={S}>
        {/* Week selector */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--c-text-3)' }}>
            Tuần học
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((w) => {
              const active = selectedWeek === w
              return (
                <button
                  key={w}
                  onClick={() => setSelectedWeek(w)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={active ? {
                    background: 'var(--c-accent-bg)',
                    border: '1px solid var(--c-accent-border)',
                    color: '#a78bfa',
                    boxShadow: '0 0 12px rgba(167,139,250,0.2)',
                  } : {
                    background: 'var(--c-input-bg)',
                    border: '1px solid var(--c-input-border)',
                    color: 'var(--c-text-2)',
                  }}
                >
                  Week {w}
                </button>
              )
            })}
          </div>
        </div>

        {/* Topic selector */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--c-text-3)' }}>
            Chủ đề
          </p>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(({ value, emoji }) => {
              const active = selectedTopic === value
              return (
                <button
                  key={value}
                  onClick={() => setSelectedTopic(value)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={active ? {
                    background: 'rgba(96,165,250,0.12)',
                    border: '1px solid rgba(96,165,250,0.35)',
                    color: '#60a5fa',
                  } : {
                    background: 'var(--c-input-bg)',
                    border: '1px solid var(--c-input-border)',
                    color: 'var(--c-text-2)',
                  }}
                >
                  <span>{emoji}</span> {value}
                </button>
              )
            })}
          </div>
        </div>

        {/* Generate button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 h-10"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white' }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tạo kế hoạch...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Tạo kế hoạch Week {selectedWeek} · {selectedTopic}</>
            )}
          </Button>
        </div>

        {fromCache && plan && (
          <p className="text-xs text-center" style={{ color: 'var(--c-text-3)' }}>
            📦 Đã tải kế hoạch Week {plan.week} · {plan.topic} từ bộ nhớ —{' '}
            <button className="underline" style={{ color: '#a78bfa' }} onClick={handleGenerate}>
              Tạo lại
            </button>
          </p>
        )}

        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      </div>

      {/* Plan content */}
      <AnimatePresence>
        {plan && (
          <motion.div
            key={`${plan.week}-${plan.topic}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Tabs */}
            <div
              className="rounded-2xl p-1.5 flex gap-1"
              style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }}
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                    style={isActive ? {
                      background: `${tab.color}15`,
                      border: `1px solid ${tab.color}35`,
                      color: tab.color,
                      boxShadow: `0 0 10px ${tab.color}18`,
                    } : {
                      border: '1px solid transparent',
                      color: 'var(--c-text-3)',
                    }}
                  >
                    <span className="text-base leading-none">{tab.emoji}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab badge */}
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: `${activeTabConfig.color}15`,
                  border: `1px solid ${activeTabConfig.color}35`,
                  color: activeTabConfig.color,
                }}
              >
                {activeTabConfig.emoji} {activeTabConfig.label}
              </span>
              {activeTab === 'phrases' && (
                <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>{plan.phrases.length} cụm từ</span>
              )}
              {activeTab === 'vocabulary' && (
                <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>
                  {(plan.vocabulary.work?.length ?? 0) + (plan.vocabulary.social?.length ?? 0) + (plan.vocabulary.travel?.length ?? 0)} từ vựng
                </span>
              )}
              {activeTab === 'grammar' && (
                <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>{plan.grammar.length} điểm ngữ pháp</span>
              )}
              {activeTab === 'test' && (
                <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>{plan.test.length} câu hỏi</span>
              )}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'phrases'    && <PhrasesTab    phrases={plan.phrases}       />}
                {activeTab === 'vocabulary' && <VocabularyTab vocabulary={plan.vocabulary} />}
                {activeTab === 'grammar'    && <GrammarTab    grammar={plan.grammar}       />}
                {activeTab === 'speaking'   && <SpeakingTab   speaking={plan.speaking}     />}
                {activeTab === 'test'       && <TestTab       test={plan.test}             />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!plan && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl p-10 text-center"
          style={S}
        >
          <div className="text-5xl mb-4">📅</div>
          <p className="text-base font-semibold mb-1" style={{ color: 'var(--c-text-2)' }}>
            Chưa có kế hoạch cho tuần này
          </p>
          <p className="text-sm" style={{ color: 'var(--c-text-3)' }}>
            Chọn tuần và chủ đề, rồi nhấn &ldquo;Tạo kế hoạch&rdquo; để bắt đầu
          </p>
        </motion.div>
      )}
    </div>
  )
}
