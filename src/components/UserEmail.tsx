'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function UserEmail() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const client = supabase()
    client.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  if (!email) return null
  return <span className="text-sm opacity-70">{email}</span>
}
