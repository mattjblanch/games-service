'use client'

import { useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import type { Move, Snapshot } from './engine'

const symbols: Record<string, string> = {
  wp: '♙', wn: '♘', wb: '♗', wr: '♖', wq: '♕', wk: '♔',
  bp: '♟', bn: '♞', bb: '♝', br: '♜', bq: '♛', bk: '♚',
}

export function ChessBoard({
  snapshot,
  canMove,
  onMove,
}: {
  snapshot: Snapshot
  canMove: boolean
  onMove: (move: Move) => void
}) {
  const [from, setFrom] = useState<string | null>(null)
  const game = useMemo(() => new Chess(snapshot), [snapshot])
  const board = game.board()

  const handleClick = (square: string) => {
    if (!canMove) return
    if (from) {
      onMove({ from, to: square })
      setFrom(null)
    } else {
      setFrom(square)
    }
  }

  return (
    <div className="inline-block">
      <div className="grid grid-cols-8 border">
        {board.map((row, r) =>
          row.map((piece, c) => {
            const file = String.fromCharCode(97 + c)
            const rank = 8 - r
            const square = `${file}${rank}`
            const isDark = (r + c) % 2 === 1
            return (
              <button
                key={square}
                disabled={!canMove}
                onClick={() => handleClick(square)}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center ${
                  isDark ? 'bg-green-700' : 'bg-green-200'
                } ${from === square ? 'ring-2 ring-yellow-400' : ''}`}
              >
                {piece ? symbols[piece.color + piece.type] : ''}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
