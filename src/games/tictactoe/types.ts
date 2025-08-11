export type Cell = 'X' | 'O' | '.'
export type Board = Cell[] // length 9
export type Move = { cell: number; symbol: 'X' | 'O' }
