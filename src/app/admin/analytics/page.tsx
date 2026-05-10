'use client'

import { useState, useEffect, useCallback } from 'react'

type Period = '7d' | '30d' | 'all'

interface Totals {
  page_views: number
  completions: number
  completion_rate: number
  estimated_revenue: number
}

interface PerLink {
  id: string
  title: string
  slug: string
  views: number
  starts: number
  completions: number
  completion_rate: number
  revenue: number
}

interface PerTask {
  id: string
  name: string
  shown: number
  completed: number
  completion_rate: number
  revenue: number
}

interface AnalyticsData {
  totals: Totals
  per_link: PerLink[]
  per_task: PerTask[]
}

function pct(n: number) {
  return (n * 100).toFixed(1) + '%'
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: '#161616',
        border: '0.5px solid rgba(255,255,255,0.07)',
        borderRadius: '12px',
        padding: '18px 20px',
        flex: 1,
        minWidth: '120px',
      }}
    >
      <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.02em' }}>
        {value}
      </p>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('7d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/admin/api/analytics?period=${period}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [period])

  useEffect(() => { load() }, [load])

  const periodLabel: Record<Period, string> = {
    '7d': '7 days',
    '30d': '30 days',
    all: 'All time',
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '0.5px solid rgba(255,255,255,0.07)',
  }

  const tdStyle: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    borderBottom: '0.5px solid rgba(255,255,255,0.04)',
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>
          Analytics
        </h1>
        {/* Period tabs */}
        <div
          style={{
            display: 'flex',
            background: '#161616',
            border: '0.5px solid rgba(255,255,255,0.07)',
            borderRadius: '10px',
            padding: '3px',
            gap: '2px',
          }}
        >
          {(['7d', '30d', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '12px',
                fontWeight: 500,
                padding: '5px 12px',
                borderRadius: '7px',
                background: period === p ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: period === p ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.12s ease',
              }}
            >
              {periodLabel[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Loading...</p>
      ) : !data ? (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Failed to load.</p>
      ) : (
        <>
          {/* Metric cards */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
            <MetricCard label="Page views" value={data.totals.page_views.toLocaleString()} />
            <MetricCard label="Completions" value={data.totals.completions.toLocaleString()} />
            <MetricCard label="Completion rate" value={pct(data.totals.completion_rate)} />
            <MetricCard label="Est. revenue" value={`€${data.totals.estimated_revenue.toFixed(2)}`} />
          </div>

          {/* Per-link table */}
          <h2 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            By link
          </h2>
          <div
            style={{
              background: '#161616',
              border: '0.5px solid rgba(255,255,255,0.07)',
              borderRadius: '14px',
              overflow: 'hidden',
              marginBottom: '28px',
            }}
          >
            {data.per_link.length === 0 ? (
              <p style={{ padding: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                No data for this period.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Link</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Views</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Starts</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Completions</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Rate</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Est. Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.per_link.map((row) => (
                    <tr key={row.id}>
                      <td style={tdStyle}>
                        <span style={{ color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>{row.title}</span>
                        <span style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '1px' }}>
                          /{row.slug}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{row.views.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{row.starts.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{row.completions.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{pct(row.completion_rate)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>€{row.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Per-task table */}
          <h2 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            By task
          </h2>
          <div
            style={{
              background: '#161616',
              border: '0.5px solid rgba(255,255,255,0.07)',
              borderRadius: '14px',
              overflow: 'hidden',
            }}
          >
            {data.per_task.length === 0 ? (
              <p style={{ padding: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                No data for this period.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Task</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Times shown</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Completions</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Rate</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Est. Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.per_task.map((row) => (
                    <tr key={row.id}>
                      <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>{row.name}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{row.shown.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{row.completed.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{pct(row.completion_rate)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>€{row.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
