'use client'

/**
 * V4: WARM & COZY
 * Peachy coral and warm earth tones
 * Friendly, inviting, approachable feel
 */

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'soulmate-chat-v4'

export default function SoulmateV4() {
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
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-rose-50 to-amber-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-7xl mb-6">🧡</div>
          <h1 className="text-4xl font-serif text-amber-900 mb-3">
            Find Your Person
          </h1>
          <p className="text-amber-700/70 mb-8 leading-relaxed text-lg">
            Let's have a warm conversation about who you are and who makes your heart feel at home.
          </p>
          <button
            onClick={startChat}
            className="bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white px-10 py-4 rounded-full font-medium transition-all shadow-lg text-lg"
          >
            Let's Chat ☕
          </button>
          <p className="text-amber-600/50 text-sm mt-8">Like talking to a good friend</p>
          <a href="/soulmate" className="text-amber-600 text-sm mt-4 block hover:underline">← Back to versions</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-rose-50 to-amber-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-amber-200/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧡</span>
            <div>
              <h1 className="font-serif text-amber-900 text-lg">Soulmate</h1>
              <p className="text-xs text-amber-600/60">V4: Warm & Cozy</p>
            </div>
          </div>
          <button onClick={clearChat} className="text-amber-600/60 hover:text-amber-700 text-sm">
            Start Over
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-orange-400 to-rose-400 text-white rounded-br-md shadow-md'
                    : 'bg-white text-amber-900 shadow-sm border border-amber-100 rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-amber-100">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white/70 backdrop-blur-sm border-t border-amber-200/50 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Tell me more..."
            disabled={loading}
            className="flex-1 bg-white border border-amber-200 rounded-full px-5 py-3 text-amber-900 placeholder-amber-400 focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 disabled:from-gray-200 disabled:to-gray-200 text-white disabled:text-gray-400 px-6 py-3 rounded-full transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
