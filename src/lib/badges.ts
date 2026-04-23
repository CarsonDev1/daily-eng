export interface BadgeDef {
  id: string
  emoji: string
  title: string
  desc: string
}

export interface UserStats {
  total_words: number
  streak: number
  completed_days: number
  writing_sessions: number
}

export const BADGES: BadgeDef[] = [
  { id: 'first_word',   emoji: '🌱', title: 'First Word',      desc: 'Learn your very first word' },
  { id: 'words_10',     emoji: '📖', title: 'Getting Started', desc: '10 words in the bank' },
  { id: 'words_50',     emoji: '📚', title: '50 Words',         desc: 'Build a solid base' },
  { id: 'words_100',    emoji: '💯', title: 'Century',           desc: '100 words learned' },
  { id: 'words_240',    emoji: '🎓', title: 'Graduate',          desc: 'Full 240-word sprint' },
  { id: 'streak_3',     emoji: '🔥', title: '3-Day Fire',        desc: '3 days in a row' },
  { id: 'streak_7',     emoji: '⚡', title: 'Week Warrior',      desc: '7 days straight' },
  { id: 'streak_14',    emoji: '🌟', title: 'Fortnight',         desc: '14 days in a row' },
  { id: 'streak_30',    emoji: '👑', title: 'Month Master',      desc: '30 days straight' },
  { id: 'writer_1',     emoji: '✏️', title: 'First Essay',       desc: 'Complete first writing session' },
  { id: 'writer_5',     emoji: '✍️', title: 'Writer',            desc: '5 writing sessions done' },
  { id: 'writer_10',    emoji: '📝', title: 'Storyteller',       desc: '10 writing sessions done' },
  { id: 'sprint_done',  emoji: '🏆', title: 'Sprint Complete',   desc: '30 fully completed days' },
]

export function computeBadges(stats: UserStats): string[] {
  const earned: string[] = []
  if (stats.total_words >= 1)   earned.push('first_word')
  if (stats.total_words >= 10)  earned.push('words_10')
  if (stats.total_words >= 50)  earned.push('words_50')
  if (stats.total_words >= 100) earned.push('words_100')
  if (stats.total_words >= 240) earned.push('words_240')
  if (stats.streak >= 3)        earned.push('streak_3')
  if (stats.streak >= 7)        earned.push('streak_7')
  if (stats.streak >= 14)       earned.push('streak_14')
  if (stats.streak >= 30)       earned.push('streak_30')
  if (stats.writing_sessions >= 1)  earned.push('writer_1')
  if (stats.writing_sessions >= 5)  earned.push('writer_5')
  if (stats.writing_sessions >= 10) earned.push('writer_10')
  if (stats.completed_days >= 30)   earned.push('sprint_done')
  return earned
}

export function computePoints(stats: UserStats): number {
  return (
    stats.total_words * 2 +
    stats.streak * 15 +
    stats.completed_days * 25 +
    stats.writing_sessions * 5
  )
}
