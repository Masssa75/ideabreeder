'use client'

/**
 * V2: DARK ROMANTIC
 * Deep purple/black background with vibrant gradients
 * Premium, intimate, nighttime feel
 */

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'soulmate-chat-v2'

export default function SoulmateV2() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      setMessages(data.messages || [])
      setStarted(data.started || false)
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, started }))
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, started])

  const startChat = async () => {
    setStarted(true)
    setLoading(true)
    const res = await fetch('/api/soulmate/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] })
    })
    const data = await res.json()
    if (data.reply) setMessages([{ role: 'assistant', content: data.reply }])
    setLoading(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const res = await fetch('/api/soulmate/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages })
    })
    const data = await res.json()
    if (data.reply) setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    setLoading(false)
  }

  const clearChat = () => {
    if (confirm('Start fresh?')) {
      setMessages([])
      setStarted(false)
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl"></div>

        <div className="max-w-md text-center relative z-10">
          <div className="text-7xl mb-6">✨</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent mb-4">
            Soulmate
          </h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Discover who you truly are. Find someone who sees it too.
          </p>
          <button
            onClick={startChat}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-10 py-4 rounded-full font-medium transition-all text-lg shadow-2xl shadow-purple-900/50"
          >
            Begin
          </button>
          <p className="text-gray-600 text-sm mt-8">A journey of self-discovery</p>
          <a href="/soulmate" className="text-purple-400 text-sm mt-4 block hover:underline">← Back to versions</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col relative">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none"></div>

      {/* Header */}
      <div className="relative bg-black/40 backdrop-blur-sm border-b border-white/5 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <h1 className="font-semibold text-white">Soulmate</h1>
              <p className="text-xs text-gray-500">V2: Dark Romantic</p>
            </div>
          </div>
          <button onClick={clearChat} className="text-gray-500 hover:text-gray-300 text-sm">
            New Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 relative">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md'
                    : 'bg-white/5 text-gray-200 border border-white/10 rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3 border border-white/10">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="relative bg-black/40 backdrop-blur-sm border-t border-white/5 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Share your thoughts..."
            disabled={loading}
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-700 disabled:to-gray-700 text-white px-6 py-3 rounded-full transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
