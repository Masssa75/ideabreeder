'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AuthModal from '@/components/AuthModal'
import { User } from '@supabase/supabase-js'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function SoulmateFinder() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const supabase = createClient()

  // Check auth state on mount
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setAuthLoading(false)

      if (user) {
        // Load or create session
        await loadSession(user.id)
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser && event === 'SIGNED_IN') {
        await loadSession(currentUser.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load or create session from Supabase
  const loadSession = async (userId: string) => {
    try {
      // Get or create session
      const { data: existingSession } = await supabase
        .from('soulmate_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      let currentSessionId: string

      if (existingSession) {
        currentSessionId = existingSession.id
        setSessionId(currentSessionId)

        // Load existing messages
        const { data: existingMessages } = await supabase
          .from('soulmate_messages')
          .select('*')
          .eq('session_id', currentSessionId)
          .order('message_index', { ascending: true })

        if (existingMessages && existingMessages.length > 0) {
          setMessages(existingMessages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          })))
          setStarted(true)
        }
      } else {
        // Create new session
        const { data: newSession } = await supabase
          .from('soulmate_sessions')
          .insert({
            user_id: userId,
            status: 'in_progress',
            message_count: 0,
          })
          .select()
          .single()

        if (newSession) {
          currentSessionId = newSession.id
          setSessionId(currentSessionId)
        }
      }
    } catch (error) {
      console.error('Error loading session:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (started && inputRef.current) {
      inputRef.current.focus()
    }
  }, [started, loading])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSessionId(null)
    setMessages([])
    setStarted(false)
  }

  const startNewChat = async () => {
    if (!user) return

    if (messages.length > 0 && !confirm('Start a new conversation? This will begin a fresh interview.')) {
      return
    }

    // Mark current session as abandoned if it exists
    if (sessionId) {
      await supabase
        .from('soulmate_sessions')
        .update({ status: 'abandoned' })
        .eq('id', sessionId)
    }

    // Create new session
    const { data: newSession } = await supabase
      .from('soulmate_sessions')
      .insert({
        user_id: user.id,
        status: 'in_progress',
        message_count: 0,
      })
      .select()
      .single()

    if (newSession) {
      setSessionId(newSession.id)
      setMessages([])
      setStarted(false)
    }
  }

  const startInterview = async () => {
    if (!sessionId) return

    setStarted(true)
    setLoading(true)

    try {
      const res = await fetch('/api/soulmate/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      const data = await res.json()
      if (data.reply) {
        setMessages([{ role: 'assistant', content: data.reply }])
      } else if (data.error) {
        console.error('Start error:', data.error)
        setStarted(false)
      }
    } catch (error) {
      console.error('Failed to start interview:', error)
      setStarted(false)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading || !sessionId) return

    const userMessage = input.trim()
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/soulmate/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userMessage })
      })

      const data = await res.json()
      if (data.reply) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }])
      } else if (data.error) {
        setMessages([...newMessages, { role: 'assistant', content: `Oops! ${data.error}` }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, something went wrong. Try again?' }])
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Not authenticated - show login
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-lg text-center">
          <div className="text-8xl mb-6">💜</div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Find Your Soulmate
          </h1>
          <p className="text-xl text-purple-200 mb-8">
            An AI will interview you to understand who you truly are — your values, dreams, quirks, and what makes your heart sing. Then we'll find someone perfect for you.
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <p className="text-purple-200 text-sm mb-4">Sign in to start or continue your interview</p>
            <AuthModal />
          </div>

          <p className="text-purple-300 text-sm">
            Takes about 10-15 minutes • Your answers are saved securely
          </p>
        </div>
      </div>
    )
  }

  // Authenticated but not started
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-lg text-center">
          <div className="text-8xl mb-6">💜</div>
          <h1 className="text-5xl font-bold text-white mb-4">
            {messages.length > 0 ? 'Welcome Back!' : 'Find Your Soulmate'}
          </h1>
          <p className="text-xl text-purple-200 mb-8">
            {messages.length > 0
              ? 'Ready to continue your interview? Your progress has been saved.'
              : 'An AI will interview you to understand who you truly are — your values, dreams, quirks, and what makes your heart sing. Then we\'ll find someone perfect for you.'
            }
          </p>
          <button
            onClick={startInterview}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xl font-semibold px-8 py-4 rounded-full transition-all transform hover:scale-105 shadow-lg"
          >
            {messages.length > 0 ? 'Continue Interview' : 'Begin Your Journey'} ✨
          </button>
          <p className="text-purple-300 text-sm mt-6">
            Signed in as {user.email}
            <button
              onClick={handleSignOut}
              className="ml-2 text-purple-400 hover:text-white underline"
            >
              Sign out
            </button>
          </p>
        </div>
      </div>
    )
  }

  // Chat interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💜</span>
            <div>
              <h1 className="text-xl font-semibold text-white">Soulmate Finder</h1>
              <p className="text-sm text-purple-300">Getting to know you...</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-purple-300 text-sm">
              {messages.filter(m => m.role === 'user').length} responses
            </span>
            <button
              onClick={startNewChat}
              className="text-purple-300 hover:text-white text-sm px-3 py-1 rounded border border-purple-500/30 hover:border-purple-400 transition-colors"
            >
              New Chat
            </button>
            <button
              onClick={handleSignOut}
              className="text-purple-300 hover:text-white text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-md'
                    : 'bg-white/10 text-white rounded-bl-md backdrop-blur-sm'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="text-purple-300 text-xs mb-1">AI Interviewer</div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3 backdrop-blur-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-black/20 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="max-w-2xl mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              // Auto-resize
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Share your thoughts..."
            disabled={loading}
            rows={1}
            className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 resize-none overflow-hidden min-h-[48px] max-h-[150px]"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white px-6 py-3 rounded-full transition-colors shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
