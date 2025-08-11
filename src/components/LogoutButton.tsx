'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LogoutButton() {
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    supabase()
      .auth.getUser()
      .then(({ data }) => setSignedIn(!!data.user))
  }, [])

  if (!signedIn) return null

  return (
    <button
      className="px-2 py-1 rounded-xl border text-sm"
      onClick={async () => {
        await supabase().auth.signOut()
        window.location.href = '/'
      }}
    >
      Logout
    </button>
  )
}
