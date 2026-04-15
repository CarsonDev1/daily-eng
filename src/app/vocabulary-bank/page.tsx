'use client'

import { useState } from 'react'
import { useAllVocabulary } from '@/hooks/useDailyLog'
import type { VocabularyEntry } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Library } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const WEEK_COLORS = [
  { accent: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)' },
  { accent: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  { accent: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)'  },
  { accent: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)'  },
]

export default function VocabularyBankPage() {
  const { data: allVocab = [], isLoading } = useAllVocabulary()
  const [search, setSearch] = useState('')

  const filtered = allVocab.filter(
    (v) =>
      v.word.toLowerCase().includes(search.toLowerCase()) ||
      v.meaning.toLowerCase().includes(search.toLowerCase())
  )

  const byWeek = [1, 2, 3, 4].map((week) => ({
    week,
    entries: filtered.filter((v) => v.week_number === week),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="float text-3xl select-none">📖</div>
          <h1 className="text-2xl font-bold gradient-text">Vocabulary Bank</h1>
        </div>
        <Badge
          className="text-sm px-3 py-1 font-bold"
          style={{ background: 'var(--c-accent-bg)', color: '#a78bfa', border: '1px solid var(--c-accent-border)' }}
        >
          {allVocab.length} words
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--c-text-3)' }} />
        <Input
          placeholder="Search words or meanings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" style={{ background: 'var(--c-card-border)' }} />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
            {byWeek.map(({ week, entries }) => (
              <TabsTrigger key={week} value={`week${week}`}>
                W{week} ({entries.length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <VocabTable entries={filtered} showWeek />
          </TabsContent>

          {byWeek.map(({ week, entries }) => (
            <TabsContent key={week} value={`week${week}`} className="mt-4">
              {entries.length === 0 ? (
                <EmptyState week={week} />
              ) : (
                <VocabTable entries={entries} showWeek={false} />
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}

function VocabTable({ entries, showWeek }: { entries: VocabularyEntry[]; showWeek: boolean }) {
  if (!entries || entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm" style={{ color: 'var(--c-text-3)' }}>No words found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Word</TableHead>
              <TableHead>Meaning</TableHead>
              <TableHead className="hidden sm:table-cell">Example</TableHead>
              <TableHead className="hidden md:table-cell">My Sentence</TableHead>
              {showWeek && <TableHead className="w-16">Week</TableHead>}
              <TableHead className="w-24 hidden sm:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, idx) => {
              const c = WEEK_COLORS[(entry.week_number - 1) % WEEK_COLORS.length]
              return (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: c.bg, color: c.accent, border: `1px solid ${c.border}` }}
                    >
                      {idx + 1}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-sm" style={{ color: c.accent }}>{entry.word}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm" style={{ color: 'var(--c-text-2)' }}>{entry.meaning}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell max-w-[200px] truncate">
                    <span className="text-sm italic" style={{ color: 'var(--c-text-3)' }}>{entry.example_sentence}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                    {entry.my_sentence
                      ? <span className="text-sm" style={{ color: 'var(--c-text-2)' }}>{entry.my_sentence}</span>
                      : <span style={{ color: 'var(--c-text-3)' }}>—</span>
                    }
                  </TableCell>
                  {showWeek && (
                    <TableCell>
                      <Badge
                        className="text-xs font-bold"
                        style={{ background: c.bg, color: c.accent, border: `1px solid ${c.border}` }}
                      >
                        W{entry.week_number}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>
                      {format(parseISO(entry.date), 'MMM d')}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function EmptyState({ week }: { week: number }) {
  const c = WEEK_COLORS[(week - 1) % WEEK_COLORS.length]
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <div className="text-4xl mb-3 opacity-30">
          <Library className="w-12 h-12 mx-auto" style={{ color: c.accent }} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--c-text-2)' }}>No words for Week {week} yet</p>
        <p className="text-xs mt-1" style={{ color: 'var(--c-text-3)' }}>
          Go to Today&apos;s Log and generate your vocabulary
        </p>
      </CardContent>
    </Card>
  )
}
