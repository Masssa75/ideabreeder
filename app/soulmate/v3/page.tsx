'use client'

/**
 * V3: GLASSMORPHISM
 * Frosted glass effects on colorful gradient background
 * Modern, trendy, ethereal feel
 */

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'soulmate-chat-v3'

export default function SoulmateV3() {
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
      <div className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Floating shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-pink-300/30 rounded-full blur-xl"></div>

        <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-10 max-w-md text-center border border-white/30 shadow-2xl relative z-10">
          <div className="text-6xl mb-4">💜</div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Soulmate
          </h1>
          <p className="text-white/80 mb-8 leading-relaxed">
            An intimate conversation to help you find your perfect match.
          </p>
          <button
            onClick={startChat}
            className="bg-white/90 hover:bg-white text-purple-600 px-8 py-3 rounded-full font-semibold transition-all shadow-lg w-full"
          >
            Start Your Journey
          </button>
          <p className="text-white/60 text-sm mt-6">Private & Secure</p>
          <a href="/soulmate" className="text-white/70 text-sm mt-4 block hover:text-white">← Back to versions</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex flex-col relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl"></div>

      {/* Header */}
      <div className="relative bg-white/10 backdrop-blur-md border-b border-white/20 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <span className="text-xl">💜</span>
            </div>
            <div>
              <h1 className="font-semibold text-white">Soulmate</h1>
              <p className="text-xs text-white/60">V3: Glassmorphism</p>
            </div>
          </div>
          <button onClick={clearChat} className="text-white/60 hover:text-white text-sm bg-white/10 px-3 py-1 rounded-full">
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
                className={`max-w-[80%] rounded-2xl px-4 py-3 backdrop-blur-md ${
                  msg.role === 'user'
                    ? 'bg-white/90 text-purple-700 rounded-br-md shadow-lg'
                    : 'bg-white/20 text-white border border-white/30 rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl rounded-bl-md px-4 py-3 border border-white/30">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="relative bg-white/10 backdrop-blur-md border-t border-white/20 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Share your thoughts..."
            disabled={loading}
            className="flex-1 bg-white/20 backdrop-blur border border-white/30 rounded-full px-5 py-3 text-white placeholder-white/50 focus:outline-none focus:bg-white/30 focus:border-white/50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-white/90 hover:bg-white disabled:bg-white/30 text-purple-600 disabled:text-purple-400 px-6 py-3 rounded-full transition-all font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
