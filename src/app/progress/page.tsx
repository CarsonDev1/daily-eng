'use client'

import { motion } from 'framer-motion'
import { useAllVocabulary, useAllWritingSessions } from '@/hooks/useDailyLog'
import { format, startOfMonth, eachDayOfInterval, endOfMonth, isSameDay, subDays } from 'date-fns'
import { Flame, BookOpen, PenLine, TrendingUp, Award } from 'lucide-react'

export default function ProgressPage() {
  const { data: allVocab = [] } = useAllVocabulary()
  const { data: allWriting = [] } = useAllWritingSessions()

  const today = new Date()
  const monthDays = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) })

  const vocabByDate = allVocab.reduce<Record<string, number>>((acc, v) => {
    acc[v.date] = (acc[v.date] ?? 0) + 1
    return acc
  }, {})

  const writingByDate = new Map(allWriting.map((w) => [w.date, w]))

  const completedDates = new Set(
    Object.entries(vocabByDate)
      .filter(([date, count]) => {
        if (count < 10) return false
        const ws = writingByDate.get(date)
        return !!ws?.content && !!ws?.mini_journal
      })
      .map(([date]) => date)
  )

  const writingDays = allWriting.filter((w) => !!w.content).length
  const totalWords = allVocab.length
  const completedDays = completedDates.size

  let streak = 0
  const todayStr = format(today, 'yyyy-MM-dd')
  let checkDate = completedDates.has(todayStr) ? today : subDays(today, 1)
  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd')
    if (completedDates.has(dateStr)) { streak++; checkDate = subDays(checkDate, 1) }
    else break
  }

  const byWeek = allVocab.reduce<Record<number, number>>((acc, v) => {
    acc[v.week_number] = (acc[v.week_number] ?? 0) + 1
    return acc
  }, {})

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const startOffset = (monthDays[0].getDay() + 6) % 7

  const milestones = [
    { label: '7-day streak', icon: '🔥', earned: streak >= 7 },
    { label: '50 words', icon: '📚', earned: totalWords >= 50 },
    { label: '10 sessions', icon: '✍️', earned: writingDays >= 10 },
    { label: '30 days', icon: '🏆', earned: completedDays >= 30 },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 42, color: 'var(--ink)', lineHeight: 1, marginBottom: 4 }}>
          The long quiet <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>of the work</em>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>{format(today, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Mega stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -2 }} className="mega">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Flame style={{ width: 16, height: 16, color: 'var(--coral)' }} />
            <span className="caps" style={{ fontSize: 9, color: 'var(--ink-3)' }}>Streak</span>
          </div>
          <div className="mega-val" style={{ color: streak > 0 ? 'var(--coral)' : 'var(--ink)' }}>{streak}</div>
          <div className="mega-lbl">{streak !== 1 ? 'days' : 'day'} in a row</div>
          {streak > 0 && (
            <div className="sparkline" style={{ marginTop: 12 }}>
              {Array.from({ length: 7 }).map((_, i) => {
                const d = subDays(today, 6 - i)
                const dStr = format(d, 'yyyy-MM-dd')
                const h = completedDates.has(dStr) ? 100 : 15
                return <span key={i} style={{ height: `${h}%` }} />
              })}
            </div>
          )}
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="mega">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <BookOpen style={{ width: 16, height: 16, color: 'var(--lime)' }} />
            <span className="caps" style={{ fontSize: 9, color: 'var(--ink-3)' }}>Words</span>
          </div>
          <div className="mega-val">{totalWords}</div>
          <div className="mega-lbl">words learned</div>
          <div className="mega-sub" style={{ marginTop: 8, color: 'var(--lime)' }}>{Math.round((totalWords / 240) * 100)}% of 240 goal</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="mega">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <PenLine style={{ width: 16, height: 16, color: 'var(--mint)' }} />
            <span className="caps" style={{ fontSize: 9, color: 'var(--ink-3)' }}>Writing</span>
          </div>
          <div className="mega-val">{writingDays}</div>
          <div className="mega-lbl">sessions done</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="mega">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <TrendingUp style={{ width: 16, height: 16, color: 'var(--lilac)' }} />
            <span className="caps" style={{ fontSize: 9, color: 'var(--ink-3)' }}>Days</span>
          </div>
          <div className="mega-val">{completedDays}</div>
          <div className="mega-lbl">completed</div>
          <div className="mega-sub" style={{ marginTop: 8, color: 'var(--lilac)' }}>{Math.round((completedDays / 30) * 100)}% of 30-day sprint</div>
        </motion.div>
      </div>

      {/* Sprint Calendar */}
      <div className="card-editorial p-5">
        <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, color: 'var(--ink)', marginBottom: 4 }}>
          {format(today, 'MMMM yyyy')}
        </p>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 20 }}>Sprint calendar — completed days shown in blue</p>

        {/* Week day headers */}
        <div className="cal-head mb-2">
          {weekDays.map((d) => <span key={d}>{d}</span>)}
        </div>

        {/* Days grid */}
        <div className="month-grid">
          {Array.from({ length: startOffset }).map((_, i) => <div key={`off-${i}`} />)}
          {monthDays.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd')
            const done = completedDates.has(dayStr)
            const isToday = isSameDay(day, today)
            const isPast = day < today && !isToday

            let cls = 'future'
            if (done) cls = 'done'
            else if (isToday) cls = 'today'
            else if (isPast) cls = 'past'

            return (
              <div key={dayStr} className={`m-cell ${cls}`}>
                <span className="num">{format(day, 'd')}</span>
                {done && <span className="fire">🔥</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Words by Week */}
      <div className="card-editorial p-5">
        <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, color: 'var(--ink)', marginBottom: 20 }}>
          Words by Week
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((week) => {
            const count = byWeek[week] ?? 0
            const pct = Math.min((count / 60) * 100, 100)
            return (
              <div key={week} className="text-center">
                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 40, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6 }}>/ 60 words</div>
                <div className="caps" style={{ fontSize: 9, color: 'var(--ink-2)', marginBottom: 6 }}>Week {week}</div>
                <div style={{ height: 6, borderRadius: 999, overflow: 'hidden', background: 'var(--line-soft)' }}>
                  <motion.div
                    className="progress-shimmer"
                    style={{ height: '100%', borderRadius: 999 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
                <div style={{
                  marginTop: 8, padding: '2px 8px', borderRadius: 999, display: 'inline-block',
                  fontSize: 11, fontWeight: 600,
                  border: `1.5px solid ${count >= 60 ? 'var(--lime)' : 'var(--line-soft)'}`,
                  color: count >= 60 ? 'var(--lime)' : 'var(--ink-3)',
                  background: count >= 60 ? 'rgba(49,156,246,0.08)' : 'var(--chip)',
                }}>
                  {count >= 60 ? 'Complete!' : `${Math.round(pct)}%`}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Milestones */}
      <div className="card-editorial p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award style={{ width: 16, height: 16, color: 'var(--saffron)' }} />
          <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, color: 'var(--ink)' }}>Milestones</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {milestones.map((m) => (
            <div key={m.label} className={`badge ${m.earned ? 'earned' : ''}`}>
              <span>{m.icon}</span>
              {m.label}
              {m.earned && <span style={{ color: 'var(--saffron)' }}>✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
