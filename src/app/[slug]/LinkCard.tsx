'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { LinkData, TaskOption } from './page'

type FlowState = 'selecting' | 'workink_loading' | 'waiting' | 'ready' | 'rate_limited' | 'error'

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
}

function getClientIp(): string {
  return ''
}

function generateSessionId(): string {
  return crypto.randomUUID()
}

function FileIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.55)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4ade80"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function Spinner() {
  return (
    <div
      style={{
        width: '36px',
        height: '36px',
        border: '2px solid rgba(255,255,255,0.08)',
        borderTopColor: 'rgba(255,255,255,0.45)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  )
}

async function fireAnalytics(
  eventType: string,
  linkId: string,
  taskId?: string
) {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType, link_id: linkId, task_id: taskId }),
    })
  } catch {
    // fire and forget
  }
}

export default function LinkCard({
  link,
  tasks,
}: {
  link: LinkData
  tasks: TaskOption[]
}) {
  const recommended = tasks.find((t) => t.is_recommended) ?? tasks[0]
  const [selectedTask, setSelectedTask] = useState<TaskOption>(recommended)
  const [flowState, setFlowState] = useState<FlowState>('selecting')
  const [sessionId, setSessionId] = useState<string>('')
  const [downloadUrl, setDownloadUrl] = useState<string>('')
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const analyticsFiredRef = useRef(false)

  useEffect(() => {
    if (!analyticsFiredRef.current) {
      analyticsFiredRef.current = true
      fireAnalytics('page_view', link.id)
    }
  }, [link.id])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => () => stopPolling(), [stopPolling])

  const handleTaskSelect = (task: TaskOption) => {
    setSelectedTask(task)
    fireAnalytics('task_selected', link.id, task.id)
  }

  const handleContinue = async () => {
    if (selectedTask.task_type === 'workink') {
      setFlowState('workink_loading')
      try {
        const res = await fetch('/api/workink/redirect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: link.slug, taskId: selectedTask.id }),
        })
        const json = await res.json()
        if (json.error || !json.url) {
          setFlowState('error')
          return
        }
        window.location.href = json.url
      } catch {
        setFlowState('error')
      }
      return
    }

    // CPI flow
    const sid = generateSessionId()
    setSessionId(sid)

    fireAnalytics('task_started', link.id, selectedTask.id)

    const res = await fetch('/api/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sid,
        link_id: link.id,
        task_id: selectedTask.id,
      }),
    })

    const json = await res.json()

    if (json.error === 'rate_limited') {
      setFlowState('rate_limited')
      return
    }

    if (!json.ok) {
      setFlowState('error')
      return
    }

    if (selectedTask.affiliate_url) {
      window.open(selectedTask.affiliate_url, '_blank', 'noopener,noreferrer')
    }

    setFlowState('waiting')

    pollRef.current = setInterval(async () => {
      try {
        const checkRes = await fetch(
          `/api/session/check?session_id=${encodeURIComponent(sid)}`
        )
        const checkJson = await checkRes.json()

        if (checkJson.ready && checkJson.url) {
          stopPolling()
          setDownloadUrl(checkJson.url)
          setFlowState('ready')
          fireAnalytics('task_completed', link.id, selectedTask.id)
        }
      } catch {
        // keep polling
      }
    }, 2000)
  }

  const handleChooseDifferent = async () => {
    stopPolling()
    if (sessionId) {
      fetch('/api/session/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      }).catch(() => {})
    }
    setSessionId('')
    setFlowState('selecting')
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .task-card {
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .task-card:hover {
          border-color: rgba(99,179,237,0.3) !important;
        }
        .cta-btn {
          transition: opacity 0.15s ease;
        }
        .cta-btn:hover {
          opacity: 0.88;
        }
        .cta-btn:active {
          opacity: 0.76;
        }
        .download-btn {
          transition: opacity 0.15s ease;
        }
        .download-btn:hover {
          opacity: 0.88;
        }
        .text-link {
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .text-link:hover {
          color: rgba(255,255,255,0.6) !important;
        }
      `}</style>

      <main
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #090909 0%, #131313 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <div
          style={{
            background: '#111111',
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
          }}
        >
          {/* ── SELECTING ─────────────────────────────────────── */}
          {flowState === 'selecting' && (
            <>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    background: '#1a1a1a',
                    border: '0.5px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileIcon />
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '15px',
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.88)',
                      lineHeight: '1.3',
                    }}
                  >
                    {link.title}
                  </p>
                  <p
                    style={{
                      margin: '3px 0 0',
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    Complete one task to continue
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: '0.5px',
                  background: 'rgba(255,255,255,0.07)',
                  marginBottom: '20px',
                }}
              />

              {/* Section label */}
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                Choose a task
              </p>

              {/* Task list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {tasks.map((task) => {
                  const isSelected = selectedTask.id === task.id
                  return (
                    <div
                      key={task.id}
                      className="task-card"
                      onClick={() => handleTaskSelect(task)}
                      style={{
                        background: isSelected ? 'rgba(99,179,237,0.04)' : '#161616',
                        border: isSelected
                          ? '0.5px solid rgba(99,179,237,0.5)'
                          : '0.5px solid rgba(255,255,255,0.07)',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      {/* Logo block */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          background: '#1e1e1e',
                          border: '0.5px solid rgba(255,255,255,0.07)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.5)',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {getInitials(task.name)}
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'rgba(255,255,255,0.85)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {task.name}
                        </p>
                        {task.description && (
                          <p
                            style={{
                              margin: '2px 0 0',
                              fontSize: '12px',
                              color: 'rgba(255,255,255,0.35)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Right: recommended badge + radio */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '4px',
                          flexShrink: 0,
                        }}
                      >
                        {task.is_recommended && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: 'rgba(99,179,237,0.9)',
                              background: 'rgba(99,179,237,0.1)',
                              border: '0.5px solid rgba(99,179,237,0.25)',
                              borderRadius: '4px',
                              padding: '2px 5px',
                            }}
                          >
                            Recommended
                          </span>
                        )}
                        {/* Radio */}
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            border: isSelected
                              ? '4.5px solid rgba(99,179,237,0.9)'
                              : '1.5px solid rgba(255,255,255,0.2)',
                            background: 'transparent',
                            flexShrink: 0,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* CTA */}
              <button
                className="cta-btn"
                onClick={handleContinue}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  color: '#0a0a0a',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '13px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '16px',
                  fontFamily: 'inherit',
                }}
              >
                Continue with {selectedTask.name}
              </button>

              {/* Footer note */}
              <p
                style={{
                  margin: 0,
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.25)',
                  textAlign: 'center',
                  lineHeight: '1.5',
                }}
              >
                Completing a task supports free content on this channel.
              </p>
            </>
          )}

          {/* ── WORKINK LOADING ───────────────────────────────── */}
          {flowState === 'workink_loading' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 0',
              }}
            >
              <Spinner />
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.82)',
                }}
              >
                Redirecting...
              </p>
            </div>
          )}

          {/* ── WAITING ───────────────────────────────────────── */}
          {flowState === 'waiting' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 0',
              }}
            >
              <Spinner />
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.82)',
                }}
              >
                Waiting for confirmation...
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.35)',
                  textAlign: 'center',
                  lineHeight: '1.6',
                }}
              >
                Complete the task in the new tab, this page will update automatically.
              </p>
              <button
                className="text-link"
                onClick={handleChooseDifferent}
                style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.35)',
                  padding: 0,
                  fontFamily: 'inherit',
                  textDecoration: 'underline',
                  textDecorationColor: 'rgba(255,255,255,0.15)',
                }}
              >
                Choose a different task
              </button>
            </div>
          )}

          {/* ── READY ─────────────────────────────────────────── */}
          {flowState === 'ready' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 0',
              }}
            >
              <CheckCircleIcon />
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.88)',
                }}
              >
                Confirmed
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.35)',
                }}
              >
                Your download is ready.
              </p>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="download-btn"
                style={{
                  display: 'block',
                  width: '100%',
                  background: '#22c55e',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '13px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textAlign: 'center',
                  textDecoration: 'none',
                  marginTop: '4px',
                }}
              >
                Download Now
              </a>
            </div>
          )}

          {/* ── RATE LIMITED ──────────────────────────────────── */}
          {flowState === 'rate_limited' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 0',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.82)',
                }}
              >
                Too many attempts
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.35)',
                  lineHeight: '1.6',
                }}
              >
                You've made too many requests for this link. Please try again in an hour.
              </p>
              <button
                className="text-link"
                onClick={() => setFlowState('selecting')}
                style={{
                  marginTop: '4px',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.35)',
                  padding: 0,
                  fontFamily: 'inherit',
                  textDecoration: 'underline',
                  textDecorationColor: 'rgba(255,255,255,0.15)',
                }}
              >
                Go back
              </button>
            </div>
          )}

          {/* ── ERROR ─────────────────────────────────────────── */}
          {flowState === 'error' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 0',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.82)',
                }}
              >
                Something went wrong
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.35)',
                }}
              >
                Please try again.
              </p>
              <button
                className="text-link"
                onClick={() => setFlowState('selecting')}
                style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.35)',
                  padding: 0,
                  fontFamily: 'inherit',
                  textDecoration: 'underline',
                  textDecorationColor: 'rgba(255,255,255,0.15)',
                }}
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
