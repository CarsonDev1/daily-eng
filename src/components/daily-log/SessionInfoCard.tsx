'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--c-text-2)' }}>
          <Clock className="w-4 h-4" /> Session Info
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="col-span-2 sm:col-span-2">
            <Label className="text-xs" style={{ color: 'var(--c-text-3)' }}>Today&apos;s Topic</Label>
            <Input
              placeholder="e.g. Travel, Technology..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onBlur={() => save()}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs" style={{ color: 'var(--c-text-3)' }}>Week</Label>
            <Select
              value={week}
              onValueChange={(v) => { if (v) { setWeek(v); save({ week_number: Number(v) }) } }}
            >
              <SelectTrigger className="mt-1">
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
              <Label className="text-xs" style={{ color: 'var(--c-text-3)' }}>Started</Label>
              <Input
                type="time"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                onBlur={() => save()}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs" style={{ color: 'var(--c-text-3)' }}>Finished</Label>
              <Input
                type="time"
                value={finishedAt}
                onChange={(e) => setFinishedAt(e.target.value)}
                onBlur={() => save()}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
