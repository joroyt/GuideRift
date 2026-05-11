'use client'

import { useState, useEffect, useRef } from 'react'
import { Link2, Play } from 'lucide-react'
import type { LinkData, TaskOption } from './page'

type FlowState = 'selecting' | 'workink_loading' | 'error'

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
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
  const analyticsFiredRef = useRef(false)

  useEffect(() => {
    if (!analyticsFiredRef.current) {
      analyticsFiredRef.current = true
      fireAnalytics('page_view', link.id)
    }
  }, [link.id])

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
                  <Link2 size={20} color="rgba(255,255,255,0.55)" strokeWidth={1.5} />
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
                        {task.task_type === 'workink'
                          ? <Play size={14} color="rgba(255,255,255,0.5)" strokeWidth={1.5} fill="rgba(255,255,255,0.5)" />
                          : getInitials(task.name)}
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
