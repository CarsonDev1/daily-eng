'use client'

import { useState } from 'react'
import { Volume2 } from 'lucide-react'

interface SpeakButtonProps {
  word: string
  size?: 'sm' | 'md'
}

export function SpeakButton({ word, size = 'sm' }: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false)

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = 0.85
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const iconClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const btnSize = size === 'sm' ? { width: 24, height: 24 } : { width: 30, height: 30 }

  return (
    <button
      onClick={handleSpeak}
      title={`Pronounce "${word}"`}
      className="flex items-center justify-center transition-all active:scale-90 shrink-0"
      style={{
        ...btnSize,
        borderRadius: '50%',
        background: speaking ? 'var(--sky)' : 'var(--chip)',
        border: `1.5px solid ${speaking ? 'var(--lime)' : 'var(--line-soft)'}`,
        color: speaking ? 'var(--lime)' : 'var(--ink-3)',
        boxShadow: speaking ? 'var(--shadow-sm)' : 'none',
      }}
    >
      <Volume2 className={`${iconClass} ${speaking ? 'animate-pulse' : ''}`} />
    </button>
  )
}
