'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

const VERSION_CONFIG = [
  { key: 'casual',       label: 'Bình thường',   emoji: '💬' },
  { key: 'professional', label: 'Chuyên nghiệp', emoji: '💼' },
  { key: 'formal',       label: 'Trang trọng',   emoji: '🎩' },
] as const

function ScoreMeter({ score }: { score: number }) {
  const color = score <= 3 ? 'var(--mint)' : score <= 6 ? 'var(--saffron)' : 'var(--coral)'
  const label = score <= 3 ? 'Nghe rất tự nhiên!' : score <= 6 ? 'Hơi có mùi tiếng Việt' : 'Rất "Việt hóa"'

  return (
    <div className="flex items-center gap-4">
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        display: 'grid', placeItems: 'center',
        fontSize: 22, fontWeight: 700,
        background: 'var(--paper-2)',
        border: `2px solid ${color}`,
        color,
        flexShrink: 0,
      }}>
        {score}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="caps" style={{ fontSize: 9, color: 'var(--ink-3)' }}>Mức độ &quot;Việt hóa&quot;</span>
          <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }, (_, i) => (
            <motion.div
              key={i}
              style={{ flex: 1, height: 6, borderRadius: 999, background: i < score ? color : 'var(--line-soft)', transformOrigin: 'left' }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: 10, color: 'var(--mint)' }}>Tự nhiên</span>
          <span style={{ fontSize: 10, color: 'var(--coral)' }}>Rất Việt hóa</span>
        </div>
      </div>
    </div>
  )
}

function ResultCard({ sentence, result }: { sentence: string; result: AnalysisResult }) {
  const [showThinking, setShowThinking] = useState(true)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      {/* Original sentence */}
      <div style={{ borderRadius: 10, padding: '10px 14px', background: 'var(--chip)', border: '1px solid var(--line-soft)' }}>
        <p className="caps" style={{ fontSize: 9, color: 'var(--ink-3)', marginBottom: 4 }}>Câu của bạn</p>
        <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--ink-2)' }}>&quot;{sentence}&quot;</p>
      </div>

      {/* Score */}
      <div style={{ borderRadius: 10, padding: '14px 16px', background: 'var(--paper-2)', border: '1.5px solid var(--line-soft)' }}>
        <ScoreMeter score={result.viet_hoa_score} />
      </div>

      {/* Error types */}
      {result.error_types.length > 0 && (
        <div style={{ borderRadius: 10, padding: '10px 14px', background: 'var(--paper-2)', border: '1.5px solid var(--line-soft)' }}>
          <p className="caps" style={{ fontSize: 9, color: 'var(--ink-3)', marginBottom: 8 }}>Loại lỗi</p>
          <div className="flex flex-wrap gap-1.5">
            {result.error_types.map((type) => (
              <span key={type} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, fontWeight: 600, background: 'var(--blush)', border: '1.5px solid var(--coral)', color: 'var(--coral)' }}>
                {type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Three versions */}
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1.5px solid var(--line-soft)' }}>
        <div style={{ padding: '8px 14px', background: 'var(--chip)', borderBottom: '1px solid var(--line-soft)' }}>
          <p className="caps" style={{ fontSize: 9, color: 'var(--ink-3)' }}>3 cách diễn đạt</p>
        </div>
        {VERSION_CONFIG.map(({ key, label, emoji }) => (
          <div key={key} style={{ padding: '10px 14px', background: 'var(--paper-2)', borderBottom: '1px solid var(--line-soft)' }}>
            <div className="flex items-start gap-3">
              <div style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', fontSize: 14, background: 'var(--chip)', border: '1px solid var(--line-soft)', flexShrink: 0 }}>
                {emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="caps" style={{ fontSize: 9, color: 'var(--ink-3)', marginBottom: 3 }}>{label}</p>
                <p style={{ fontSize: 13, color: 'var(--ink)' }}>&quot;{result.versions[key]}&quot;</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Native thinking */}
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1.5px solid var(--sky)' }}>
        <button
          className="w-full flex items-center justify-between transition-colors"
          style={{ padding: '10px 14px', background: 'var(--sky)' }}
          onClick={() => setShowThinking((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 15 }}>🧠</span>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>Người bản xứ TƯ DUY thế nào?</p>
          </div>
          {showThinking
            ? <ChevronUp style={{ width: 14, height: 14, color: 'var(--ink-3)' }} />
            : <ChevronDown style={{ width: 14, height: 14, color: 'var(--ink-3)' }} />
          }
        </button>
        <AnimatePresence>
          {showThinking && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '12px 14px', background: 'var(--paper-2)' }}>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>{result.native_thinking}</p>
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
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [error, setError]     = useState('')

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

  return (
    <div className="space-y-4">
      {/* Input card */}
      <div className="card-editorial p-5">
        <div className="flex items-start gap-3 mb-4">
          <div style={{ width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'var(--sky)', border: '1.5px solid var(--line-soft)', flexShrink: 0 }}>
            <Languages style={{ width: 18, height: 18, color: 'var(--lime)' }} />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 18, color: 'var(--ink)' }}>English Analyzer</p>
            <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>Phát hiện &amp; sửa câu tiếng Anh bị &quot;Việt hóa&quot;</p>
          </div>
        </div>

        <textarea
          placeholder="Gõ câu tiếng Anh của bạn vào đây..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAnalyze() }}
          disabled={loading}
          style={{
            width: '100%', minHeight: 90, resize: 'none', padding: '10px 12px',
            border: '1.5px solid var(--line-soft)', borderRadius: 10,
            background: 'var(--paper)', color: 'var(--ink)', fontSize: 14,
            outline: 'none', fontFamily: 'var(--font-sans)', marginBottom: 12,
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--ink)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--line-soft)')}
        />

        {!input && history.length === 0 && (
          <div style={{ marginBottom: 12 }}>
            <p className="caps" style={{ fontSize: 9, color: 'var(--ink-3)', marginBottom: 6 }}>Thử với câu mẫu</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => setInput(ex)}
                  style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: 'var(--chip)', border: '1px solid var(--line-soft)', color: 'var(--ink-2)', cursor: 'pointer', transition: 'all 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--paper-2)'; e.currentTarget.style.borderColor = 'var(--ink)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--chip)'; e.currentTarget.style.borderColor = 'var(--line-soft)' }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="btn-action"
            style={{ flex: 1, justifyContent: 'center', opacity: (!input.trim()) ? 0.5 : 1, cursor: !input.trim() ? 'not-allowed' : 'pointer' }}
          >
            {loading
              ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> Đang phân tích...</>
              : 'Phân tích · Ctrl+Enter'
            }
          </button>
          {input && (
            <button onClick={() => setInput('')} className="btn-action ghost sm" style={{ flexShrink: 0 }}>
              <RotateCcw style={{ width: 13, height: 13 }} />
            </button>
          )}
        </div>

        {error && <p style={{ fontSize: 12, color: 'var(--coral)', marginTop: 8, textAlign: 'center' }}>{error}</p>}
      </div>

      {/* Results */}
      <AnimatePresence>
        {history.map((item, idx) => (
          <div key={`${item.sentence}-${idx}`} className="card-editorial p-5">
            <ResultCard sentence={item.sentence} result={item.result} />
          </div>
        ))}
      </AnimatePresence>

      {history.length === 0 && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card-editorial p-8 text-center">
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 4 }}>Gõ câu tiếng Anh bất kỳ</p>
          <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            AI sẽ cho điểm mức độ &quot;Việt hóa&quot; và viết lại 3 phiên bản tự nhiên hơn
          </p>
        </motion.div>
      )}
    </div>
  )
}
