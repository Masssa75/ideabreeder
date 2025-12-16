'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuthModalProps {
  onSuccess?: () => void
}

export default function AuthModal({ onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/soulmate`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="text-6xl mb-4">✉️</div>
        <h2 className="text-2xl font-semibold text-white mb-2">Check your email</h2>
        <p className="text-purple-200 mb-4">
          We sent a magic link to <strong>{email}</strong>
        </p>
        <p className="text-purple-300 text-sm">
          Click the link in the email to start your journey.
        </p>
        <button
          onClick={() => {
            setSent(false)
            setEmail('')
          }}
          className="mt-6 text-purple-400 hover:text-white text-sm"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleLogin} className="w-full max-w-sm">
      <div className="mb-4">
        <label htmlFor="email" className="block text-purple-200 text-sm mb-2">
          Enter your email to start or continue
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !email}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition-all"
      >
        {loading ? 'Sending...' : 'Send Magic Link'}
      </button>

      <p className="text-purple-300/60 text-xs text-center mt-4">
        No password needed. We'll email you a link to sign in.
      </p>
    </form>
  )
}
