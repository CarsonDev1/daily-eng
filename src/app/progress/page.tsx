'use client'

import { motion } from 'framer-motion'
import { useAllVocabulary, useAllWritingSessions } from '@/hooks/useDailyLog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, startOfMonth, eachDayOfInterval, endOfMonth, isSameDay, subDays } from 'date-fns'
import { Flame, BookOpen, PenLine, TrendingUp } from 'lucide-react'

export default function ProgressPage() {
  const { data: allVocab = [] } = useAllVocabulary()
  const { data: allWriting = [] } = useAllWritingSessions()

  const today = new Date()
  const monthDays = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) })

  // Group vocab count by date
  const vocabByDate = allVocab.reduce<Record<string, number>>((acc, v) => {
    acc[v.date] = (acc[v.date] ?? 0) + 1
    return acc
  }, {})

  // Writing sessions indexed by date
  const writingByDate = new Map(allWriting.map((w) => [w.date, w]))

  // A day is "completed" when it has ≥10 vocab words + writing content + mini journal
  const completedDates = new Set(
    Object.entries(vocabByDate)
      .filter(([date, count]) => {
        if (count < 10) return false
        const ws = writingByDate.get(date)
        return !!ws?.content && !!ws?.mini_journal
      })
      .map(([date]) => date)
  )

  // Writing sessions = days that have writing content (regardless of vocab)
  const writingDays = allWriting.filter((w) => !!w.content).length

  const totalWords = allVocab.length
  const completedDays = completedDates.size

  // Streak: count consecutive completed calendar days going back from today
  let streak = 0
  const todayStr = format(today, 'yyyy-MM-dd')
  let checkDate = completedDates.has(todayStr) ? today : subDays(today, 1)
  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd')
    if (completedDates.has(dateStr)) {
      streak++
      checkDate = subDays(checkDate, 1)
    } else {
      break
    }
  }

  // Group vocab by week
  const byWeek = allVocab.reduce<Record<number, number>>((acc, v) => {
    acc[v.week_number] = (acc[v.week_number] ?? 0) + 1
    return acc
  }, {})

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="float text-3xl select-none">📊</div>
        <h1 className="text-2xl font-bold gradient-text">Progress Tracker</h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Flame className="w-5 h-5 text-orange-500" />} label="Current Streak" value={`${streak} day${streak !== 1 ? 's' : ''}`} emoji="🔥" color="rgba(251,146,60,0.12)" border="rgba(251,146,60,0.25)" />
        <StatCard icon={<BookOpen className="w-5 h-5 text-blue-500" />} label="Words Learned" value={String(totalWords)} emoji="📚" color="rgba(96,165,250,0.12)" border="rgba(96,165,250,0.25)" />
        <StatCard icon={<PenLine className="w-5 h-5 text-green-500" />} label="Writing Sessions" value={String(writingDays)} emoji="✍️" color="rgba(52,211,153,0.12)" border="rgba(52,211,153,0.25)" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-purple-500" />} label="Days Completed" value={String(completedDays)} emoji="⭐" color="rgba(167,139,250,0.12)" border="rgba(167,139,250,0.25)" />
      </div>

      {/* Monthly Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {format(today, 'MMMM yyyy')} — Streak Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: 'var(--c-text-3)' }}>
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: (monthDays[0].getDay() + 6) % 7 }).map((_, i) => (
              <div key={`offset-${i}`} />
            ))}

            {monthDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd')
              const done = completedDates.has(dayStr)
              const isToday = isSameDay(day, today)
              const isPast = day < today && !isToday

              const cellStyle: React.CSSProperties = done
                ? { background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.45)', color: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.15)' }
                : isToday
                ? { background: 'var(--c-accent-bg)', border: '2px solid var(--c-accent-border)', color: 'var(--c-text-1)' }
                : isPast
                ? { background: 'var(--c-bg)', border: '1px solid var(--c-card-border)', color: 'var(--c-text-3)' }
                : { border: '1px solid transparent', color: 'var(--c-text-3)', opacity: 0.4 }

              return (
                <div key={dayStr} className="aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all" style={cellStyle}>
                  <span>{format(day, 'd')}</span>
                  {done && <span className="text-xs leading-none">🔥</span>}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Words by Week */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Words Learned by Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((week) => {
              const count = byWeek[week] ?? 0
              const pct = Math.min((count / 60) * 100, 100)
              return (
                <div key={week} className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--c-text-1)' }}>{count}</div>
                  <div className="text-xs mb-2" style={{ color: 'var(--c-text-3)' }}>/ 60 words</div>
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--c-text-2)' }}>Week {week}</div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--c-card-border)' }}>
                    <motion.div
                      className="h-full rounded-full progress-shimmer"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {count >= 60 ? 'Complete!' : `${Math.round(pct)}%`}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, emoji, color, border }: {
  icon: React.ReactNode; label: string; value: string
  emoji: string; color: string; border: string
}) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
      <Card style={{ background: color, borderColor: border }}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: color, border: `1px solid ${border}` }}>
              {emoji}
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>{label}</p>
              <p className="text-xl font-bold" style={{ color: 'var(--c-text-1)' }}>{value}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
