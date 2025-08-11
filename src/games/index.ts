import { tttMeta } from './tictactoe/meta'
export const games = [tttMeta]
export const gameBySlug = (slug: string) => games.find(g => g.slug === slug)
