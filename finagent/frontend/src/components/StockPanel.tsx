'use client'
import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts'
import { StockData } from '@/app/page'

function fmt(n: number | null | undefined, digits = 2): string {
  if (n == null || isNaN(n)) return '—'
  return n.toFixed(digits)
}

function fmtLarge(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`
  return `$${n.toFixed(0)}`
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--accent-green)', fontWeight: 600 }}>${payload[0].value.toFixed(2)}</div>
    </div>
  )
}

export default function StockPanel({ stockData }: { stockData: StockData | null }) {
  const [period, setPeriod] = useState<'1W' | '1M'>('1M')

  if (!stockData) {
    return (
      <div style={{
        background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32,
      }}>
        <div style={{ fontSize: 48 }}>📉</div>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)' }}>No stock selected</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          Ask about a stock and I'll display its dashboard here.
        </div>
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', maxWidth: 320 }}>
          {['NVDA', 'AAPL', 'NESN.SW', 'NOVN.SW'].map(t => (
            <div key={t} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 12px', textAlign: 'center',
              fontSize: 13, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace',
            }}>{t}</div>
          ))}
        </div>
      </div>
    )
  }

  const history = period === '1W' ? stockData.price_history.slice(-7) : stockData.price_history
  const firstPrice = history[0]?.close ?? 0
  const lastPrice = history[history.length - 1]?.close ?? 0
  const perfPct = firstPrice ? ((lastPrice - firstPrice) / firstPrice * 100) : 0
  const isPositive = (stockData.change_pct ?? 0) >= 0

  // format dates to MM/DD
  const chartData = history.map(d => ({
    ...d,
    dateLabel: d.date.slice(5).replace('-', '/'),
  }))

  return (
    <div style={{ background: 'var(--bg-secondary)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Stock header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600,
              color: 'var(--accent-green)', background: 'rgba(34,197,94,0.1)',
              padding: '2px 8px', borderRadius: 4, letterSpacing: '0.05em',
            }}>{stockData.ticker}</span>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginTop: 6 }}>
              {stockData.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stockData.sector}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
              {stockData.currency === 'USD' ? '$' : stockData.currency === 'CHF' ? 'CHF ' : ''}
              {fmt(stockData.price)}
            </div>
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {isPositive ? '+' : ''}{fmt(stockData.change)} ({isPositive ? '+' : ''}{fmt(stockData.change_pct)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ padding: '16px 12px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 8px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Price chart
            <span style={{
              marginLeft: 8, fontSize: 11, fontWeight: 600,
              color: perfPct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {perfPct >= 0 ? '▲' : '▼'} {Math.abs(perfPct).toFixed(1)}%
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['1W', '1M'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                background: period === p ? 'var(--accent-green)' : 'var(--bg-card)',
                color: period === p ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${period === p ? 'var(--accent-green)' : 'var(--border)'}`,
                borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>{p}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.25} />
                <stop offset="95%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey="close"
              stroke={isPositive ? '#22c55e' : '#ef4444'}
              strokeWidth={1.5} fill="url(#priceGrad)"
              dot={false} activeDot={{ r: 4, fill: isPositive ? '#22c55e' : '#ef4444' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Metrics grid */}
      <div style={{ padding: '8px 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <MetricCard label="Market Cap" value={fmtLarge(stockData.market_cap)} />
        <MetricCard label="P/E Ratio" value={fmt(stockData.pe_ratio, 1)} sub="Trailing" />
        <MetricCard label="52W High" value={`$${fmt((stockData as any)['52w_high'])}`} />
        <MetricCard label="52W Low" value={`$${fmt((stockData as any)['52w_low'])}`} />
      </div>

      {/* Company summary */}
      {stockData.summary && (
        <div style={{ padding: '0 16px 20px' }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '12px 14px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>About</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {stockData.summary}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
