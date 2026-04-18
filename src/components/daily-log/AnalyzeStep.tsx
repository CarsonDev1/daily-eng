'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/axios'
import { Loader2, Languages, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

interface AnalysisResult {
  viet_hoa_score: number
  error_types: string[]
  versions: { casual: string; professional: string; formal: string }
  native_thinking: string
}

interface HistoryItem {
  sentence: string
  result: AnalysisResult
}

const ERROR_COLORS: Record<string, string> = {
  'word order':          '#60a5fa',
  'literal translation': '#f87171',
  collocation:           '#fb923c',
  articles:              '#a78bfa',
  register:              '#34d399',
  grammar:               '#ec4899',
  tense:                 '#f59e0b',
}

const VERSION_CONFIG = [
  { key: 'casual',       label: 'Bình thường',   emoji: '💬', color: '#60a5fa' },
  { key: 'professional', label: 'Chuyên nghiệp', emoji: '💼', color: '#a78bfa' },
  { key: 'formal',       label: 'Trang trọng',   emoji: '🎩', color: '#34d399' },
] as const

function ScoreMeter({ score }: { score: number }) {
  const color = score <= 3 ? '#34d399' : score <= 6 ? '#f59e0b' : '#f87171'
  const label = score <= 3 ? 'Nghe rất tự nhiên!' : score <= 6 ? 'Hơi có mùi tiếng Việt' : 'Rất "Việt hóa"'

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
        style={{
          background: `${color}15`,
          border: `2px solid ${color}60`,
          color,
          boxShadow: `0 0 20px ${color}25`,
        }}
      >
        {score}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold" style={{ color: 'var(--c-text-3)' }}>
            Mức độ &quot;Việt hóa&quot;
          </span>
          <span className="text-xs font-bold" style={{ color }}>{label}</span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }, (_, i) => (
            <motion.div
              key={i}
              className="flex-1 h-2 rounded-full"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
              style={{ background: i < score ? color : 'var(--c-input-border)', transformOrigin: 'left' }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px]" style={{ color: '#34d399' }}>Tự nhiên</span>
          <span className="text-[10px]" style={{ color: '#f87171' }}>Rất Việt hóa</span>
        </div>
      </div>
    </div>
  )
}

function ResultCard({ sentence, result }: { sentence: string; result: AnalysisResult }) {
  const [showThinking, setShowThinking] = useState(true)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Original sentence */}
      <div
        className="rounded-xl px-4 py-3"
        style={{ background: 'var(--c-input-bg)', border: '1px solid var(--c-input-border)' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--c-text-3)' }}>
          Câu của bạn
        </p>
        <p className="text-sm italic" style={{ color: 'var(--c-text-2)' }}>&quot;{sentence}&quot;</p>
      </div>

      {/* Score */}
      <div
        className="rounded-xl px-4 py-4"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }}
      >
        <ScoreMeter score={result.viet_hoa_score} />
      </div>

      {/* Error types */}
      {result.error_types.length > 0 && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'var(--c-text-3)' }}>
            Loại lỗi
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.error_types.map((type) => {
              const color = ERROR_COLORS[type.toLowerCase()] ?? '#94a3b8'
              return (
                <span
                  key={type}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: `${color}15`, border: `1px solid ${color}40`, color }}
                >
                  {type}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Three versions */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--c-card-border)' }}
      >
        <div className="px-4 py-2.5" style={{ background: 'var(--c-card)', borderBottom: '1px solid var(--c-card-border)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--c-text-3)' }}>
            3 cách diễn đạt
          </p>
        </div>
        {VERSION_CONFIG.map(({ key, label, emoji, color }) => (
          <div
            key={key}
            className="px-4 py-3"
            style={{ background: 'var(--c-card)', borderBottom: '1px solid var(--c-card-border)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                style={{ background: `${color}15`, border: `1px solid ${color}35` }}
              >
                {emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color }}>
                  {label}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text-1)' }}>
                  &quot;{result.versions[key]}&quot;
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Native thinking */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(6,182,212,0.25)' }}
      >
        <button
          className="w-full px-4 py-3 flex items-center justify-between transition-colors"
          style={{ background: 'rgba(6,182,212,0.08)' }}
          onClick={() => setShowThinking((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🧠</span>
            <p className="text-xs font-semibold" style={{ color: '#06b6d4' }}>
              Người bản xứ TƯ DUY thế nào?
            </p>
          </div>
          {showThinking
            ? <ChevronUp className="w-3.5 h-3.5" style={{ color: '#06b6d4' }} />
            : <ChevronDown className="w-3.5 h-3.5" style={{ color: '#06b6d4' }} />
          }
        </button>
        <AnimatePresence>
          {showThinking && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="px-4 py-3" style={{ background: 'var(--c-card)' }}>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text-2)' }}>
                  {result.native_thinking}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

const EXAMPLES = [
  'I very like eat pho in the morning.',
  'She go to market buy vegetable yesterday.',
  'My English still not good, I need practice more.',
  'He is very enthusiastic with his work.',
]

export function AnalyzeStep() {
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [history, setHistory]   = useState<HistoryItem[]>([])
  const [error, setError]       = useState('')

  const handleAnalyze = async () => {
    const sentence = input.trim()
    if (!sentence) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post<AnalysisResult>('/analyze-english', { sentence })
      setHistory((prev) => [{ sentence, result: data }, ...prev].slice(0, 5))
      setInput('')
    } catch {
      setError('Phân tích thất bại. Thử lại nhé!')
    } finally {
      setLoading(false)
    }
  }

  const S = { background: 'var(--c-card)', border: '1px solid var(--c-card-border)', backdropFilter: 'blur(16px)' }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-2xl p-5" style={S}>
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)' }}
          >
            <Languages className="w-5 h-5" style={{ color: '#06b6d4' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--c-text-1)' }}>
              English Analyzer
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>
              Phát hiện &amp; sửa câu tiếng Anh bị &quot;Việt hóa&quot;
            </p>
          </div>
        </div>

        {/* Input */}
        <Textarea
          placeholder="Gõ câu tiếng Anh của bạn vào đây..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAnalyze()
          }}
          className="min-h-[90px] resize-none text-sm mb-3"
          disabled={loading}
        />

        {/* Example suggestions (only when input is empty) */}
        {!input && history.length === 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--c-text-3)' }}>
              Thử với câu mẫu
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setInput(ex)}
                  className="text-xs px-2.5 py-1 rounded-lg transition-all"
                  style={{
                    background: 'var(--c-input-bg)',
                    border: '1px solid var(--c-input-border)',
                    color: 'var(--c-text-2)',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="flex-1"
            style={{
              background: input.trim() ? 'rgba(6,182,212,0.9)' : undefined,
              color: input.trim() ? 'white' : undefined,
            }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang phân tích...</>
            ) : (
              'Phân tích · Ctrl+Enter'
            )}
          </Button>
          {input && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setInput('')}
              style={{ color: 'var(--c-text-3)' }}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
        )}
      </div>

      {/* Results history */}
      <AnimatePresence>
        {history.map((item, idx) => (
          <div key={`${item.sentence}-${idx}`} className="rounded-2xl p-5" style={S}>
            <ResultCard sentence={item.sentence} result={item.result} />
          </div>
        ))}
      </AnimatePresence>

      {/* Empty state */}
      {history.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl p-8 text-center"
          style={S}
        >
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--c-text-2)' }}>
            Gõ câu tiếng Anh bất kỳ
          </p>
          <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>
            AI sẽ cho điểm mức độ &quot;Việt hóa&quot; và viết lại 3 phiên bản tự nhiên hơn
          </p>
        </motion.div>
      )}
    </div>
  )
}
