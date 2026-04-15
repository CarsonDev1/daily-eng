'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { format } from 'date-fns'
import { BookOpen, BarChart2, Library, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

const today = format(new Date(), 'yyyy-MM-dd')

const links = [
  { href: `/log/${today}`, label: 'Today',    icon: BookOpen },
  { href: '/progress',    label: 'Progress',  icon: BarChart2 },
  { href: '/vocabulary-bank', label: 'Vocab', icon: Library },
]

export function NavBar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <nav
      className="sticky top-0 z-50 w-full transition-colors duration-300"
      style={{
        background: 'var(--c-nav-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--c-nav-border)',
        boxShadow: '0 1px 12px rgba(0,0,0,0.08)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href={`/log/${today}`} className="flex items-center gap-2">
          <span className="text-xl">🇬🇧</span>
          <span className="font-bold text-lg gradient-text tracking-tight">Daily English</span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Nav links */}
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href.startsWith('/log') && pathname.startsWith('/log'))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  active
                    ? 'text-violet-600 dark:text-violet-300'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                )}
                style={active ? {
                  background: 'var(--c-accent-bg)',
                  border: '1px solid var(--c-accent-border)',
                } : {
                  border: '1px solid transparent',
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="ml-1 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              style={{ border: '1px solid var(--c-card-border)' }}
              title="Toggle theme"
            >
              {theme === 'dark'
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />
              }
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
