'use client'
import { useEffect, useRef, useState } from 'react'
import { joinRoom, type GameEvent } from '@/lib/realtime'
import { fromSnapshot, toSnapshot, emptyBoard, applyMove, winner, nextTurn, type Board } from '@/games/tictactoe/engine'
import { TicTacToeBoard } from '@/games/tictactoe/ui'
import { supabase } from '@/lib/supabase'

export default function RoomShell({ roomId, role }: { roomId: string; role: 'X'|'O' }) {
  const [board, setBoard] = useState<Board>(emptyBoard())
  const [turn, setTurn] = useState<'X'|'O'>('X')
  const [result, setResult] = useState<'X'|'O'|'draw'|null>(null)
  const sendRef = useRef<null | ((e: GameEvent) => Promise<unknown>)>(null)
  const leaveRef = useRef<null | (() => Promise<unknown>)>(null)
  const [players, setPlayers] = useState<{ x: string | null; o: string | null }>({ x: null, o: null })

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
        if (e.type === 'state') {
          setBoard(fromSnapshot(e.snapshot))
          setTurn(e.currentTurn)
          setResult(e.winner ?? null)
        }
        if (e.type === 'move') {
          setBoard((b) => {
            const nb = applyMove(b, { cell: e.cell, symbol: e.symbol })
            const w = winner(nb)
            if (w) setResult(w)
            else setTurn((t) => nextTurn(t))
            return nb
          })
        }
      })
      sendRef.current = send
      leaveRef.current = leave
    })()
    return () => { if (leaveRef.current) void leaveRef.current() }
  }, [roomId])

  useEffect(() => {
    const client = supabase()
    client
      .from('matches')
      .select('player_x, player_o')
      .eq('id', roomId)
      .single()
      .then(({ data }) => setPlayers({ x: data?.player_x ?? null, o: data?.player_o ?? null }))
  }, [roomId])

  const canMove = result == null && turn === role

  const makeMove = async (cell: number) => {
    if (!canMove || board[cell] !== '.') return
    const nb = applyMove(board, { cell, symbol: role })
    const w = winner(nb)

    // broadcast to peers
    if (sendRef.current) void sendRef.current({ type: 'move', cell, symbol: role })

    // optimistic update
    setBoard(nb)
    setResult(w)
    setTurn(nextTurn(turn))

    // persist snapshot
    const client = supabase()
    await client.from('matches').update({
      snapshot: toSnapshot(nb),
      current_turn: nextTurn(turn),
      winner: w ?? null
    }).eq('id', roomId)
    await client.from('moves').insert({ match_id: roomId, cell, symbol: role })

    if (w) {
      if (players.x && players.o && w !== 'draw') {
        const winnerId = w === 'X' ? players.x : players.o
        const loserId = w === 'X' ? players.o : players.x
        const { data: winP } = await client.from('profiles').select('wins').eq('id', winnerId).single()
        await client.from('profiles').update({ wins: (winP?.wins ?? 0) + 1 }).eq('id', winnerId)
        const { data: loseP } = await client.from('profiles').select('losses').eq('id', loserId).single()
        await client.from('profiles').update({ losses: (loseP?.losses ?? 0) + 1 }).eq('id', loserId)
      }
      await client.from('matches').delete().eq('id', roomId)
    }
  }

  return (
    <div className="container py-4">
      <div className="mb-4 flex items-center justify-between text-sm opacity-70">
        <div>Room: {roomId} · You are {role}</div>
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
      <TicTacToeBoard board={board} canMove={canMove} onMove={makeMove} />
      {result && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl bg-white p-6 text-xl text-center">
            {result === 'draw' ? 'Draw!' : `${result} wins!`}
          </div>
        </div>
      )}
    </div>
  )
}
