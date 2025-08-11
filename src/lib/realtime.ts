import { supabase } from './supabase'

export type GameEvent =
  | { type: 'join'; userId: string | undefined }
  // tic tac toe events
  | { type: 'move'; cell: number; symbol: 'X' | 'O' }
  | {
      type: 'state'
      snapshot: string
      currentTurn: 'X' | 'O'
      winner?: 'X' | 'O' | 'draw'
    }
  // chess events
  | { type: 'move'; from: string; to: string; promotion?: string }
  | {
      type: 'state'
      snapshot: string
      currentTurn: 'w' | 'b'
      winner?: 'w' | 'b' | 'draw'
    }

export const joinRoom = async (roomId: string, onEvent: (e: GameEvent)=>void) => {
  const client = supabase()
  const channel = client.channel(`game:${roomId}`, { config: { broadcast: { ack: true }}})

  channel.on('broadcast', { event: 'game' }, (payload) => {
    onEvent(payload.payload as GameEvent)
  })

  await channel.subscribe()

  const { data } = await client.auth.getUser()
  channel.send({ type: 'broadcast', event: 'game', payload: { type: 'join', userId: data.user?.id } as GameEvent })

  const send = (e: GameEvent) => channel.send({ type: 'broadcast', event: 'game', payload: e })
  const leave = () => client.removeChannel(channel)

  return { send, leave }
}
