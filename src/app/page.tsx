'use client'
import Link from 'next/link'
import { games } from '@/games'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  useEffect(() => { supabase().auth.getUser().then(({ data }) => setUser(data.user)) }, [])

  return (
    <div className="container py-6 flex flex-col gap-4">
      {!user && (
        <Link href="/login" className="underline">Log in to play</Link>
      )}
      <h2 className="text-lg font-semibold">Choose a game</h2>
      <div className="grid grid-cols-1 gap-3">
        {games.map(g => (
          <div key={g.slug} className="rounded-2xl border p-4 flex items-center justify-between">
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
                  const { data, error } = await client.from('matches')
                    .insert({ game_slug: g.slug, created_by: profile.user!.id, player_x: profile.user!.id })
                    .select('id').single()
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
    </div>
  )
}
