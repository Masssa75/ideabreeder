'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'soulmate-chat-messages'
const STARTED_KEY = 'soulmate-chat-started'

export default function SoulmateFinder() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY)
    const savedStarted = localStorage.getItem(STARTED_KEY)

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
    setHydrated(true)
  }, [])

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (hydrated && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    }
  }, [messages, hydrated])

  // Save started state
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STARTED_KEY, String(started))
    }
  }, [started, hydrated])

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

  const clearConversation = () => {
    if (confirm('Start a new conversation? This will clear your current chat.')) {
      setMessages([])
      setStarted(false)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STARTED_KEY)
    }
  }

  const startInterview = async () => {
    setStarted(true)
    setLoading(true)

    try {
      const res = await fetch('/api/soulmate/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] })
      })

      const data = await res.json()
      if (data.reply) {
        setMessages([{ role: 'assistant', content: data.reply }])
      }
    } catch (error) {
      console.error('Failed to start interview:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/soulmate/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
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

  if (!started) {
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
          <button
            onClick={startInterview}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xl font-semibold px-8 py-4 rounded-full transition-all transform hover:scale-105 shadow-lg"
          >
            Begin Your Journey ✨
          </button>
          <p className="text-purple-300 text-sm mt-6">
            Takes about 10-15 minutes • Your answers are private
          </p>
        </div>
      </div>
    )
  }

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
              onClick={clearConversation}
              className="text-purple-300 hover:text-white text-sm px-3 py-1 rounded border border-purple-500/30 hover:border-purple-400 transition-colors"
            >
              New Chat
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
