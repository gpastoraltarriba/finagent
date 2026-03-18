'use client'

const SUGGESTIONS = [
  { emoji: '🇨🇭', label: 'Swiss blue-chips', query: 'Analyze Nestlé (NESN.SW) — should I buy or hold?' },
  { emoji: '🤖', label: 'AI boom', query: 'What\'s happening with NVIDIA? Is it still a good buy?' },
  { emoji: '💊', label: 'Swiss pharma', query: 'Compare Novartis (NOVN.SW) and Roche (ROG.SW) — which is better?' },
  { emoji: '📱', label: 'Big Tech', query: 'Analyze Apple stock with recent news and technicals' },
  { emoji: '⚡', label: 'Energy', query: 'What are the latest developments for Tesla stock?' },
  { emoji: '🏦', label: 'Banking', query: 'Analyze UBS (UBSG.SW) after the Credit Suisse merger' },
]

export default function SuggestedQueries({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div style={{ padding: '0 20px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Try asking
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => onSelect(s.query)} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '10px 12px', textAlign: 'left',
            cursor: 'pointer', transition: 'all 0.15s', color: 'var(--text-primary)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-green)'
            ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
            ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'
          }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{s.emoji}</div>
            <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{s.query}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
