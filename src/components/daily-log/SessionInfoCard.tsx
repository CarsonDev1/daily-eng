'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DailyLog } from '@/lib/supabase'
import { Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
  date: string
  log: DailyLog | null | undefined
  onUpdate: (fields: Partial<DailyLog>) => void
}

export function SessionInfoCard({ log, onUpdate }: Props) {
  const [topic, setTopic] = useState<string>(log?.topic ?? '')
  const [startedAt, setStartedAt] = useState<string>(log?.started_at ?? '')
  const [finishedAt, setFinishedAt] = useState<string>(log?.finished_at ?? '')
  const [week, setWeek] = useState<string>(String(log?.week_number ?? 1))

  useEffect(() => {
    setTopic(log?.topic ?? '')
    setStartedAt(log?.started_at ?? '')
    setFinishedAt(log?.finished_at ?? '')
    setWeek(String(log?.week_number ?? 1))
  }, [log])

  const save = (overrides: Partial<DailyLog> = {}) => {
    onUpdate({
      topic: topic || null,
      started_at: startedAt || null,
      finished_at: finishedAt || null,
      week_number: Number(week),
      ...overrides,
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1.5px solid var(--line-soft)',
    borderRadius: 10,
    background: 'var(--paper)',
    color: 'var(--ink)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <div className="card-editorial p-4">
      <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--ink-2)' }}>
        <Clock style={{ width: 15, height: 15 }} />
        <span className="caps" style={{ fontSize: 11 }}>Session Info</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="col-span-2">
          <label className="caps" style={{ fontSize: 10, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>
            Today&apos;s Topic
          </label>
          <input
            placeholder="e.g. Travel, Technology..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onBlur={() => save()}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'var(--ink)')}
          />
        </div>

        <div>
          <label className="caps" style={{ fontSize: 10, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>
            Week
          </label>
          <Select
            value={week}
            onValueChange={(v) => { if (v) { setWeek(v); save({ week_number: Number(v) }) } }}
          >
            <SelectTrigger style={{ border: '1.5px solid var(--line-soft)', borderRadius: 10, background: 'var(--paper)' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((w) => (
                <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2 col-span-2 sm:col-span-1">
          <div>
            <label className="caps" style={{ fontSize: 10, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>Started</label>
            <input
              type="time"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              onBlur={() => save()}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="caps" style={{ fontSize: 10, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>Finished</label>
            <input
              type="time"
              value={finishedAt}
              onChange={(e) => setFinishedAt(e.target.value)}
              onBlur={() => save()}
              style={inputStyle}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
