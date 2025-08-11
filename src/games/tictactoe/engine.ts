export type Cell = 'X' | 'O' | '.'
export type Board = Cell[] // length 9
export type Move = { cell: number; symbol: 'X' | 'O' }

export const emptyBoard = (): Board => Array.from({ length: 9 }, () => '.')

export const fromSnapshot = (s: string): Board =>
  s.split('').map((c) => (c === 'X' || c === 'O' ? c : '.')) as Board

export const toSnapshot = (b: Board) => b.join('')

export const validMove = (b: Board, m: Move) =>
  m.cell >= 0 && m.cell < 9 && b[m.cell] === '.'

const wins = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
]

export const applyMove = (b: Board, m: Move): Board => {
  const nb = [...b]
  if (!validMove(b, m)) return nb
  nb[m.cell] = m.symbol
  return nb
}

export const winner = (b: Board): 'X'|'O'|'draw'|null => {
  for (const [a, c, d] of wins) {
    if (b[a] !== '.' && b[a] === b[c] && b[a] === b[d]) return b[a] as 'X'|'O'
  }
  if (b.every((c) => c !== '.')) return 'draw'
  return null
}

export const nextTurn = (t: 'X'|'O') => (t === 'X' ? 'O' : 'X')
