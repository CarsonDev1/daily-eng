'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DailyLog, VocabularyEntry } from '@/lib/supabase'
import { useGenerateVocabulary, useUpdateMySentence, useUpsertDailyLog } from '@/hooks/useDailyLog'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'

// Rainbow palette for the 10 word slots
const WORD_COLORS = [
  { accent: '#60a5fa', bg: 'rgba(96,165,250,0.09)',  border: 'rgba(96,165,250,0.30)' },
  { accent: '#a78bfa', bg: 'rgba(167,139,250,0.09)', border: 'rgba(167,139,250,0.30)' },
  { accent: '#34d399', bg: 'rgba(52,211,153,0.09)',  border: 'rgba(52,211,153,0.30)'  },
  { accent: '#fb923c', bg: 'rgba(251,146,60,0.09)',  border: 'rgba(251,146,60,0.30)'  },
  { accent: '#f472b6', bg: 'rgba(244,114,182,0.09)', border: 'rgba(244,114,182,0.30)' },
  { accent: '#38bdf8', bg: 'rgba(56,189,248,0.09)',  border: 'rgba(56,189,248,0.30)'  },
  { accent: '#4ade80', bg: 'rgba(74,222,128,0.09)',  border: 'rgba(74,222,128,0.30)'  },
  { accent: '#fbbf24', bg: 'rgba(251,191,36,0.09)',  border: 'rgba(251,191,36,0.30)'  },
  { accent: '#f87171', bg: 'rgba(248,113,113,0.09)', border: 'rgba(248,113,113,0.30)' },
  { accent: '#c084fc', bg: 'rgba(192,132,252,0.09)', border: 'rgba(192,132,252,0.30)' },
]

interface Props {
  date: string
  log: DailyLog | null | undefined
  vocabulary: VocabularyEntry[]
  isLoading: boolean
}

export function VocabularyStep({ date, log, vocabulary, isLoading }: Props) {
  const generateVocab = useGenerateVocabulary()
  const updateSentence = useUpdateMySentence()
  const upsertLog = useUpsertDailyLog()
  const [sentences, setSentences] = useState<Record<string, string>>({})

  const hasWords = vocabulary.length > 0

  const handleGenerate = async () => {
    let logId = log?.id
    if (!logId) {
      try {
        const newLog = await upsertLog.mutateAsync({
          date,
          week_number: log?.week_number ?? 1,
          topic: log?.topic ?? null,
        })
        logId = newLog.id
      } catch {
        toast.error('Failed to create log entry')
        return
      }
    }

    generateVocab.mutate({
      logId,
      date,
      topic: log?.topic ?? 'Daily Life',
      weekNumber: log?.week_number ?? 1,
      existingWords: [],
    })
  }

  const handleSentenceBlur = (entry: VocabularyEntry, value: string) => {
    if (value !== entry.my_sentence) {
      updateSentence.mutate({ id: entry.id, my_sentence: value, date })
    }
  }

  const isPending = generateVocab.isPending || upsertLog.isPending

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" style={{ background: 'var(--c-card-border)' }} />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <span>Vocabulary</span>
              <Badge
                className="ml-1 font-bold"
                style={{
                  background: vocabulary.length >= 10 ? 'rgba(52,211,153,0.15)' : 'var(--c-accent-bg)',
                  color: vocabulary.length >= 10 ? '#34d399' : '#a78bfa',
                  border: vocabulary.length >= 10 ? '1px solid rgba(52,211,153,0.3)' : '1px solid var(--c-accent-border)',
                }}
              >
                {vocabulary.length}/10
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              30 mins · Learn 10 new words · write your own sentence
            </CardDescription>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isPending || hasWords}
            className="flex items-center gap-2 font-semibold"
            style={{
              background: hasWords
                ? 'var(--c-card-border)'
                : 'linear-gradient(135deg, #7c3aed, #60a5fa)',
              border: 'none',
              boxShadow: hasWords ? 'none' : '0 0 20px rgba(124,58,237,0.35)',
              opacity: isPending ? 0.7 : 1,
              cursor: hasWords ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? (
              <><Sparkles className="w-4 h-4 animate-spin" /> Generating...</>
            ) : hasWords ? (
              <><Sparkles className="w-4 h-4" /> Generated</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Words</>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {vocabulary.length === 0 ? (
          <div className="text-center py-14">
            <div className="float text-5xl mb-4 select-none">✨</div>
            <p className="text-sm font-medium" style={{ color: 'var(--c-text-2)' }}>
              Click &quot;Generate Words&quot; to get 10 vocabulary words
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--c-text-3)' }}>
              Set your topic in Session Info for better results
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {vocabulary.map((entry, idx) => {
              const c = WORD_COLORS[idx % WORD_COLORS.length]
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-2xl p-3 transition-all"
                  style={{
                    background: 'var(--c-bg)',
                    border: `1px solid var(--c-card-border)`,
                    borderLeft: `4px solid ${c.accent}`,
                  }}
                >
                  {/* Top row: number + word + meaning */}
                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={{ background: c.bg, color: c.accent, border: `1px solid ${c.border}` }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base leading-tight" style={{ color: 'var(--c-text-1)' }}>
                        {entry.word}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--c-text-2)' }}>
                        {entry.meaning}
                      </p>
                    </div>
                  </div>

                  {/* Example + My sentence */}
                  <div className="space-y-2 ml-10">
                    <div
                      className="rounded-xl px-3 py-2"
                      style={{ background: c.bg, border: `1px solid ${c.border}` }}
                    >
                      <p className="text-xs font-semibold mb-1" style={{ color: c.accent }}>
                        💬 Example
                      </p>
                      <p className="text-sm italic leading-snug" style={{ color: 'var(--c-text-2)' }}>
                        {entry.example_sentence}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--c-text-3)' }}>
                        ✏️ Your sentence
                      </p>
                      <Input
                        placeholder="Write your own sentence..."
                        defaultValue={entry.my_sentence ?? ''}
                        onChange={(e) => setSentences({ ...sentences, [entry.id]: e.target.value })}
                        onBlur={(e) => handleSentenceBlur(entry, e.target.value)}
                        className="text-sm h-8"
                        style={{ borderColor: entry.my_sentence ? c.accent + '60' : undefined }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {vocabulary.length === 10 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between pt-3"
                style={{ borderTop: '1px solid var(--c-card-border)' }}
              >
                <p className="text-sm font-semibold flex items-center gap-2">
                  <span>🎉</span>
                  <span style={{ color: '#34d399' }}>All 10 words learned today!</span>
                </p>
                <Badge
                  style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.4)', background: 'rgba(52,211,153,0.1)' }}
                >
                  Complete ✓
                </Badge>
              </motion.div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
