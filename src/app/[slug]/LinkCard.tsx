'use client'

import { useState, useEffect, useRef } from 'react'
import { Link2, ExternalLink } from 'lucide-react'
import type { LinkData } from './page'
import type { TaskOption } from '@/lib/tasks'
import { renderIcon } from '@/lib/icons'

type FlowState =
  | 'selecting'
  | 'workink_loading'
  | 'mylead_waiting'
  | 'cpagrip_waiting'
  | 'links_revealed'
  | 'error'

type DestinationLink = { label: string; url: string }

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
  isAdmin = false,
}: {
  link: LinkData
  tasks: TaskOption[]
  isAdmin?: boolean
}) {
  const recommended = tasks.find((t) => t.is_recommended) ?? tasks[0]
  const [selectedTask, setSelectedTask] = useState<TaskOption>(recommended)
  const [flowState, setFlowState] = useState<FlowState>('selecting')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [destinationLinks, setDestinationLinks] = useState<DestinationLink[]>([])
  const analyticsFiredRef = useRef(false)

  // 60-second cooldown on Watch Ads when any other offer type is visible
  const hasOtherOffers = tasks.some((t) => t.task_type !== 'workink')
  const [countdown, setCountdown] = useState(hasOtherOffers ? 60 : 0)

  useEffect(() => {
    if (!analyticsFiredRef.current) {
      analyticsFiredRef.current = true
      fireAnalytics('page_view', link.id)
    }
  }, [link.id])

  // Countdown timer — runs once on mount, only when paid tasks are present
  useEffect(() => {
    if (countdown === 0) return
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(id); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll for mylead / cpagrip completion
  useEffect(() => {
    if ((flowState !== 'mylead_waiting' && flowState !== 'cpagrip_waiting') || !sessionId) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/session/check?session_id=${sessionId}`)
        const json = await res.json()
        if (json.status === 'completed') {
          clearInterval(interval)
          const links: DestinationLink[] = json.destinationLinks ?? []
          if (links.length === 1) {
            window.location.href = links[0].url
          } else if (links.length > 1) {
            setDestinationLinks(links)
            setFlowState('links_revealed')
          }
        }
      } catch {
        // keep polling
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [flowState, sessionId])

  const handleTaskSelect = (task: TaskOption) => {
    setSelectedTask(task)
    fireAnalytics('task_selected', link.id, task.id)
  }

  const skipToDestination = async () => {
    try {
      const res = await fetch(`/api/admin/destination-links?linkId=${link.id}`)
      if (!res.ok) return
      const json = await res.json()
      const links: DestinationLink[] = json.destinationLinks ?? []
      if (links.length === 1) {
        window.location.href = links[0].url
      } else if (links.length > 1) {
        setDestinationLinks(links)
        setFlowState('links_revealed')
      }
    } catch {
      // silent
    }
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

    if (selectedTask.task_type === 'mylead') {
      try {
        const res = await fetch('/api/session/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ link_id: link.id, task_id: selectedTask.id }),
        })
        const json = await res.json()
        if (!res.ok || !json.session_id) {
          setFlowState('error')
          return
        }
        const sid: string = json.session_id
        setSessionId(sid)

        const offerUrl = selectedTask.affiliate_url?.includes('?')
          ? `${selectedTask.affiliate_url}&ml_sub1=${sid}`
          : `${selectedTask.affiliate_url}?ml_sub1=${sid}`
        window.open(offerUrl, '_blank')

        setFlowState('mylead_waiting')
      } catch {
        setFlowState('error')
      }
      return
    }

    if (selectedTask.task_type === 'cpagrip') {
      try {
        const res = await fetch('/api/session/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ link_id: link.id, task_id: selectedTask.id }),
        })
        const json = await res.json()
        if (!res.ok || !json.session_id) {
          setFlowState('error')
          return
        }
        const sid: string = json.session_id
        setSessionId(sid)

        const offerUrl = `${selectedTask.affiliate_url}&tracking_id=${sid}`
        window.open(offerUrl, '_blank')

        setFlowState('cpagrip_waiting')
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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
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
        .dest-link-btn {
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .dest-link-btn:hover {
          border-color: rgba(255,255,255,0.18) !important;
          background: #1a1a1a !important;
        }
      `}</style>

      {isAdmin && (
        <button
          onClick={skipToDestination}
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 50,
            background: '#1a1a1a',
            border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Skip (Admin)
        </button>
      )}

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
            maxWidth: '552px',
            width: '100%',
            padding: '2.25rem',
          }}
        >
          {/* ── SELECTING ─────────────────────────────────────── */}
          {flowState === 'selecting' && (
            <>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '24px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    background: '#1a1a1a',
                    border: '0.5px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Link2 size={23} color="rgba(255,255,255,0.55)" strokeWidth={1.5} />
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '17px',
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
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    Complete one task to access the link
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: '0.5px',
                  background: 'rgba(255,255,255,0.07)',
                  marginBottom: '24px',
                }}
              />

              {/* Section label */}
              <p
                style={{
                  margin: '0 0 14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                Choose a task
              </p>

              {/* Task list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {tasks.map((task) => {
                  const isSelected = selectedTask.id === task.id
                  const isWorkink = task.task_type === 'workink'
                  const isLocked = isWorkink && countdown > 0
                  return (
                    <div key={task.id}>
                      <div
                        className={isLocked ? undefined : 'task-card'}
                        onClick={() => { if (!isLocked) handleTaskSelect(task) }}
                        style={{
                          background: isSelected ? 'rgba(99,179,237,0.04)' : '#161616',
                          border: isSelected
                            ? '0.5px solid rgba(99,179,237,0.5)'
                            : '0.5px solid rgba(255,255,255,0.07)',
                          borderRadius: '14px',
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '14px',
                          opacity: isLocked ? 0.45 : 1,
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          transition: 'opacity 0.4s ease',
                        }}
                      >
                        {/* Logo block */}
                        <div
                          style={{
                            width: '37px',
                            height: '37px',
                            background: '#1e1e1e',
                            border: '0.5px solid rgba(255,255,255,0.07)',
                            borderRadius: '9px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '1px',
                          }}
                        >
                          {renderIcon(
                            task.icon,
                            task.task_type === 'workink' ? 'Play' : 'Download',
                            { size: 16, color: 'rgba(255,255,255,0.5)', strokeWidth: 1.5 }
                          )}
                        </div>

                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '15px',
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
                                fontSize: '14px',
                                color: 'rgba(255,255,255,0.35)',
                                lineHeight: '1.45',
                              }}
                            >
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Right side */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '4px',
                            flexShrink: 0,
                            marginTop: '1px',
                          }}
                        >
                          {isLocked ? (
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: 400,
                                color: 'rgba(255,255,255,0.3)',
                                fontVariantNumeric: 'tabular-nums',
                                minWidth: '28px',
                                textAlign: 'right',
                              }}
                            >
                              {countdown}s
                            </span>
                          ) : (
                            <>
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
                              <div
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  border: isSelected
                                    ? '5px solid rgba(99,179,237,0.9)'
                                    : '1.5px solid rgba(255,255,255,0.2)',
                                  background: 'transparent',
                                  flexShrink: 0,
                                }}
                              />
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  )
                })}
              </div>

              {/* CTA */}
              {(() => {
                const isWorkinkLocked = selectedTask.task_type === 'workink' && countdown > 0
                return (
                  <button
                    className={isWorkinkLocked ? undefined : 'cta-btn'}
                    onClick={isWorkinkLocked ? undefined : handleContinue}
                    disabled={isWorkinkLocked}
                    style={{
                      width: '100%',
                      background: isWorkinkLocked ? 'rgba(255,255,255,0.05)' : '#ffffff',
                      color: isWorkinkLocked ? 'rgba(255,255,255,0.22)' : '#0a0a0a',
                      border: isWorkinkLocked ? '0.5px solid rgba(255,255,255,0.07)' : 'none',
                      borderRadius: '14px',
                      padding: '15px',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: isWorkinkLocked ? 'not-allowed' : 'pointer',
                      marginBottom: '18px',
                      fontFamily: 'inherit',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {isWorkinkLocked ? `Available in ${countdown}s` : `Continue with ${selectedTask.name}`}
                  </button>
                )
              })()}

              {/* Footer note */}
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
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

          {/* ── MYLEAD / CPAGRIP WAITING ─────────────────────── */}
          {(flowState === 'mylead_waiting' || flowState === 'cpagrip_waiting') && (
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
                  lineHeight: '1.5',
                }}
              >
                Complete the offer in the new tab. This page will update automatically.
              </p>
            </div>
          )}

          {/* ── LINKS REVEALED ────────────────────────────────── */}
          {flowState === 'links_revealed' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    background: 'rgba(74,222,128,0.07)',
                    border: '0.5px solid rgba(74,222,128,0.18)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ExternalLink size={20} color="rgba(74,222,128,0.7)" strokeWidth={1.5} />
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '17px',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.88)',
                    }}
                  >
                    Your Links
                  </p>
                  <p
                    style={{
                      margin: '3px 0 0',
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    All links are now unlocked.
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: '0.5px',
                  background: 'rgba(255,255,255,0.07)',
                  marginBottom: '16px',
                }}
              />

              {/* Link buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {destinationLinks.map((dl, i) => (
                  <a
                    key={i}
                    href={dl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dest-link-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#161616',
                      border: '0.5px solid rgba(255,255,255,0.09)',
                      borderRadius: '14px',
                      padding: '16px 18px',
                      color: 'rgba(255,255,255,0.85)',
                      textDecoration: 'none',
                      fontSize: '15px',
                      fontWeight: 600,
                    }}
                  >
                    <span>{dl.label}</span>
                    <ExternalLink size={16} color="rgba(255,255,255,0.4)" strokeWidth={1.5} />
                  </a>
                ))}
              </div>

              {/* Footer */}
              <p
                style={{
                  marginTop: '16px',
                  marginBottom: 0,
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.25)',
                  textAlign: 'center',
                }}
              >
                Click any link to open it in a new tab.
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
