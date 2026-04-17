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
  const btnClass = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'

  return (
    <button
      onClick={handleSpeak}
      title={`Pronounce "${word}"`}
      className={`${btnClass} rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0`}
      style={{
        background: speaking ? 'rgba(96,165,250,0.22)' : 'rgba(96,165,250,0.08)',
        border: `1px solid ${speaking ? 'rgba(96,165,250,0.5)' : 'rgba(96,165,250,0.25)'}`,
        color: speaking ? '#60a5fa' : '#94a3b8',
      }}
    >
      <Volume2 className={`${iconClass} ${speaking ? 'animate-pulse' : ''}`} />
    </button>
  )
}
