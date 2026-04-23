'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { useLeaderboard, useSyncProfile, type ProfileRow } from '@/hooks/useLeaderboard'
import { BADGES } from '@/lib/badges'
import { RefreshCw, Trophy } from 'lucide-react'

const AVATAR_COLORS = ['var(--lime)', 'var(--coral)', 'var(--saffron)', 'var(--sky)', 'var(--mint)', 'var(--lilac)', 'var(--blush)']

function avatarColor(userId: string) {
  let hash = 0
  for (const c of userId) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function BadgePills({ badgeIds }: { badgeIds: string[] }) {
  const earned = BADGES.filter((b) => badgeIds.includes(b.id))
  if (!earned.length) return <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>No badges yet</span>
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {earned.map((b) => (
        <span key={b.id} title={b.title} style={{ fontSize: 18, lineHeight: 1 }}>{b.emoji}</span>
      ))}
    </div>
  )
}

function RankNum({ rank }: { rank: number }) {
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
  if (medals[rank]) return <span style={{ fontSize: 28 }}>{medals[rank]}</span>
  return (
    <span style={{
      fontFamily: 'var(--font-serif, serif)', fontSize: 26, lineHeight: 1,
      color: rank <= 10 ? 'var(--ink)' : 'var(--ink-3)',
    }}>{rank}</span>
  )
}

function LeaderRow({ profile, rank, isMe }: { profile: ProfileRow; rank: number; isMe: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(rank * 0.04, 0.5) }}
      className={`lb-row${isMe ? ' me' : ''}`}
    >
      {/* Rank */}
      <div style={{ textAlign: 'center', width: 52 }}>
        <RankNum rank={rank} />
      </div>

      {/* Avatar + info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div className="lb-av" style={{ background: profile.avatar_url ? 'transparent' : avatarColor(profile.user_id), overflow: 'hidden', padding: 0 }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} referrerPolicy="no-referrer" />
            : initials(profile.display_name)
          }
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {profile.display_name}{isMe && <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>(you)</span>}
          </div>
          <div style={{ marginTop: 4 }}>
            <BadgePills badgeIds={profile.badges ?? []} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 32, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {profile.points.toLocaleString()}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>
          {profile.total_words}w · {profile.streak}🔥 · {profile.completed_days}d
        </div>
      </div>
    </motion.div>
  )
}

function Podium({ top3, myId }: { top3: ProfileRow[]; myId: string | null | undefined }) {
  const order = [1, 0, 2] // display 2nd, 1st, 3rd
  const heights = ['120px', '150px', '100px']
  const bgColors = ['var(--chip)', 'var(--saffron)', 'var(--blush)']
  const labels = ['2nd', '1st', '3rd']

  return (
    <div className="lb-podium">
      {order.map((idx, col) => {
        const p = top3[idx]
        if (!p) return <div key={col} />
        return (
          <motion.div
            key={p.user_id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: col * 0.1 }}
            className="podium-item"
            style={{ background: bgColors[col] }}
          >
            <div style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 10 }}>
              {labels[col]}
            </div>
            <div
              style={{
                width: 64, height: 64, borderRadius: 14,
                border: '1.5px solid var(--ink)',
                background: avatarColor(p.user_id),
                display: 'grid', placeItems: 'center',
                fontFamily: 'var(--font-serif, serif)', fontSize: 22, fontWeight: 700,
                margin: '0 auto 10px',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {p.avatar_url
                ? <img src={p.avatar_url} alt={p.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                : initials(p.display_name)
              }
            </div>
            <div style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 20, lineHeight: 1.1 }}>
              {p.display_name}
              {p.user_id === myId && <span style={{ fontSize: 11, opacity: 0.6, display: 'block', marginTop: 2 }}>(you)</span>}
            </div>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 22, fontWeight: 700, marginTop: 6 }}>
              {p.points.toLocaleString()} pts
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4 }}>
              {p.total_words} words · {p.streak}🔥
            </div>
            {/* Podium block */}
            <div style={{
              height: heights[col], background: 'var(--ink)', borderRadius: '0 0 10px 10px',
              margin: '14px -16px -20px', opacity: 0.08,
            }} />
          </motion.div>
        )
      })}
    </div>
  )
}

export default function LeaderboardPage() {
  const { user, isSignedIn } = useUser()
  const { data: profiles = [], isLoading, refetch } = useLeaderboard()
  const syncProfile = useSyncProfile()

  useEffect(() => {
    if (isSignedIn) {
      syncProfile.mutate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn])

  const myId = user?.id
  const myRank = profiles.findIndex((p) => p.user_id === myId) + 1
  const myProfile = profiles.find((p) => p.user_id === myId)
  const top3 = profiles.slice(0, 3)
  const rest = profiles.slice(3)

  return (
    <div className="space-y-8" style={{ paddingBottom: 48 }}>
      {/* Header */}
      <div className="lb-page-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-h1" style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 42, color: 'var(--ink)', lineHeight: 1, marginBottom: 4 }}>
            The <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>board</em>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Top learners ranked by points · words × 2 + streak × 15 + days × 25</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isSignedIn && myProfile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              border: '1.5px solid var(--ink)', borderRadius: 12, background: 'var(--lime)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <Trophy style={{ width: 14, height: 14 }} />
              <span style={{ fontWeight: 700, fontSize: 13 }}>Rank #{myRank}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{myProfile.points.toLocaleString()} pts</span>
            </div>
          )}
          <button
            onClick={() => { syncProfile.mutate(); refetch() }}
            disabled={syncProfile.isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
              border: '1.5px solid var(--ink)', borderRadius: 12, background: 'var(--paper-2)',
              boxShadow: 'var(--shadow-sm)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            <RefreshCw style={{ width: 13, height: 13, animation: syncProfile.isPending ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Guest banner */}
      {!isSignedIn && (
        <div style={{
          padding: '16px 20px', borderRadius: 12, background: 'rgba(255,217,61,0.12)',
          border: '1.5px solid rgba(255,217,61,0.4)', fontSize: 13, color: 'var(--ink-2)',
        }}>
          👋 <strong>Sign in</strong> to appear on the leaderboard and track your rank.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: 80, borderRadius: 12, background: 'var(--chip)', border: '1.5px solid var(--line-soft)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="card-editorial p-16 text-center">
          <p style={{ fontSize: 40, marginBottom: 12 }}>🏁</p>
          <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, color: 'var(--ink)', marginBottom: 4 }}>No one on the board yet</p>
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Be the first — start your learning streak today!</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 1 && <Podium top3={top3} myId={myId} />}

          {/* Ranked list (4th+) */}
          {rest.length > 0 && (
            <div className="space-y-2">
              <p className="caps" style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 12 }}>Full rankings</p>
              {rest.map((p, i) => (
                <LeaderRow key={p.user_id} profile={p} rank={i + 4} isMe={p.user_id === myId} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Badge showcase */}
      <div className="card-editorial p-5">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>🏅</span>
          <p style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 22, color: 'var(--ink)' }}>All badges</p>
        </div>
        <div className="badge-all-grid">
          {BADGES.map((b) => {
            const earned = myProfile?.badges?.includes(b.id) ?? false
            return (
              <div key={b.id} className={`badge-def${earned ? ' earned' : ' locked'}`}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{b.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{b.title}</div>
                  <div style={{ fontSize: 11, color: earned ? 'var(--ink-2)' : 'var(--ink-3)', marginTop: 2 }}>{b.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
