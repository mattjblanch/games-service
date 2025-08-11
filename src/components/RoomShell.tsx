'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { joinRoom, type GameEvent } from '@/lib/realtime'
import { fromSnapshot, toSnapshot, emptyBoard, applyMove, winner, nextTurn, type Board } from '@/games/tictactoe/engine'
import { TicTacToeBoard } from '@/games/tictactoe/ui'
import { supabase } from '@/lib/supabase'

export default function RoomShell({ roomId, role }: { roomId: string; role: 'X'|'O' }) {
  const [board, setBoard] = useState<Board>(emptyBoard())
  const [turn, setTurn] = useState<'X'|'O'>('X')
  const [result, setResult] = useState<'X'|'O'|'draw'|null>(null)
  const sendRef = useRef<null | ((e: GameEvent) => boolean)>(null)
  const leaveRef = useRef<null | (() => boolean)>(null)

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
      sendRef.current = (ev) => send(ev)
      leaveRef.current = () => leave()
    })()
    return () => { if (leaveRef.current) leaveRef.current() }
  }, [roomId])

  const canMove = result == null && turn === role

  const makeMove = async (cell: number) => {
    if (!canMove || board[cell] !== '.') return
    const nb = applyMove(board, { cell, symbol: role })
    const w = winner(nb)

    // broadcast to peers
    if (sendRef.current) sendRef.current({ type: 'move', cell, symbol: role })

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
  }

  return (
    <div className="container py-4">
      <div className="mb-4 text-sm opacity-70">Room: {roomId} · You are {role}</div>
      <TicTacToeBoard board={board} canMove={canMove} onMove={makeMove} />
    </div>
  )
}
