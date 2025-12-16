'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AuthModal from '@/components/AuthModal'
import { User } from '@supabase/supabase-js'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'soulmate-chat-messages'
const STORAGE_STARTED = 'soulmate-chat-started'

export default function SoulmateFinder() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const supabase = createClient()

  // Check auth state and load data on mount
  useEffect(() => {
    const init = async () => {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Logged in - load from Supabase
        await loadSupabaseSession(user.id)
      } else {
        // Not logged in - load from localStorage
        loadLocalStorage()
      }

      setAuthLoading(false)
      setHydrated(true)
    }

    init()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser && event === 'SIGNED_IN') {
        setShowSaveModal(false)
        // Migrate localStorage messages to Supabase
        await migrateToSupabase(currentUser.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load from localStorage (for anonymous users)
  const loadLocalStorage = () => {
    const savedMessages = localStorage.getItem(STORAGE_KEY)
    const savedStarted = localStorage.getItem(STORAGE_STARTED)

    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages))
      } catch (e) {
        console.error('Failed to parse saved messages:', e)
      }
    }
    if (savedStarted === 'true') {
      setStarted(true)
    }
  }

  // Save to localStorage (for anonymous users)
  useEffect(() => {
    if (hydrated && !user && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    }
  }, [messages, hydrated, user])

  useEffect(() => {
    if (hydrated && !user) {
      localStorage.setItem(STORAGE_STARTED, String(started))
    }
  }, [started, hydrated, user])

  // Load session from Supabase (for logged-in users)
  const loadSupabaseSession = async (userId: string) => {
    try {
      const { data: existingSession } = await supabase
        .from('soulmate_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingSession) {
        setSessionId(existingSession.id)

        const { data: existingMessages } = await supabase
          .from('soulmate_messages')
          .select('*')
          .eq('session_id', existingSession.id)
          .order('message_index', { ascending: true })

        if (existingMessages && existingMessages.length > 0) {
          setMessages(existingMessages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          })))
          setStarted(true)
          // Clear localStorage since we have Supabase data
          localStorage.removeItem(STORAGE_KEY)
          localStorage.removeItem(STORAGE_STARTED)
        }
      } else {
        // No Supabase session - check localStorage for data to migrate
        const savedMessages = localStorage.getItem(STORAGE_KEY)
        if (savedMessages) {
          // Will be migrated when they interact
          loadLocalStorage()
        }
      }
    } catch (error) {
      console.error('Error loading Supabase session:', error)
      // Fall back to localStorage
      loadLocalStorage()
    }
  }

  // Migrate localStorage data to Supabase when user logs in
  const migrateToSupabase = async (userId: string) => {
    const savedMessages = localStorage.getItem(STORAGE_KEY)
    if (!savedMessages) {
      // No local data to migrate, just create a session
      await createSupabaseSession(userId)
      return
    }

    try {
      const localMessages: Message[] = JSON.parse(savedMessages)
      if (localMessages.length === 0) {
        await createSupabaseSession(userId)
        return
      }

      // Create new session
      const { data: newSession } = await supabase
        .from('soulmate_sessions')
        .insert({
          user_id: userId,
          status: 'in_progress',
          message_count: localMessages.length,
        })
        .select()
        .single()

      if (newSession) {
        setSessionId(newSession.id)

        // Save all messages to Supabase
        const messagesToInsert = localMessages.map((m, i) => ({
          session_id: newSession.id,
          role: m.role,
          content: m.content,
          message_index: i,
        }))

        await supabase.from('soulmate_messages').insert(messagesToInsert)

        // Clear localStorage
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(STORAGE_STARTED)
      }
    } catch (error) {
      console.error('Error migrating to Supabase:', error)
    }
  }

  const createSupabaseSession = async (userId: string) => {
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
      setSessionId(newSession.id)
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
  }

  const clearConversation = () => {
    if (confirm('Start a new conversation? This will clear your current chat.')) {
      setMessages([])
      setStarted(false)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_STARTED)

      if (user && sessionId) {
        // Mark old session as abandoned, create new one
        supabase
          .from('soulmate_sessions')
          .update({ status: 'abandoned' })
          .eq('id', sessionId)
          .then(() => createSupabaseSession(user.id))
      }
    }
  }

  const startInterview = async () => {
    setStarted(true)
    setLoading(true)

    // If user is logged in but has no session, create one
    if (user && !sessionId) {
      await createSupabaseSession(user.id)
    }

    try {
      // For anonymous users, use the old API format
      // For logged-in users with sessionId, use the new format
      const body = sessionId
        ? { sessionId }
        : { messages: [] }

      const res = await fetch('/api/soulmate/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
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
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      // For anonymous users, send all messages
      // For logged-in users with sessionId, just send the new message
      const body = sessionId
        ? { sessionId, userMessage }
        : { messages: newMessages }

      const res = await fetch('/api/soulmate/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
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

  // Welcome screen (not started yet)
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        {/* Small status in top right */}
        <div className="absolute top-4 right-4">
          {user ? (
            <div className="flex items-center gap-2 text-sm text-purple-300">
              <span className="text-green-400">Saved</span>
              <span>{user.email}</span>
              <button
                onClick={handleSignOut}
                className="text-purple-400 hover:text-white underline"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>

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
            Takes about 10-15 minutes • Your answers are private
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
          <div className="flex items-center gap-3">
            <span className="text-purple-300 text-sm">
              {messages.filter(m => m.role === 'user').length} responses
            </span>

            {/* Save progress button - only show if not logged in */}
            {!user && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
              >
                <span>💾</span> Save Progress
              </button>
            )}

            {user && (
              <span className="text-green-400 text-sm flex items-center gap-1">
                ✓ Saved
              </span>
            )}

            <button
              onClick={clearConversation}
              className="text-purple-300 hover:text-white text-sm px-3 py-1 rounded border border-purple-500/30 hover:border-purple-400 transition-colors"
            >
              New Chat
            </button>
          </div>
        </div>
      </div>

      {/* Save progress modal */}
      {showSaveModal && !user && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-purple-900/90 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowSaveModal(false)}
              className="absolute top-4 right-4 text-purple-300 hover:text-white text-xl"
            >
              ×
            </button>
            <h2 className="text-2xl font-semibold text-white mb-4">Save your progress</h2>
            <p className="text-purple-200 text-sm mb-6">
              Enter your email and we'll send you a magic link. You can continue this interview from any device.
            </p>
            <AuthModal onSuccess={() => setShowSaveModal(false)} />
          </div>
        </div>
      )}

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
