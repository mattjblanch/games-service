'use client'
import { useEffect, useRef, useState } from 'react'
import RoomShell from '@/components/RoomShell'
import ChessRoom from '@/components/ChessRoom'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

export default function RoomPage() {
  const params = useParams<{ game: string; roomId: string }>()
  const [role, setRole] = useState<'X'|'O'|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const client = supabase()
      const { data: user } = await client.auth.getUser()
      if (!user.user) { window.location.href = '/login'; return }

      const { data: match, error } = await client.from('matches').select('*').eq('id', params.roomId).single()
      if (error) { window.location.href = '/'; return }
      if (match && !match.player_o && match.player_x !== user.user.id) {
        await client.from('matches').update({ player_o: user.user.id, status: 'active' }).eq('id', params.roomId)
        setRole('O')
      } else if (match && match.player_x === user.user.id) {
        setRole('X')
      } else if (match && match.player_o === user.user.id) {
        setRole('O')
      } else {
        window.location.href = '/'
        return
      }
      setLoading(false)
    })()
  }, [params.roomId])

  if (loading || !role) return <div className="container py-6">Joining room…</div>
  return params.game === 'chess' ? (
    <ChessRoom roomId={params.roomId} role={role === 'X' ? 'w' : 'b'} />
  ) : (
    <RoomShell roomId={params.roomId} role={role} />
  )
}
