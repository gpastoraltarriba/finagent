'use client'
import { useEffect, useRef } from 'react'
import { Message } from '@/app/page'

const TOOL_ICONS: Record<string, string> = {
  get_stock_data: '📊',
  get_news: '📰',
  calculate_metrics: '🔢',
}

const TOOL_LABELS: Record<string, string> = {
  get_stock_data: 'Fetching stock data',
  get_news: 'Searching news',
  calculate_metrics: 'Computing indicators',
}

function ToolBadge({ tool, args }: { tool: string; args: Record<string, unknown> }) {
  const ticker = args.ticker || args.query || ''
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
      borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#86efac',
      marginBottom: 6,
    }}>
      <span>{TOOL_ICONS[tool] || '⚙️'}</span>
      <span>{TOOL_LABELS[tool] || tool}</span>
      {ticker && <span style={{ color: '#22c55e', fontWeight: 600 }}>{String(ticker).toUpperCase()}</span>}
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  // Simple markdown-like formatting
  const formatContent = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith('### ')) return <div key={i} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginTop: 12, marginBottom: 4 }}>{line.slice(4)}</div>
      if (line.startsWith('## ')) return <div key={i} style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginTop: 14, marginBottom: 6 }}>{line.slice(3)}</div>
      // Bold
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Empty line = spacing
      if (!line.trim()) return <div key={i} style={{ height: 8 }} />
      return <div key={i} dangerouslySetInnerHTML={{ __html: bold }} style={{ lineHeight: 1.7 }} />
    })
  }

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }} className="message-enter">
        <div style={{
          maxWidth: '75%', background: 'var(--accent-green-dim)',
          color: '#fff', borderRadius: '16px 16px 4px 16px',
          padding: '10px 16px', fontSize: 14, lineHeight: 1.6,
        }}>
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }} className="message-enter">
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
      }}>📈</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {message.toolCalls.map((tc, i) => (
              <ToolBadge key={i} tool={tc.tool} args={tc.args} />
            ))}
          </div>
        )}

        {/* Content */}
        {message.content ? (
          <div style={{
            background: 'var(--bg-card)', borderRadius: '4px 16px 16px 16px',
            border: '1px solid var(--border)', padding: '12px 16px',
            color: 'var(--text-primary)', fontSize: 14,
          }}>
            {formatContent(message.content)}
            {message.isStreaming && !message.content.endsWith(' ') && (
              <span className="typing-cursor" />
            )}
          </div>
        ) : message.isStreaming ? (
          <div style={{
            background: 'var(--bg-card)', borderRadius: '4px 16px 16px 16px',
            border: '1px solid var(--border)', padding: '12px 16px',
          }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)',
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  opacity: 0.7,
                }} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function ChatPanel({ messages, isLoading }: { messages: Message[]; isLoading: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 }}>
        <div style={{ fontSize: 48 }}>📊</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>AI Financial Analyst</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 380 }}>
          Ask me about any stock — I'll fetch live data, analyze recent news, compute technical indicators and give you a recommendation.
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
