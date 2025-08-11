import { tttMeta } from './tictactoe/meta'
import { chessMeta } from './chess/meta'
export const games = [tttMeta, chessMeta]
export const gameBySlug = (slug: string) => games.find(g => g.slug === slug)
