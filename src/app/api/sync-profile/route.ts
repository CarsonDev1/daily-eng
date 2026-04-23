import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'
import { format, subDays } from 'date-fns'
import { computeBadges, computePoints } from '@/lib/badges'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clerkUser = await currentUser()
  const displayName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
    clerkUser?.username ||
    'Anonymous'
  const avatarUrl = clerkUser?.imageUrl ?? null

  const supabase = await createClient()

  // Fetch all vocabulary entries for this user
  const { data: allVocab } = await supabase
    .from('vocabulary_entries')
    .select('date')
    .eq('user_id', userId)

  // Fetch all writing sessions for this user
  const { data: allWriting } = await supabase
    .from('writing_sessions')
    .select('date, content, mini_journal')
    .eq('user_id', userId)

  const total_words = allVocab?.length ?? 0
  const writing_sessions = (allWriting ?? []).filter((w: { content: string | null }) => !!w.content).length

  // Build completed dates (vocab ≥10 AND writing done)
  const vocabByDate: Record<string, number> = {}
  ;(allVocab ?? []).forEach((v: { date: string }) => {
    vocabByDate[v.date] = (vocabByDate[v.date] ?? 0) + 1
  })
  type WritingRow = { date: string; content: string | null; mini_journal: string | null }
  const writingByDate = new Map<string, WritingRow>((allWriting ?? []).map((w: WritingRow) => [w.date, w]))

  const completedDates = new Set(
    Object.entries(vocabByDate)
      .filter(([date, count]) => {
        if (count < 10) return false
        const ws = writingByDate.get(date)
        return !!ws?.content && !!ws?.mini_journal
      })
      .map(([date]) => date)
  )
  const completed_days = completedDates.size

  // Compute streak
  let streak = 0
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  let checkDate = completedDates.has(todayStr) ? new Date() : subDays(new Date(), 1)
  for (let i = 0; i < 365; i++) {
    const dateStr = format(checkDate, 'yyyy-MM-dd')
    if (completedDates.has(dateStr)) { streak++; checkDate = subDays(checkDate, 1) }
    else break
  }

  const stats = { total_words, streak, completed_days, writing_sessions }
  const badges = computeBadges(stats)
  const points = computePoints(stats)

  const { error } = await supabase.from('profiles').upsert({
    user_id: userId,
    display_name: displayName,
    avatar_url: avatarUrl,
    total_words,
    streak,
    completed_days,
    writing_sessions,
    badges,
    points,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, stats, badges, points })
}
