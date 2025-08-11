'use client'
import { useMemo } from 'react'
import type { Board } from './engine'
import { winner } from './engine'

export function TicTacToeBoard({
  board,
  canMove,
  onMove
}: {
  board: Board
  canMove: boolean
  onMove: (cell: number) => void
}) {
  const result = useMemo(() => winner(board), [board])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2 w-full max-w-sm mx-auto">
        {board.map((c, i) => (
          <button
            key={i}
            disabled={!canMove || c !== '.' || !!result}
            onClick={() => onMove(i)}
            className="touch-target aspect-square rounded-2xl border text-4xl font-bold
                       flex items-center justify-center disabled:opacity-50"
          >
            {c !== '.' ? c : ''}
          </button>
        ))}
      </div>
      <div className="text-center text-lg">
        {result ? (result === 'draw' ? 'Draw!' : `${result} wins!`) : (canMove ? 'Your turn' : 'Opponent’s turn')}
      </div>
    </div>
  )
}
