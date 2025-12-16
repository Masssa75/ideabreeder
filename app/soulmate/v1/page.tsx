'use client'

/**
 * V1: LIGHT & CLEAN
 * Minimal white/cream background, soft shadows, airy feel
 * Best practice: Light backgrounds improve readability for prolonged use
 */

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'soulmate-chat-v1'

export default function SoulmateV1() {
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
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">💕</span>
          </div>
          <h1 className="text-3xl font-light text-gray-800 mb-3">
            Find Your Person
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            A thoughtful conversation to understand who you are and who you're looking for.
          </p>
          <button
            onClick={startChat}
            className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg shadow-rose-200 hover:shadow-rose-300"
          >
            Start Conversation
          </button>
          <p className="text-gray-400 text-sm mt-6">Takes ~15 minutes</p>
          <a href="/soulmate" className="text-rose-400 text-sm mt-4 block hover:underline">← Back to versions</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
              <span className="text-xl">💕</span>
            </div>
            <div>
              <h1 className="font-medium text-gray-800">Soulmate Finder</h1>
              <p className="text-xs text-gray-400">V1: Light & Clean</p>
            </div>
          </div>
          <button onClick={clearChat} className="text-gray-400 hover:text-gray-600 text-sm">
            New Chat
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
                    ? 'bg-rose-500 text-white rounded-br-md'
                    : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-rose-300 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your answer..."
            disabled={loading}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-rose-500 hover:bg-rose-600 disabled:bg-gray-200 disabled:text-gray-400 text-white px-6 py-3 rounded-full transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
