'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/client'
import { api } from '@/lib/axios'

export interface ProfileRow {
  user_id: string
  display_name: string
  avatar_url: string | null
  total_words: number
  streak: number
  completed_days: number
  writing_sessions: number
  badges: string[]
  points: number
  updated_at: string
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('points', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []) as ProfileRow[]
    },
    staleTime: 30 * 1000,
  })
}

export function useSyncProfile() {
  const { user } = useUser()
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not signed in')
      const { data } = await api.post('/sync-profile')
      return data
    },
  })
}
