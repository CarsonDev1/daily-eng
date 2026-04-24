'use client'

import { useEffect, useState } from 'react'
import { useOnborda } from 'onborda'

const TOUR_KEY = 'daily-eng-tour-v1'

export function TourButton() {
  const { startOnborda } = useOnborda()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!localStorage.getItem(TOUR_KEY)) {
      localStorage.setItem(TOUR_KEY, '1')
      // small delay so page elements are fully rendered
      const t = setTimeout(() => startOnborda('main'), 900)
      return () => clearTimeout(t)
    }
  }, [startOnborda])

  if (!mounted) return null

  return (
    <button
      onClick={() => startOnborda('main')}
      title="Xem hướng dẫn sử dụng"
      style={{
        width: 32,
        height: 32,
        border: '1.5px solid var(--ink)',
        borderRadius: 8,
        background: 'var(--saffron)',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        boxShadow: 'var(--shadow-sm)',
        fontFamily: 'var(--font-serif, serif)',
        fontSize: 16,
        fontWeight: 700,
        color: 'var(--ink)',
        flexShrink: 0,
        transition: 'transform 0.08s ease, box-shadow 0.08s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translate(-1px,-1px)'
        e.currentTarget.style.boxShadow = 'var(--shadow)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      }}
    >
      ?
    </button>
  )
}
