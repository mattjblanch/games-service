'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function OnlineUsers() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const client = supabase()
    let channel: any
    ;(async () => {
      const { data } = await client.auth.getUser()
      channel = client.channel('online-users', {
        config: { presence: { key: data.user?.id || Math.random().toString() } }
      })
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setCount(Object.keys(state).length)
      })
      await channel.subscribe()
      channel.track({})
    })()
    return () => { if (channel) client.removeChannel(channel) }
  }, [])
  return <span className="text-sm opacity-70">Online: {count}</span>
}
