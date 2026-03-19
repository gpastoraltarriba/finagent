'use client'
import { useState, useRef, useEffect } from 'react'
import ChatPanel from '@/components/ChatPanel'
import StockPanel from '@/components/StockPanel'
import SuggestedQueries from '@/components/SuggestedQueries'

export interface StockData {
  ticker: string
  name: string
  price: number
  change: number
  change_pct: number
  market_cap: number
  pe_ratio: number
  '52w_high': number
  '52w_low': number
  sector: string
  currency: string
  price_history: { date: string; close: number; volume: number; high: number; low: number }[]
  summary: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: { tool: string; args: Record<string, unknown> }[]
  isStreaming?: boolean
}

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    const assistantId = crypto.randomUUID()
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', isStreaming: true, toolCalls: [] }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setIsLoading(true)
    setInputValue('')

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

    try {
      const resp = await fetch('https://finagent-production.up.railway.app/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })

      const reader = resp.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = JSON.parse(line.slice(6))

          if (payload.type === 'text') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, content: m.content + payload.content } : m
            ))
          } else if (payload.type === 'tool_use') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId
                ? { ...m, toolCalls: [...(m.toolCalls || []), { tool: payload.tool, args: payload.args }] }
                : m
            ))
          } else if (payload.type === 'stock_data') {
            setStockData(payload.data)
          } else if (payload.type === 'done') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, isStreaming: false } : m
            ))
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: '⚠️ Connection error. Make sure the backend is running on port 8000.', isStreaming: false }
          : m
      ))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Left: Chat */}
      <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 24px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>📈</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>FinAgent</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              POWERED BY LLAMA 3.3 · LIVE DATA
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>LIVE</span>
          </div>
        </div>

        {/* Messages */}
        <ChatPanel messages={messages} isLoading={isLoading} />

        {/* Suggested queries when empty */}
        {messages.length === 0 && (
          <SuggestedQueries onSelect={(q) => { setInputValue(q); sendMessage(q) }} />
        )}

        {/* Input */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
        }}>
          <div style={{
            display: 'flex', gap: 8, alignItems: 'flex-end',
            background: 'var(--bg-card)', borderRadius: 12,
            border: '1px solid var(--border)',
            padding: '8px 12px',
            transition: 'border-color 0.2s',
          }}>
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputValue) }
              }}
              placeholder="Ask about any stock... e.g. 'Should I buy NVDA?' or 'What's happening with Nestlé?'"
              rows={1}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontSize: 14, resize: 'none',
                lineHeight: 1.5, maxHeight: 120, overflow: 'auto',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              style={{
                background: isLoading || !inputValue.trim() ? 'var(--border)' : 'var(--accent-green)',
                color: isLoading || !inputValue.trim() ? 'var(--text-muted)' : '#fff',
                border: 'none', borderRadius: 8, padding: '7px 14px',
                fontSize: 13, fontWeight: 500, cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              {isLoading ? '...' : 'Analyze →'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
            Not financial advice · Data from Yahoo Finance & NewsAPI
          </div>
        </div>
      </div>

      {/* Right: Stock dashboard */}
      <StockPanel stockData={stockData} />
    </div>
  )
}
