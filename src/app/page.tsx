'use client'
import Link from 'next/link'
import { games, gameBySlug } from '@/games'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [rooms, setRooms] = useState<any[]>([])

  useEffect(() => {
    supabase().auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  useEffect(() => {
    const client = supabase()
    client
      .from('matches')
      .select('*')
      .neq('status', 'finished')
      .then(({ data }) => setRooms(data || []))
  }, [])

  useEffect(() => {
    const client = supabase()
    const channel = client
      .channel('public:matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload) => {
        setRooms((prev) => {
          if (payload.eventType === 'INSERT') {
            const inserted: any = (payload as any).new
            if (inserted.status === 'finished') return prev
            return [...prev, inserted]
          }
          if (payload.eventType === 'UPDATE') {
            const updated: any = (payload as any).new
            if (updated.status === 'finished') {
              return prev.filter((r) => r.id !== updated.id)
            }
            return prev.map((r) => (r.id === updated.id ? updated : r))
          }
          if (payload.eventType === 'DELETE') {
            const removed: any = (payload as any).old
            return prev.filter((r) => r.id !== removed.id)
          }
          return prev
        })
      })
      .subscribe()
    return () => {
      void client.removeChannel(channel)
    }
  }, [])

  return (
    <div className="container py-6 flex flex-col gap-4">
      {!user && (
        <Link href="/login" className="underline">
          Log in to play
        </Link>
      )}

      <h2 className="text-lg font-semibold">Choose a game</h2>
      <div className="grid grid-cols-1 gap-3">
        {games.map((g) => (
          <div
            key={g.slug}
            className="rounded-2xl border p-4 flex items-center justify-between"
          >
            <div>
              <div className="font-medium">{g.name}</div>
              <div className="text-sm opacity-70">{g.slug}</div>
            </div>
            {user ? (
              <button
                className="px-4 py-2 rounded-xl border"
                onClick={async () => {
                  const client = supabase()
                  const { data: profile } = await client.auth.getUser()
                  const { data, error } = await client
                    .from('matches')
                    .insert({
                      game_slug: g.slug,
                      created_by: profile.user!.id,
                      player_x: profile.user!.id,
                    })
                    .select('id')
                    .single()
                  if (!error && data) {
                    window.location.href = `/play/${g.slug}/${data.id}`
                  }
                }}
              >
                Create match
              </button>
            ) : (
              <span className="text-sm opacity-70">Login required</span>
            )}
          </div>
        ))}
      </div>

      {rooms.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mt-4">Running rooms</h2>
          <div className="grid grid-cols-1 gap-3">
            {rooms.map((r) => {
              const g = gameBySlug(r.game_slug)
              const isParticipant =
                user && (r.player_x === user.id || r.player_o === user.id)
              const isJoinable =
                user && r.status === 'waiting' && !isParticipant
              const isCreator = user && r.created_by === user.id
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">
                      {g?.name ?? r.game_slug}
                    </div>
                    <div className="text-sm opacity-70">
                      {r.status === 'waiting'
                        ? 'Waiting for opponent'
                        : 'In progress'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user ? (
                      isParticipant || isJoinable ? (
                        <button
                          className="px-4 py-2 rounded-xl border"
                          onClick={() => {
                            window.location.href = `/play/${r.game_slug}/${r.id}`
                          }}
                        >
                          {isParticipant ? 'Re-enter' : 'Join room'}
                        </button>
                      ) : (
                        <span className="text-sm opacity-70">Full</span>
                      )
                    ) : (
                      <span className="text-sm opacity-70">Login required</span>
                    )}
                    {isCreator && (
                      <button
                        className="px-2 py-1 rounded-xl border text-sm"
                        aria-label="Delete room"
                        onClick={async () => {
                          const ok = confirm('Delete this room?')
                          if (!ok) return
                          const client = supabase()
                          // attempt to remove room; if deletion fails, mark finished
                          const { error } = await client
                            .from('matches')
                            .delete()
                            .eq('id', r.id)
                          if (error) {
                            await client
                              .from('matches')
                              .update({ status: 'finished' })
                              .eq('id', r.id)
                          }
                          setRooms((prev) => prev.filter((room) => room.id !== r.id))
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
