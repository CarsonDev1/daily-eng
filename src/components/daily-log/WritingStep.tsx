'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PenLine className="w-5 h-5 text-green-600" />
              Free Writing
            </CardTitle>
            <CardDescription className="mt-1">
              20 mins · 5–8 sentences · Just write, don&apos;t overthink it
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateTopic}
            disabled={generateTopic.isPending}
            className="flex items-center gap-2"
          >
            {generateTopic.isPending ? (
              <><RefreshCw className="w-3 h-3 animate-spin" /> Thinking...</>
            ) : (
              <><Sparkles className="w-3 h-3 text-purple-500" /> AI Topic</>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Topic input */}
        <div>
          <Label className="text-sm font-medium">Today&apos;s Topic</Label>
          <div className="flex gap-2 mt-1">
            <Input
              placeholder="Write your topic here..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-xs"
              style={{ color: 'var(--c-text-2)' }}
            >
              Suggestions {showSuggestions ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </Button>
          </div>
        </div>

        {/* AI generated prompt */}
        {generatedPrompt && (
          <div
            className="rounded-lg p-3"
            style={{ background: 'var(--c-purple-bg)', border: '1px solid var(--c-purple-border)' }}
          >
            <p className="text-xs font-medium text-purple-500 mb-1">AI Writing Prompt</p>
            <p className="text-sm" style={{ color: 'var(--c-text-1)' }}>{generatedPrompt}</p>
          </div>
        )}

        {/* Topic suggestions */}
        {showSuggestions && (
          <div
            className="rounded-lg p-4 space-y-3"
            style={{ background: 'var(--c-bg)', border: '1px solid var(--c-card-border)' }}
          >
            {TOPIC_SUGGESTIONS.map((group) => (
              <div key={group.cat}>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: 'var(--c-text-3)' }}
                >
                  {group.cat}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.topics.map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTopic(t); setShowSuggestions(false) }}
                      className="text-xs px-3 py-1 rounded-full transition-colors hover:border-green-400 hover:text-green-600"
                      style={{
                        background: 'var(--c-card)',
                        border: '1px solid var(--c-card-border)',
                        color: 'var(--c-text-2)',
                      }}
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
          <div className="flex items-center justify-between mb-1">
            <Label className="text-sm font-medium">My Writing</Label>
            <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>
              {wordCount} words · {sentenceCount} sentences
              {sentenceCount >= 5 && sentenceCount <= 8 && (
                <span className="text-green-500 ml-1">✓ Good length!</span>
              )}
            </span>
          </div>
          <Textarea
            placeholder="Write 5–8 sentences in English here — not perfect, just write!"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[160px] resize-y text-sm leading-relaxed"
          />
        </div>

        {/* Words used */}
        <div>
          <Label className="text-sm font-medium">New Words I Used</Label>
          <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
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
                  className="text-xs px-2.5 py-1 rounded-full transition-colors"
                  style={selected ? {
                    background: 'var(--c-green-bg)',
                    border: '1px solid var(--c-green-border)',
                    color: '#16a34a',
                  } : {
                    background: 'var(--c-card)',
                    border: '1px solid var(--c-card-border)',
                    color: 'var(--c-text-2)',
                  }}
                >
                  {v.word}
                </button>
              )
            })}
          </div>
          <Input
            placeholder="or type words separated by commas..."
            value={newWordsUsed}
            onChange={(e) => setNewWordsUsed(e.target.value)}
            className="text-sm"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={upsertWriting.isPending || !content.trim() || !log?.id}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {upsertWriting.isPending ? 'Saving...' : 'Save Writing'}
        </Button>

        {writing?.content && (
          <p className="text-xs text-center" style={{ color: 'var(--c-text-3)' }}>
            Last saved · {new Date(writing.created_at).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
