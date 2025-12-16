'use client'

/**
 * V5: BOLD MODERN
 * High contrast, strong typography, trendy
 * Confident, striking, contemporary feel
 */

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'soulmate-chat-v5'

export default function SoulmateV5() {
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
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-lg text-center">
          <h1 className="text-7xl font-black text-white mb-2 tracking-tighter">
            SOUL
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500">MATE</span>
          </h1>
          <p className="text-gray-500 mb-10 text-lg tracking-wide uppercase">
            Know yourself. Find your match.
          </p>
          <button
            onClick={startChat}
            className="bg-white hover:bg-gray-100 text-black px-12 py-4 font-bold text-lg tracking-wide transition-all"
          >
            START →
          </button>
          <p className="text-gray-700 text-xs mt-10 tracking-widest uppercase">Psychology-backed matching</p>
          <a href="/soulmate" className="text-gray-600 text-sm mt-4 block hover:text-white">← Back to versions</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-900 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-black text-white text-xl tracking-tight">
              SOUL<span className="text-red-500">MATE</span>
            </h1>
            <p className="text-xs text-gray-600 tracking-widest">V5: BOLD MODERN</p>
          </div>
          <button onClick={clearChat} className="text-gray-600 hover:text-white text-xs tracking-widest uppercase border border-gray-800 px-4 py-2 hover:border-gray-600 transition-colors">
            Reset
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-5 py-3 ${
                  msg.role === 'user'
                    ? 'bg-white text-black'
                    : 'bg-gray-900 text-gray-200 border-l-2 border-red-500'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-900 border-l-2 border-red-500 px-5 py-3">
                <div className="flex gap-2">
                  <span className="w-2 h-2 bg-red-500 animate-pulse"></span>
                  <span className="w-2 h-2 bg-red-500 animate-pulse" style={{ animationDelay: '200ms' }}></span>
                  <span className="w-2 h-2 bg-red-500 animate-pulse" style={{ animationDelay: '400ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-900 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="TYPE YOUR ANSWER..."
            disabled={loading}
            className="flex-1 bg-gray-900 border border-gray-800 px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 tracking-wide"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-white hover:bg-gray-100 disabled:bg-gray-900 disabled:text-gray-700 text-black px-8 py-4 font-bold tracking-wide transition-colors"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  )
}
