'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { format } from 'date-fns'
import { BookOpen, BarChart2, Library, CalendarDays, MessagesSquare, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserButton, useUser } from '@clerk/nextjs'
import { TourButton } from './TourButton'

const today = format(new Date(), 'yyyy-MM-dd')

const links = [
  { href: `/log/${today}`,    label: 'Today',       icon: BookOpen,       id: 'nav-today' },
  { href: '/plan',            label: 'Plan',        icon: CalendarDays,   id: 'nav-plan' },
  { href: '/conversation',    label: 'Practice',    icon: MessagesSquare, id: 'nav-conversation' },
  { href: '/progress',        label: 'Progress',    icon: BarChart2,      id: 'nav-progress' },
  { href: '/vocabulary-bank', label: 'Vocab',       icon: Library,        id: 'nav-vocab' },
  { href: '/leaderboard',     label: 'Leaderboard', icon: Trophy,         id: 'nav-leaderboard' },
]

export function NavBar() {
  const pathname = usePathname()
  const { user } = useUser()

  function isActive(href: string) {
    return (
      pathname === href ||
      (href.startsWith('/log') && pathname.startsWith('/log')) ||
      (href === '/plan' && pathname.startsWith('/plan')) ||
      (href === '/conversation' && pathname.startsWith('/conversation'))
    )
  }

  return (
    <>
      <nav style={{ borderBottom: '1.5px solid var(--ink)', background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div
          style={{
            maxWidth: 1360,
            margin: '0 auto',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {/* Brand */}
          <Link href={`/log/${today}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <div
              style={{
                width: 38, height: 38,
                border: '1.5px solid var(--ink)',
                background: 'var(--lime)',
                borderRadius: 10,
                display: 'grid', placeItems: 'center',
                boxShadow: 'var(--shadow-sm)',
                flexShrink: 0,
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
                <path d="M8 7h8M8 11h6" />
              </svg>
            </div>
            <div className="nav-brand-content">
              <div style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 24, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                Daily <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>English</em>
              </div>
              <div className="caps nav-brand-sub" style={{ color: 'var(--ink-3)', fontSize: 9, marginTop: 1 }}>
                est. 2026 · personal journal
              </div>
            </div>
          </Link>

          {/* Nav links — desktop/tablet */}
          <div className="nav-desktop-links">
            {links.map(({ href, label, icon: Icon, id }) => (
              <Link key={href} id={id} href={href} className={cn('nav-link-editorial', isActive(href) && 'active')}>
                <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                <span className="nav-link-label">{label}</span>
              </Link>
            ))}
          </div>

          {/* Right: tour button + user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <TourButton />
            {user && (
              <div className="nav-username" style={{
                fontSize: 12, color: 'var(--ink-2)', fontWeight: 500,
                maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.firstName || user.username || user.emailAddresses[0]?.emailAddress?.split('@')[0]}
              </div>
            )}
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: {
                    width: 34, height: 34,
                    border: '1.5px solid var(--ink)',
                    borderRadius: 8,
                    boxShadow: 'var(--shadow-sm)',
                  },
                },
              }}
            />
          </div>
        </div>
      </nav>

      {/* Bottom nav — mobile only */}
      <nav className="nav-mobile-bottom">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cn('nav-mobile-link', isActive(href) && 'active')}>
            <Icon />
            <span>{label === 'Leaderboard' ? 'Board' : label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
