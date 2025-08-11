'use client'

import { useEffect, useRef, useState } from 'react'
import { joinRoom, type GameEvent } from '@/lib/realtime'
import {
  initialSnapshot,
  applyMove,
  winner,
  nextTurn,
  type Snapshot,
  type Move,
} from '@/games/chess/engine'
import { ChessBoard } from '@/games/chess/ui'
import { supabase } from '@/lib/supabase'

export default function ChessRoom({ roomId, role }: { roomId: string; role: 'w' | 'b' }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(initialSnapshot())
  const [turn, setTurn] = useState<'w' | 'b'>('w')
  const [result, setResult] = useState<'w' | 'b' | 'draw' | null>(null)
  const sendRef = useRef<null | ((e: GameEvent) => Promise<unknown>)>(null)
  const leaveRef = useRef<null | (() => Promise<unknown>)>(null)
  const [players, setPlayers] = useState<{ w: string | null; b: string | null }>({
    w: null,
    b: null,
  })

  useEffect(() => {
    if (!result) return
    const t = setTimeout(() => {
      if (leaveRef.current) {
        void leaveRef.current()
        leaveRef.current = null
      }
      window.location.href = '/'
    }, 5000)
    return () => clearTimeout(t)
  }, [result])

  useEffect(() => {
    ;(async () => {
      const { send, leave } = await joinRoom(roomId, (e: GameEvent) => {
        if (e.type === 'state' && 'currentTurn' in e && (e.currentTurn === 'w' || e.currentTurn === 'b')) {
          setSnapshot(e.snapshot)
          setTurn(e.currentTurn)
          setResult(e.winner ?? null)
        }
        if (e.type === 'move' && 'from' in e && 'to' in e) {
          setSnapshot((s) => {
            const ns = applyMove(s, { from: e.from, to: e.to, promotion: (e as any).promotion })
            const w = winner(ns)
            if (w) setResult(w)
            else setTurn(nextTurn(ns))
            return ns
          })
        }
      })
      sendRef.current = send
      leaveRef.current = leave
    })()
    return () => {
      if (leaveRef.current) void leaveRef.current()
    }
  }, [roomId])

  useEffect(() => {
    const client = supabase()
    client
      .from('matches')
      .select('player_x, player_o')
      .eq('id', roomId)
      .single()
      .then(({ data }) => setPlayers({ w: data?.player_x ?? null, b: data?.player_o ?? null }))
  }, [roomId])

  const canMove = result == null && turn === role

  const makeMove = async (move: Move) => {
    if (!canMove) return
    const ns = applyMove(snapshot, move)
    if (ns === snapshot) return
    const w = winner(ns)

    if (sendRef.current)
      void sendRef.current({ type: 'move', from: move.from, to: move.to, promotion: move.promotion })

    setSnapshot(ns)
    setResult(w)
    setTurn(nextTurn(ns))

    const client = supabase()
    await client
      .from('matches')
      .update({ snapshot: ns, current_turn: nextTurn(ns), winner: w ?? null })
      .eq('id', roomId)

    if (w && players.w && players.b && w !== 'draw') {
      const winnerId = w === 'w' ? players.w : players.b
      const loserId = w === 'w' ? players.b : players.w
      const { data: winP } = await client.from('profiles').select('wins').eq('id', winnerId).single()
      await client
        .from('profiles')
        .update({ wins: (winP?.wins ?? 0) + 1 })
        .eq('id', winnerId)
      const { data: loseP } = await client.from('profiles').select('losses').eq('id', loserId).single()
      await client
        .from('profiles')
        .update({ losses: (loseP?.losses ?? 0) + 1 })
        .eq('id', loserId)
      await client.from('matches').delete().eq('id', roomId)
    }
  }

  return (
    <div className="container py-4">
      <div className="mb-4 flex items-center justify-between text-sm opacity-70">
        <div>
          Room: {roomId} · You are {role === 'w' ? 'White' : 'Black'}
        </div>
        <div className="flex gap-4">
          <button
            className="underline"
            onClick={() => {
              if (leaveRef.current) {
                void leaveRef.current()
                leaveRef.current = null
              }
              window.location.href = '/'
            }}
          >
            Leave match
          </button>
          <button
            className="underline"
            onClick={async () => {
              if (!confirm('Delete this room?')) return
              const client = supabase()
              await client.from('matches').delete().eq('id', roomId)
              if (leaveRef.current) {
                await leaveRef.current()
                leaveRef.current = null
              }
              window.location.href = '/'
            }}
          >
            Delete room
          </button>
        </div>
      </div>
      <ChessBoard snapshot={snapshot} canMove={canMove} onMove={makeMove} />
      {result && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl bg-white p-6 text-xl text-center">
            {result === 'draw' ? 'Draw!' : `${result === 'w' ? 'White' : 'Black'} wins!`}
          </div>
        </div>
      )}
    </div>
  )
}

