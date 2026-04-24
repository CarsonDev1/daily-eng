'use client'

import { motion } from 'framer-motion'
import { useAllVocabulary, useAllWritingSessions } from '@/hooks/useDailyLog'
import { format, startOfMonth, eachDayOfInterval, endOfMonth, isSameDay, subDays } from 'date-fns'
import { Award } from 'lucide-react'

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
    { label: '7-day streak',  icon: '🔥', desc: 'Keep up the daily habit',          earned: streak >= 7 },
    { label: '50 words',      icon: '📚', desc: 'Build your vocabulary base',        earned: totalWords >= 50 },
    { label: '10 sessions',   icon: '✍️', desc: 'Consistent writing practice',       earned: writingDays >= 10 },
    { label: '30 days',       icon: '🏆', desc: 'Complete the full 30-day sprint',   earned: completedDays >= 30 },
  ]

  const barColors = ['', 'coral', 'saffron', 'sky']

  return (
    <div id="tour-progress-page" className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="page-h1" style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 42, color: 'var(--ink)', lineHeight: 1, marginBottom: 4 }}>
          The long quiet <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>of the work</em>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>{format(today, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Mega stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -2 }} className="mega coral">
          <span className="flame">🔥</span>
          <div className="cap">Streak</div>
          <div className="big">{streak}</div>
          <div className="hint">{streak !== 1 ? 'days' : 'day'} in a row</div>
          <div className="sparkline" style={{ marginTop: 12 }}>
            {Array.from({ length: 7 }).map((_, i) => {
              const d = subDays(today, 6 - i)
              const dStr = format(d, 'yyyy-MM-dd')
              const h = completedDates.has(dStr) ? 100 : 15
              const isToday = isSameDay(d, today)
              return <div key={i} className={`bar${isToday ? ' today' : ''}`} style={{ height: `${h}%` }} />
            })}
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="mega lime">
          <div className="cap">Words</div>
          <div className="big">{totalWords}</div>
          <div className="hint">{Math.round((totalWords / 240) * 100)}% of 240 goal</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="mega">
          <div className="cap">Writing</div>
          <div className="big">{writingDays}</div>
          <div className="hint">sessions done</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="mega dark">
          <div className="cap">Days</div>
          <div className="big">{completedDays}</div>
          <div className="hint">{Math.round((completedDays / 30) * 100)}% of 30-day sprint</div>
        </motion.div>
      </div>

      {/* Sprint Calendar */}
      <div className="card-editorial p-5">
        <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, color: 'var(--ink)', marginBottom: 4 }}>
          {format(today, 'MMMM yyyy')}
        </p>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 20 }}>Sprint calendar — completed days shown in green</p>

        {/* Week day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
          {weekDays.map((d) => (
            <span key={d} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', fontWeight: 700, textAlign: 'center', padding: '4px 0' }}>{d}</span>
          ))}
        </div>

        {/* Days grid */}
        <div className="month-grid">
          {Array.from({ length: startOffset }).map((_, i) => <div key={`off-${i}`} className="m-cell empty" />)}
          {monthDays.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd')
            const done = completedDates.has(dayStr)
            const isToday = isSameDay(day, today)
            const isPast = day < today && !isToday

            let cls = 'future'
            if (done) cls = 'done'
            else if (isToday) cls = 'today'
            else if (isPast) cls = 'miss'

            return (
              <div key={dayStr} className={`m-cell ${cls}`}>
                <span className="num">{format(day, 'd')}</span>
                <div className="tick">
                  <svg viewBox="0 0 10 10">
                    <polyline points="2,5 4,8 8,2" fill="none" />
                  </svg>
                </div>
                {vocabByDate[dayStr] ? <span className="w-count">{vocabByDate[dayStr]}w</span> : <span />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Words by Week */}
      <div className="weekly-breakdown">
        <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, color: 'var(--ink)', marginBottom: 20 }}>
          Words by Week
        </p>
        {[1, 2, 3, 4].map((week, idx) => {
          const count = byWeek[week] ?? 0
          const pct = Math.min((count / 60) * 100, 100)
          return (
            <div key={week} className="bar-row">
              <div className="bar-lbl">
                <div>Week {week}</div>
                <div className="d">{count} words</div>
              </div>
              <div className="bar-track">
                <motion.div
                  className={`bar-fill${barColors[idx] ? ` ${barColors[idx]}` : ''}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                >
                  {pct > 20 && `${Math.round(pct)}%`}
                </motion.div>
              </div>
              <div className="bar-num">
                {count}<span className="of">/{60}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Milestones */}
      <div className="card-editorial p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award style={{ width: 16, height: 16, color: 'var(--saffron)' }} />
          <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, color: 'var(--ink)' }}>Milestones</p>
        </div>
        <div>
          {milestones.map((m) => (
            <div key={m.label} className={`badge ${m.earned ? 'earned' : 'locked'}`}>
              <div className="medal">{m.icon}</div>
              <div>
                <div className="ttl">{m.label}</div>
                <div className="d">{m.desc}</div>
              </div>
              <div className="date">{m.earned ? 'earned' : 'locked'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Note card */}
      <div className="note-card">
        <div className="cap">Keep going</div>
        <div className="msg">
          Every word you learn is a step toward <em>fluency</em>.
        </div>
      </div>
    </div>
  )
}
