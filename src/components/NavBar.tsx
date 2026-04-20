'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { format } from 'date-fns'
import { BookOpen, BarChart2, Library, CalendarDays, MessagesSquare, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

const today = format(new Date(), 'yyyy-MM-dd')

const links = [
  { href: `/log/${today}`,    label: 'Today',    icon: BookOpen },
  { href: '/plan',            label: 'Plan',     icon: CalendarDays },
  { href: '/conversation',    label: 'Practice', icon: MessagesSquare },
  { href: '/progress',        label: 'Progress', icon: BarChart2 },
  { href: '/vocabulary-bank', label: 'Vocab',    icon: Library },
]

export function NavBar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <nav style={{ borderBottom: '1.5px solid var(--ink)', background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div
        style={{
          maxWidth: 1360,
          margin: '0 auto',
          padding: '20px 32px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand */}
        <Link href={`/log/${today}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div
            style={{
              width: 42, height: 42,
              border: '1.5px solid var(--ink)',
              background: 'var(--lime)',
              borderRadius: 12,
              display: 'grid', placeItems: 'center',
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0,
            }}
          >
            <svg
              viewBox="0 0 24 24" fill="none" stroke="#fff"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ width: 22, height: 22 }}
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
              <path d="M8 7h8M8 11h6" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 30, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Daily <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>English</em>
            </div>
            <div className="caps" style={{ color: 'var(--ink-3)', fontSize: 10, marginTop: -2 }}>
              est. 2026 · personal journal
            </div>
          </div>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href.startsWith('/log') && pathname.startsWith('/log')) ||
              (href === '/plan' && pathname.startsWith('/plan')) ||
              (href === '/conversation' && pathname.startsWith('/conversation'))
            return (
              <Link key={href} href={href} className={cn('nav-link-editorial', active && 'active')}>
                <Icon style={{ width: 15, height: 15 }} />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>

        {/* Right: streak pill + theme toggle + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px',
              border: '1.5px solid var(--ink)',
              borderRadius: 999,
              background: 'var(--coral)',
              color: '#fff',
              fontWeight: 600, fontSize: 13,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block', flexShrink: 0 }} />
            <span>12 day streak</span>
          </div>

          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle theme"
              style={{
                width: 38, height: 38,
                border: '1.5px solid var(--ink)',
                borderRadius: 10,
                background: 'var(--paper-2)',
                boxShadow: 'var(--shadow-sm)',
                display: 'grid', placeItems: 'center',
                cursor: 'pointer',
                color: 'var(--ink)',
              }}
            >
              {theme === 'dark'
                ? <Sun style={{ width: 16, height: 16 }} />
                : <Moon style={{ width: 16, height: 16 }} />
              }
            </button>
          )}

          <div
            style={{
              width: 38, height: 38,
              border: '1.5px solid var(--ink)',
              borderRadius: 10,
              background: 'var(--saffron)',
              boxShadow: 'var(--shadow-sm)',
              display: 'grid', placeItems: 'center',
              fontWeight: 700, fontSize: 15,
              color: 'var(--ink)',
            }}
          >
            M
          </div>
        </div>
      </div>
    </nav>
  )
}
