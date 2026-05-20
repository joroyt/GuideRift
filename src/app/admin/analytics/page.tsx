'use client'

import { useState, useEffect, useCallback } from 'react'

type Filter = 'today' | 'yesterday' | '7d' | '30d' | 'all'

interface Totals {
  page_views: number
  completions: number
  completion_rate: number
}

interface PerLink {
  id: string
  title: string
  slug: string
  views: number
  starts: number
  completions: number
  completion_rate: number
}

interface PerTask {
  id: string
  name: string
  task_type: string
  shown: number
  completed: number
  completion_rate: number
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

const getMidnightUTC = () => {
  const now = new Date()
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  return midnight.toISOString()
}

const getYesterdayRange = () => {
  const now = new Date()
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0)
  const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  return {
    since: startOfYesterday.toISOString(),
    until: endOfYesterday.toISOString(),
  }
}

export default function AdminAnalyticsPage() {
  const [filter, setFilter] = useState<Filter>('today')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    let url: string
    if (filter === 'today') {
      url = `/admin/api/analytics?since=${encodeURIComponent(getMidnightUTC())}`
    } else if (filter === 'yesterday') {
      const { since, until } = getYesterdayRange()
      url = `/admin/api/analytics?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`
    } else {
      url = `/admin/api/analytics?period=${filter}`
    }
    const res = await fetch(url)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const filterLabel: Record<Filter, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
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
          {(['today', 'yesterday', '7d', '30d', 'all'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '12px',
                fontWeight: 500,
                padding: '5px 12px',
                borderRadius: '7px',
                background: filter === f ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: filter === f ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.12s ease',
              }}
            >
              {filterLabel[f]}
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
                  </tr>
                </thead>
                <tbody>
                  {data.per_task.map((row) => (
                    <tr key={row.id}>
                      <td style={{ ...tdStyle }}>
                        <span style={{ color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>{row.name}</span>
                        {row.task_type === 'workink' && (
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255,180,0,0.12)',
                            color: 'rgba(255,180,0,0.75)',
                            border: '0.5px solid rgba(255,180,0,0.2)',
                          }}>
                            Watch Ads
                          </span>
                        )}
                        {row.task_type === 'mylead' && (
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(99,179,237,0.1)',
                            color: 'rgba(99,179,237,0.8)',
                            border: '0.5px solid rgba(99,179,237,0.25)',
                          }}>
                            MyLead
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{row.shown.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{row.completed.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{pct(row.completion_rate)}</td>
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
