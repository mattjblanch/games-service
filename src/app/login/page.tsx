'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="container py-8 flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Log in</h2>
      {sent ? (
        <p>Check your email for the magic link.</p>
      ) : (
        <>
          <input
            className="border rounded-xl p-3"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
          <button
            className="px-4 py-2 rounded-xl border"
            onClick={async () => {
              setError(null)
              const { error } = await supabase().auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
              if (error) setError(error.message)
              else setSent(true)
            }}
          >
            Send magic link
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </>
      )}
    </div>
  )
}
