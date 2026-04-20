'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/axios'
import { Sparkles, Loader2, Mic, ChevronDown, ChevronUp, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import type { WeeklyPlan } from '@/app/api/generate-plan/route'

type TabId = 'phrases' | 'vocabulary' | 'grammar' | 'speaking' | 'test'

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'phrases',    label: 'Phrases',    emoji: '💬' },
  { id: 'vocabulary', label: 'Vocabulary', emoji: '📚' },
  { id: 'grammar',    label: 'Grammar',    emoji: '📖' },
  { id: 'speaking',   label: 'Speaking',   emoji: '🎤' },
  { id: 'test',       label: 'Test',       emoji: '🎯' },
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

function PhrasesTab({ phrases }: { phrases: WeeklyPlan['phrases'] }) {
  return (
    <div className="card-editorial p-5">
      {phrases.map((p, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
          className="phrase">
          <div className="no">{i + 1}</div>
          <div className="en">{p.phrase}</div>
          <div className="vn">{p.meaning_vi}</div>
          <div className="ctx">{p.example}</div>
        </motion.div>
      ))}
    </div>
  )
}

function VocabGroup({ label, emoji, words }: { label: string; emoji: string; words: WeeklyPlan['vocabulary']['work'] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: 15 }}>{emoji}</span>
        <span className="caps" style={{ fontSize: 11, color: 'var(--ink-2)' }}>{label}</span>
      </div>
      <div className="space-y-2">
        {words.map((w, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            style={{ borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--paper-2)', border: '1.5px solid var(--line-soft)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, background: 'var(--chip)', color: 'var(--ink-2)', border: '1px solid var(--line-soft)' }}>
              {w.word[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{w.word}</span>
                <span style={{ fontSize: 12, color: 'var(--lime)' }}>{w.meaning_vi}</span>
              </div>
              <p style={{ fontSize: 12, marginTop: 2, fontStyle: 'italic', color: 'var(--ink-3)' }}>&ldquo;{w.example}&rdquo;</p>
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
      <VocabGroup label="Work"   emoji="💼" words={vocabulary.work}   />
      <VocabGroup label="Social" emoji="👥" words={vocabulary.social} />
      <VocabGroup label="Travel" emoji="✈️" words={vocabulary.travel} />
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
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{ borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${isOpen ? 'var(--ink)' : 'var(--line-soft)'}`, boxShadow: isOpen ? 'var(--shadow-sm)' : 'none' }}>
            <button
              className="w-full flex items-center gap-3 text-left transition-colors"
              style={{ padding: '12px 14px', background: isOpen ? 'var(--ink)' : 'var(--paper-2)', cursor: 'pointer' }}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <div style={{ width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, background: isOpen ? 'rgba(255,255,255,0.15)' : 'var(--chip)', color: isOpen ? '#fff' : 'var(--ink-2)' }}>
                {i + 1}
              </div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: isOpen ? 'var(--paper)' : 'var(--ink)' }}>{g.point}</span>
              {isOpen
                ? <ChevronUp style={{ width: 15, height: 15, flexShrink: 0, color: 'var(--paper)' }} />
                : <ChevronDown style={{ width: 15, height: 15, flexShrink: 0, color: 'var(--ink-3)' }} />
              }
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', background: 'var(--paper-2)' }}>
                    <div className="grammar-box">
                      <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>{g.explanation_vi}</p>
                      {g.examples.map((ex, j) => (
                        <div key={j} className="grammar-ex">{ex}</div>
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
      <div style={{ borderRadius: 12, padding: '12px 14px', background: 'rgba(255,217,61,0.1)', border: '1.5px solid rgba(255,217,61,0.35)' }}>
        <p className="caps" style={{ fontSize: 9, color: 'var(--saffron)', marginBottom: 6 }}>🎬 Tình huống</p>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>{speaking.scenario_vi}</p>
      </div>

      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1.5px solid var(--line-soft)' }}>
        <div className="flex items-center gap-2" style={{ padding: '10px 14px', background: 'var(--chip)', borderBottom: '1px solid var(--line-soft)' }}>
          <Mic style={{ width: 14, height: 14, color: 'var(--saffron)' }} />
          <span className="caps" style={{ fontSize: 9, color: 'var(--saffron)' }}>Kịch bản luyện nói (~3 phút)</span>
        </div>
        <div style={{ padding: '14px', background: 'var(--paper-2)' }}>
          <p style={{ fontSize: 13, lineHeight: 2, whiteSpace: 'pre-line', color: 'var(--ink)' }}>{speaking.script}</p>
        </div>
      </div>

      <div style={{ borderRadius: 12, padding: '12px 14px', background: 'var(--paper-2)', border: '1.5px solid var(--line-soft)' }}>
        <p className="caps" style={{ fontSize: 9, color: 'var(--ink-3)', marginBottom: 10 }}>💡 Mẹo luyện tập</p>
        {speaking.tips_vi.map((tip, i) => (
          <div key={i} className="flex items-start gap-2.5" style={{ marginBottom: i < speaking.tips_vi.length - 1 ? 8 : 0 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2, background: 'var(--saffron)', color: 'var(--ink)' }}>
              {i + 1}
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{tip}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TestTab({ test }: { test: WeeklyPlan['test'] }) {
  const [revealed, setRevealed] = useState<Record<number, number | null>>({})

  const handleAnswer = (qi: number, oi: number) => {
    if (revealed[qi] !== undefined) return
    setRevealed((prev) => ({ ...prev, [qi]: oi }))
  }

  const allAnswered = test.length > 0 && Object.keys(revealed).length === test.length
  const score = Object.entries(revealed).filter(([qi, oi]) => test[Number(qi)]?.correct_index === oi).length

  return (
    <div className="space-y-4">
      {test.map((q, qi) => {
        const chosen = revealed[qi]
        const isAnswered = chosen !== undefined
        return (
          <motion.div key={qi} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.07 }}
            style={{ borderRadius: 12, overflow: 'hidden', border: '1.5px solid var(--line-soft)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '10px 14px', background: 'var(--paper-2)' }}>
              <div className="flex items-start gap-2.5">
                <span style={{ width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, background: 'var(--blush)', color: 'var(--coral)', flexShrink: 0, marginTop: 2 }}>
                  {qi + 1}
                </span>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>{q.question}</p>
              </div>
            </div>
            <div style={{ padding: '10px 12px', background: 'var(--paper)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.correct_index
                const isChosen = chosen === oi
                const showResult = isAnswered
                let bg = 'var(--paper-2)'
                let border = '1.5px solid var(--line-soft)'
                let color = 'var(--ink-2)'
                if (showResult && isCorrect) { bg = 'rgba(125,219,168,0.15)'; border = '1.5px solid var(--mint)'; color = 'var(--ink)' }
                else if (showResult && isChosen && !isCorrect) { bg = 'var(--blush)'; border = '1.5px solid var(--coral)'; color = 'var(--coral)' }
                return (
                  <button key={oi} onClick={() => handleAnswer(qi, oi)} disabled={isAnswered}
                    className="w-full text-left flex items-center gap-2.5 transition-all"
                    style={{ borderRadius: 8, padding: '8px 12px', fontSize: 13, background: bg, border, color, cursor: isAnswered ? 'default' : 'pointer' }}>
                    {showResult && isCorrect && <CheckCircle2 style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--mint)' }} />}
                    {showResult && isChosen && !isCorrect && <XCircle style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--coral)' }} />}
                    {(!showResult || (!isCorrect && !isChosen)) && (
                      <span style={{ fontSize: 10, fontWeight: 700, width: 16, height: 16, borderRadius: 4, display: 'grid', placeItems: 'center', background: 'var(--chip)', color: 'var(--ink-3)', flexShrink: 0 }}>
                        {['A','B','C','D'][oi]}
                      </span>
                    )}
                    <span>{opt.replace(/^[A-D]\.\s*/, '')}</span>
                  </button>
                )
              })}
              {isAnswered && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ borderRadius: 8, padding: '8px 12px', marginTop: 2, background: 'var(--sky)', border: '1px solid var(--line-soft)' }}>
                  <p style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--lime)' }}>Giải thích: </span>
                    {q.explanation_vi}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )
      })}

      {allAnswered && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{
            borderRadius: 14, padding: '20px 16px', textAlign: 'center',
            background: score === test.length ? 'rgba(125,219,168,0.1)' : score >= test.length / 2 ? 'rgba(255,217,61,0.1)' : 'var(--blush)',
            border: `1.5px solid ${score === test.length ? 'var(--mint)' : score >= test.length / 2 ? 'var(--saffron)' : 'var(--coral)'}`,
            boxShadow: 'var(--shadow-sm)',
          }}>
          <p style={{ fontSize: 32, marginBottom: 6 }}>{score === test.length ? '🎉' : score >= test.length / 2 ? '💪' : '📖'}</p>
          <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, color: 'var(--ink)', marginBottom: 4 }}>{score}/{test.length} câu đúng</p>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 12 }}>
            {score === test.length ? 'Xuất sắc! Bạn đã nắm vững tuần này.' : score >= test.length / 2 ? 'Tốt lắm! Ôn thêm một chút nữa nhé.' : 'Hãy xem lại phần Phrases và Grammar nhé!'}
          </p>
          <button className="btn-action ghost sm" onClick={() => setRevealed({})}>
            <RotateCcw style={{ width: 13, height: 13 }} /> Làm lại
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default function PlanPage() {
  const [selectedWeek,  setSelectedWeek]  = useState(1)
  const [selectedTopic, setSelectedTopic] = useState('Daily Life')
  const [plan,          setPlan]          = useState<WeeklyPlan | null>(null)
  const [activeTab,     setActiveTab]     = useState<TabId>('phrases')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const [fromCache,     setFromCache]     = useState(false)

  useEffect(() => {
    const saved = loadPlan(selectedWeek)
    if (saved) { setPlan(saved); setSelectedTopic(saved.topic); setFromCache(true) }
    else { setPlan(null); setFromCache(false) }
  }, [selectedWeek])

  const handleGenerate = async () => {
    setLoading(true); setError(''); setFromCache(false)
    try {
      const { data } = await api.post<WeeklyPlan>('/generate-plan', { week: selectedWeek, topic: selectedTopic })
      setPlan(data); savePlan(data); setActiveTab('phrases')
    } catch {
      setError('Tạo kế hoạch thất bại. Thử lại nhé!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 48 }}>
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 42, color: 'var(--ink)', lineHeight: 1, marginBottom: 4 }}>
          The 30-day <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>sprint</em>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Personalised weekly learning plan — phrases, vocab, grammar &amp; speaking</p>
      </motion.div>

      {/* Controls */}
      <div className="card-editorial p-5 space-y-4" style={{ marginBottom: 20 }}>
        {/* Week selector */}
        <div>
          <p className="caps" style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 8 }}>Tuần học</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((w) => {
              const active = selectedWeek === w
              return (
                <button key={w} onClick={() => setSelectedWeek(w)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    background: active ? 'var(--ink)' : 'var(--paper-2)',
                    border: `1.5px solid ${active ? 'var(--ink)' : 'var(--line-soft)'}`,
                    color: active ? 'var(--paper)' : 'var(--ink-2)',
                    boxShadow: active ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.1s',
                  }}>
                  Week {w}
                </button>
              )
            })}
          </div>
        </div>

        {/* Topic selector */}
        <div>
          <p className="caps" style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 8 }}>Chủ đề</p>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(({ value, emoji }) => {
              const active = selectedTopic === value
              return (
                <button key={value} onClick={() => setSelectedTopic(value)}
                  className="flex items-center gap-1.5"
                  style={{ padding: '7px 12px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    background: active ? 'var(--sky)' : 'var(--paper-2)',
                    border: `1.5px solid ${active ? 'var(--lime)' : 'var(--line-soft)'}`,
                    color: active ? 'var(--lime)' : 'var(--ink-2)',
                    boxShadow: active ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.1s',
                  }}>
                  <span>{emoji}</span> {value}
                </button>
              )
            })}
          </div>
        </div>

        {/* Generate button */}
        <button onClick={handleGenerate} disabled={loading}
          className="btn-action w-full justify-center"
          style={{ opacity: loading ? 0.7 : 1 }}>
          {loading
            ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> Đang tạo kế hoạch...</>
            : <><Sparkles style={{ width: 15, height: 15 }} /> Tạo kế hoạch Week {selectedWeek} · {selectedTopic}</>
          }
        </button>

        {fromCache && plan && (
          <p style={{ fontSize: 12, textAlign: 'center', color: 'var(--ink-3)' }}>
            📦 Đã tải kế hoạch Week {plan.week} · {plan.topic} từ bộ nhớ —{' '}
            <button style={{ textDecoration: 'underline', color: 'var(--lime)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }} onClick={handleGenerate}>
              Tạo lại
            </button>
          </p>
        )}
        {error && <p style={{ fontSize: 12, color: 'var(--coral)', textAlign: 'center' }}>{error}</p>}
      </div>

      {/* Plan content */}
      <AnimatePresence>
        {plan && (
          <motion.div key={`${plan.week}-${plan.topic}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--paper-2)', border: '1.5px solid var(--line-soft)', borderRadius: 14, boxShadow: 'var(--shadow-sm)' }}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 4px', borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.1s',
                      background: isActive ? 'var(--ink)' : 'transparent',
                      border: isActive ? '1.5px solid var(--ink)' : '1.5px solid transparent',
                      color: isActive ? 'var(--paper)' : 'var(--ink-3)',
                      boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                    }}>
                    <span style={{ fontSize: 16, lineHeight: 1 }}>{tab.emoji}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-editorial p-10 text-center">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 20, color: 'var(--ink)', marginBottom: 4 }}>Chưa có kế hoạch cho tuần này</p>
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Chọn tuần và chủ đề, rồi nhấn &ldquo;Tạo kế hoạch&rdquo; để bắt đầu</p>
        </motion.div>
      )}
    </div>
  )
}
