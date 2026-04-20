'use client'

import { useState } from 'react'
import { DailyLog, VocabularyEntry, WritingSession } from '@/lib/supabase'
import { useUpsertWritingSession, useGenerateWritingTopic } from '@/hooks/useDailyLog'
import { Sparkles, PenLine, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

const TOPIC_SUGGESTIONS = [
  { cat: 'About Yourself', topics: ['My perfect weekend', 'Why I started learning English', 'The best meal I\'ve ever had', 'A person who inspires me', 'My dream job'] },
  { cat: 'The World', topics: ['Climate change — my opinion', 'How social media affects us', 'A country I want to visit', 'The future of work'] },
  { cat: 'Storytelling', topics: ['A childhood memory', 'The funniest thing that ever happened to me', 'A challenge I overcame'] },
  { cat: 'Opinions', topics: ['What makes me happy?', 'Is money everything?', 'What does success mean to me?'] },
]

interface Props {
  date: string
  log: DailyLog | null | undefined
  vocabulary: VocabularyEntry[]
  writing: WritingSession | null
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid var(--line-soft)',
  borderRadius: 10,
  background: 'var(--paper)',
  color: 'var(--ink)',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.15s',
}

export function WritingStep({ date, log, vocabulary, writing }: Props) {
  const upsertWriting = useUpsertWritingSession()
  const generateTopic = useGenerateWritingTopic()

  const [topic, setTopic] = useState(writing?.topic ?? '')
  const [content, setContent] = useState(writing?.content ?? '')
  const [newWordsUsed, setNewWordsUsed] = useState(writing?.new_words_used?.join(', ') ?? '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState('')

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const sentenceCount = content.split(/[.!?]+/).filter((s) => s.trim().length > 0).length

  const handleSave = () => {
    if (!log?.id) return
    upsertWriting.mutate({
      log_id: log.id,
      date,
      topic,
      content,
      new_words_used: newWordsUsed.split(',').map((w) => w.trim()).filter(Boolean),
    })
  }

  const handleGenerateTopic = async () => {
    const words = vocabulary.map((v) => v.word)
    const result = await generateTopic.mutateAsync(words)
    setTopic(result.topic)
    setGeneratedPrompt(result.prompt)
  }

  return (
    <div className="card-editorial p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PenLine style={{ width: 16, height: 16, color: 'var(--ink-2)' }} />
            <span style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 20, color: 'var(--ink)' }}>Free Writing</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>20 mins · 5–8 sentences · Just write, don&apos;t overthink it</p>
        </div>
        <button
          onClick={handleGenerateTopic}
          disabled={generateTopic.isPending}
          className="btn-action ghost sm"
        >
          {generateTopic.isPending
            ? <><RefreshCw style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> Thinking...</>
            : <><Sparkles style={{ width: 13, height: 13 }} /> AI Topic</>
          }
        </button>
      </div>

      {/* Topic input */}
      <div>
        <label className="caps" style={{ fontSize: 10, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>Today&apos;s Topic</label>
        <div className="flex gap-2">
          <input
            placeholder="Write your topic here..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--ink)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--line-soft)')}
          />
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="btn-action ghost sm"
          >
            Suggestions {showSuggestions ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
          </button>
        </div>
      </div>

      {/* AI generated prompt */}
      {generatedPrompt && (
        <div style={{ borderRadius: 10, padding: '10px 14px', background: 'var(--lilac)', border: '1px solid rgba(201,184,255,0.5)' }}>
          <p className="caps" style={{ fontSize: 9, color: 'var(--ink-2)', marginBottom: 4 }}>AI Writing Prompt</p>
          <p style={{ fontSize: 13, color: 'var(--ink)' }}>{generatedPrompt}</p>
        </div>
      )}

      {/* Topic suggestions */}
      {showSuggestions && (
        <div style={{ borderRadius: 12, padding: 14, background: 'var(--chip)', border: '1px solid var(--line-soft)' }}>
          {TOPIC_SUGGESTIONS.map((group) => (
            <div key={group.cat} style={{ marginBottom: 12 }}>
              <p className="caps" style={{ fontSize: 9, color: 'var(--ink-3)', marginBottom: 6 }}>{group.cat}</p>
              <div className="flex flex-wrap gap-2">
                {group.topics.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTopic(t); setShowSuggestions(false) }}
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: 'var(--paper)',
                      border: '1.5px solid var(--line-soft)',
                      color: 'var(--ink-2)',
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.color = 'var(--ink)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line-soft)'; e.currentTarget.style.color = 'var(--ink-2)' }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main writing area */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="caps" style={{ fontSize: 10, color: 'var(--ink-3)' }}>My Writing</label>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {wordCount} words · {sentenceCount} sentences
            {sentenceCount >= 5 && sentenceCount <= 8 && (
              <span style={{ color: 'var(--lime)', marginLeft: 4 }}>✓ Good length!</span>
            )}
          </span>
        </div>
        <textarea
          placeholder="Write 5–8 sentences in English here — not perfect, just write!"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            minHeight: 160,
            resize: 'vertical',
            padding: '12px',
            border: '1.5px solid var(--line-soft)',
            borderRadius: 10,
            background: 'var(--paper)',
            color: 'var(--ink)',
            fontSize: 14,
            lineHeight: 1.7,
            outline: 'none',
            fontFamily: 'var(--font-sans)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--ink)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--line-soft)')}
        />
      </div>

      {/* Words used */}
      <div>
        <label className="caps" style={{ fontSize: 10, color: 'var(--ink-3)', display: 'block', marginBottom: 8 }}>New Words I Used</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {vocabulary.slice(0, 10).map((v) => {
            const selected = newWordsUsed.includes(v.word)
            return (
              <button
                key={v.id}
                onClick={() => {
                  const current = newWordsUsed.split(',').map((w) => w.trim()).filter(Boolean)
                  const word = v.word
                  if (current.includes(word)) {
                    setNewWordsUsed(current.filter((w) => w !== word).join(', '))
                  } else {
                    setNewWordsUsed([...current, word].join(', '))
                  }
                }}
                style={{
                  fontSize: 12,
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: selected ? 'rgba(49,156,246,0.1)' : 'var(--paper-2)',
                  border: `1.5px solid ${selected ? 'var(--lime)' : 'var(--line-soft)'}`,
                  color: selected ? 'var(--lime)' : 'var(--ink-2)',
                  cursor: 'pointer',
                  fontWeight: selected ? 600 : 400,
                  transition: 'all 0.1s',
                }}
              >
                {v.word}
              </button>
            )
          })}
        </div>
        <input
          placeholder="or type words separated by commas..."
          value={newWordsUsed}
          onChange={(e) => setNewWordsUsed(e.target.value)}
          style={inputStyle}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={upsertWriting.isPending || !content.trim() || !log?.id}
        className="btn-action w-full justify-center"
        style={{ opacity: (upsertWriting.isPending || !content.trim() || !log?.id) ? 0.5 : 1, cursor: (!content.trim() || !log?.id) ? 'not-allowed' : 'pointer' }}
      >
        {upsertWriting.isPending ? 'Saving...' : 'Save Writing'}
      </button>

      {writing?.content && (
        <p className="text-center" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          Last saved · {new Date(writing.created_at).toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
