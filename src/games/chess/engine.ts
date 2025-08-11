import { Chess } from 'chess.js'

export type Snapshot = string // FEN string
export type Move = { from: string; to: string; promotion?: string }

export const initialSnapshot = (): Snapshot => new Chess().fen()

export const fromSnapshot = (s: Snapshot) => new Chess(s)

export const toSnapshot = (g: Chess): Snapshot => g.fen()

export const validMove = (s: Snapshot, m: Move): boolean => {
  const g = new Chess(s)
  const res = g.move(m, { sloppy: true })
  return res != null
}

export const applyMove = (s: Snapshot, m: Move): Snapshot => {
  const g = new Chess(s)
  const res = g.move(m, { sloppy: true })
  return res ? g.fen() : s
}

export const winner = (s: Snapshot): 'w'|'b'|'draw'|null => {
  const g = new Chess(s)
  if (!g.game_over()) return null
  if (g.in_draw() || g.in_stalemate() || g.insufficient_material() || g.in_threefold_repetition()) return 'draw'
  return g.turn() === 'w' ? 'b' : 'w'
}

export const nextTurn = (s: Snapshot): 'w'|'b' => {
  const g = new Chess(s)
  return g.turn()
}
