'use client'

import { DailyLog, VocabularyEntry } from '@/lib/supabase'
import { useGenerateVocabulary, useUpdateMySentence, useUpsertDailyLog, useAllVocabulary } from '@/hooks/useDailyLog'
import { Sparkles, Volume2, Bookmark } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  date: string
  log: DailyLog | null | undefined
  vocabulary: VocabularyEntry[]
  isLoading: boolean
}

const COLORS = ['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10'] as const

export function VocabularyStep({ date, log, vocabulary, isLoading }: Props) {
  const generateVocab = useGenerateVocabulary()
  const updateSentence = useUpdateMySentence()
  const upsertLog = useUpsertDailyLog()
  const { data: allVocabulary } = useAllVocabulary()

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

    const learnedWords = (allVocabulary ?? [])
      .filter((v) => v.date !== date)
      .map((v) => v.word)

    generateVocab.mutate({
      logId,
      date,
      topic: log?.topic ?? 'Daily Life',
      weekNumber: log?.week_number ?? 1,
      existingWords: learnedWords,
    })
  }

  const handleSentenceBlur = (entry: VocabularyEntry, value: string) => {
    if (value !== entry.my_sentence) {
      updateSentence.mutate({ id: entry.id, my_sentence: value, date })
    }
  }

  const handleSpeak = (word: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(word)
      utt.lang = 'en-US'
      window.speechSynthesis.speak(utt)
    }
  }

  const isPending = generateVocab.isPending || upsertLog.isPending

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ height: 120, borderRadius: 14, background: 'var(--chip)', border: '1.5px solid var(--line-soft)', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 20, color: 'var(--ink)' }}>Vocabulary</span>
            <span style={{
              padding: '2px 8px', border: '1.5px solid var(--ink)', borderRadius: 999,
              fontSize: 12, fontWeight: 700,
              background: vocabulary.length >= 10 ? 'rgba(49,156,246,0.1)' : 'var(--chip)',
              color: vocabulary.length >= 10 ? 'var(--lime)' : 'var(--ink-2)',
            }}>
              {vocabulary.length}/10
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>30 mins · Learn 10 new words · write your own sentence</p>
        </div>
        <button onClick={handleGenerate} disabled={isPending || hasWords} className={`btn-action sm ${hasWords ? 'disabled' : ''}`}>
          {isPending
            ? <><Sparkles style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Generating...</>
            : hasWords
            ? <><Sparkles style={{ width: 14, height: 14 }} /> Generated</>
            : <><Sparkles style={{ width: 14, height: 14 }} /> Generate Words</>}
        </button>
      </div>

      {vocabulary.length === 0 ? (
        <div className="card-editorial p-10 text-center">
          <div className="float text-5xl mb-4 select-none">✨</div>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-2)' }}>
            Click &quot;Generate Words&quot; to get 10 vocabulary words
          </p>
          <p style={{ fontSize: 12, marginTop: 6, color: 'var(--ink-3)' }}>
            Set your topic in Session Info for better results
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {vocabulary.map((entry, idx) => (
            <div key={entry.id} className={`word ${COLORS[idx % 10]}`}>
              <div className="word-no">{idx + 1}</div>
              <div className="word-main">
                <div className="w-head">
                  <div className="w">{entry.word}</div>
                </div>
                <div className="m">
                  <span className="vn">{entry.meaning}</span>
                </div>
                <div className="w-example">{entry.example_sentence}</div>
                <div className="w-yours">
                  <span className="label">Your turn ↓</span>
                  <input
                    placeholder={`Write a sentence using "${entry.word}"…`}
                    defaultValue={entry.my_sentence ?? ''}
                    onBlur={(e) => handleSentenceBlur(entry, e.target.value)}
                  />
                </div>
              </div>
              <div className="word-tools">
                <button className="icon-btn" onClick={() => handleSpeak(entry.word)} title="Pronounce">
                  <Volume2 style={{ width: 14, height: 14 }} />
                </button>
                <button className="icon-btn" title="Bookmark">
                  <Bookmark style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          ))}

          {vocabulary.length === 10 && (
            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1.5px solid var(--line-soft)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--lime)' }}>
                <span>🎉</span> All 10 words learned today!
              </p>
              <span style={{
                padding: '2px 10px', border: '1.5px solid var(--lime)', borderRadius: 999,
                fontSize: 12, fontWeight: 600, color: 'var(--lime)', background: 'rgba(49,156,246,0.08)',
              }}>
                Complete ✓
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
