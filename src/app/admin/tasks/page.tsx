'use client'

import { useState, useEffect, useCallback } from 'react'

interface Task {
  id: string
  name: string
  description: string | null
  affiliate_url: string | null
  task_type: string
  payout_estimate: number
  is_active: boolean
  created_at: string
  allowed_countries: string[] | null
  commission_eur: number | null
  cpagrip_password: string | null
}

const btnBase: React.CSSProperties = {
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'opacity 0.15s ease',
  borderRadius: '8px',
  fontSize: '12px',
  padding: '6px 12px',
  fontWeight: 500,
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 500,
  color: 'rgba(255,255,255,0.4)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#1a1a1a',
  border: '0.5px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '9px 12px',
  fontSize: '13px',
  color: 'rgba(255,255,255,0.85)',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const helperText: React.CSSProperties = {
  margin: '5px 0 0',
  fontSize: '11px',
  color: 'rgba(255,255,255,0.25)',
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Form state
  const [fName, setFName] = useState('')
  const [fDesc, setFDesc] = useState('')
  const [fUrl, setFUrl] = useState('')
  const [fActive, setFActive] = useState(true)
  const [fTaskType, setFTaskType] = useState('workink')
  const [fCountries, setFCountries] = useState('')
  const [fCommission, setFCommission] = useState('')
  const [fCpagripPassword, setFCpagripPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/admin/api/tasks')
    setTasks(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setEditingTask(null)
    setFName('')
    setFDesc('')
    setFUrl('')
    setFActive(true)
    setFTaskType('workink')
    setFCountries('')
    setFCommission('')
    setFCpagripPassword('')
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (task: Task) => {
    setEditingTask(task)
    setFName(task.name)
    setFDesc(task.description ?? '')
    setFUrl(task.affiliate_url ?? '')
    setFActive(task.is_active)
    setFTaskType(task.task_type ?? 'workink')
    setFCountries(task.allowed_countries ? task.allowed_countries.join(', ') : '')
    setFCommission(task.commission_eur != null ? String(task.commission_eur) : '')
    setFCpagripPassword(task.cpagrip_password ?? '')
    setFormError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingTask(null)
  }

  const handleSave = async () => {
    if (!fName.trim()) {
      setFormError('Name is required.')
      return
    }
    setSaving(true)
    setFormError('')

    const isPaidType = fTaskType === 'mylead' || fTaskType === 'cpagrip'

    const allowed_countries =
      isPaidType && fCountries.trim()
        ? fCountries.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean)
        : null

    const commission_eur =
      isPaidType && fCommission.trim()
        ? parseFloat(fCommission) || null
        : null

    const body = {
      name: fName.trim(),
      description: fDesc.trim() || null,
      affiliate_url: fTaskType === 'workink' ? null : (fUrl.trim() || null),
      payout_estimate: 0,
      is_active: fActive,
      task_type: fTaskType,
      allowed_countries,
      commission_eur,
      cpagrip_password: fTaskType === 'cpagrip' ? (fCpagripPassword.trim() || null) : null,
    }

    const res = editingTask
      ? await fetch('/admin/api/tasks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTask.id, ...body }),
        })
      : await fetch('/admin/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

    const json = await res.json()
    if (!res.ok) {
      setFormError(json.error || 'Something went wrong.')
      setSaving(false)
      return
    }

    setSaving(false)
    closeForm()
    load()
  }

  const toggleActive = async (task: Task) => {
    await fetch('/admin/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, is_active: !task.is_active }),
    })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task? It will be removed from all link pages.')) return
    await fetch(`/admin/api/tasks?id=${id}`, { method: 'DELETE' })
    load()
  }

  const truncate = (s: string | null, n = 50) =>
    !s ? '—' : s.length > n ? s.slice(0, n) + '…' : s

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>
          Tasks
        </h1>
        <button
          onClick={openNew}
          style={{ ...btnBase, background: '#ffffff', color: '#0a0a0a', padding: '8px 16px', fontSize: '13px' }}
        >
          New task
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div
          style={{
            background: '#161616',
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
            {editingTask ? 'Edit task' : 'New task'}
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={label}>Name</label>
              <input
                style={inputStyle}
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                placeholder="Install Chrome"
              />
            </div>
            <div>
              <label style={label}>Type</label>
              <select
                style={{ ...inputStyle, appearance: 'none' }}
                value={fTaskType}
                onChange={(e) => setFTaskType(e.target.value)}
              >
                <option value="workink">Watch Ads</option>
                <option value="mylead">MyLead</option>
                <option value="cpagrip">CPAGrip</option>
              </select>
            </div>
            <div>
              <label style={label}>Description</label>
              <input
                style={inputStyle}
                value={fDesc}
                onChange={(e) => setFDesc(e.target.value)}
                placeholder="Download and install Google Chrome"
              />
            </div>

            {fTaskType === 'workink' ? (
              <div>
                <label style={label}>Affiliate URL</label>
                <input
                  style={{ ...inputStyle, opacity: 0.4, cursor: 'not-allowed' }}
                  value=""
                  disabled
                  placeholder="Not needed for Watch Ads"
                />
              </div>
            ) : (
              <>
                <div>
                  <label style={label}>Affiliate URL</label>
                  <input
                    style={inputStyle}
                    value={fUrl}
                    onChange={(e) => setFUrl(e.target.value)}
                    placeholder={fTaskType === 'cpagrip' ? 'https://singingfiles.com/show.php?l=0&u=...' : 'https://mylead.global/aff/...'}
                  />
                  <p style={helperText}>
                    {fTaskType === 'cpagrip'
                      ? 'Enter offer URL without tracking_id — &tracking_id= will be added automatically.'
                      : 'Enter offer URL without tracking parameters — ?ml_sub1 will be added automatically.'}
                  </p>
                </div>
                <div>
                  <label style={label}>Allowed Countries</label>
                  <input
                    style={inputStyle}
                    value={fCountries}
                    onChange={(e) => setFCountries(e.target.value)}
                    placeholder="NL, BE, DE"
                  />
                  <p style={helperText}>Leave empty for all countries. Comma-separated ISO codes (e.g. NL, BE, DE).</p>
                </div>
                <div>
                  <label style={label}>Commission (EUR)</label>
                  <input
                    style={inputStyle}
                    type="number"
                    step="0.01"
                    min="0"
                    value={fCommission}
                    onChange={(e) => setFCommission(e.target.value)}
                    placeholder="1.32"
                  />
                </div>
                {fTaskType === 'cpagrip' && (
                  <div>
                    <label style={label}>Postback Password (Optional)</label>
                    <input
                      style={inputStyle}
                      value={fCpagripPassword}
                      onChange={(e) => setFCpagripPassword(e.target.value)}
                      placeholder="mySecretPassword"
                    />
                    <p style={helperText}>Must match the password set in your CPAGrip Global Postback settings.</p>
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ ...label, marginBottom: 0 }}>Active</label>
              <div
                onClick={() => setFActive(!fActive)}
                style={{
                  width: '36px',
                  height: '20px',
                  borderRadius: '10px',
                  background: fActive ? '#22c55e' : 'rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: fActive ? '19px' : '3px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {formError && (
            <p style={{ margin: '14px 0 0', fontSize: '12px', color: 'rgba(248,113,113,0.9)' }}>
              {formError}
            </p>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                ...btnBase,
                background: saving ? 'rgba(255,255,255,0.08)' : '#ffffff',
                color: saving ? 'rgba(255,255,255,0.3)' : '#0a0a0a',
                padding: '9px 18px',
                fontSize: '13px',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : editingTask ? 'Save changes' : 'Create task'}
            </button>
            <button
              onClick={closeForm}
              style={{
                ...btnBase,
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.5)',
                padding: '9px 18px',
                fontSize: '13px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Loading...</p>
      ) : tasks.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>No tasks yet.</p>
      ) : (
        <div
          style={{
            background: '#161616',
            border: '0.5px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '0.5px solid rgba(255,255,255,0.07)',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.35)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Countries</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Active</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
                    {task.name}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        ...(task.task_type === 'workink'
                          ? { color: 'rgba(251,191,36,0.9)', background: 'rgba(251,191,36,0.1)', border: '0.5px solid rgba(251,191,36,0.25)' }
                          : task.task_type === 'cpagrip'
                            ? { color: 'rgba(52,211,153,0.9)', background: 'rgba(52,211,153,0.1)', border: '0.5px solid rgba(52,211,153,0.25)' }
                            : { color: 'rgba(99,179,237,0.9)', background: 'rgba(99,179,237,0.1)', border: '0.5px solid rgba(99,179,237,0.25)' }),
                      }}
                    >
                      {task.task_type === 'workink'
                        ? 'Watch Ads'
                        : task.task_type === 'cpagrip'
                          ? task.commission_eur != null
                            ? `CPAGrip • €${Number(task.commission_eur).toFixed(2)}`
                            : 'CPAGrip'
                          : task.commission_eur != null
                            ? `MyLead • €${Number(task.commission_eur).toFixed(2)}`
                            : 'MyLead'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                    {task.task_type === 'mylead' || task.task_type === 'cpagrip'
                      ? (task.allowed_countries && task.allowed_countries.length > 0
                          ? task.allowed_countries.join(', ')
                          : 'Global')
                      : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                    {truncate(task.description)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div
                      onClick={() => toggleActive(task)}
                      title={task.is_active ? 'Click to deactivate' : 'Click to activate'}
                      style={{
                        width: '32px',
                        height: '18px',
                        borderRadius: '9px',
                        background: task.is_active ? '#22c55e' : 'rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s ease',
                        display: 'inline-block',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: '2px',
                          left: task.is_active ? '16px' : '2px',
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: '#fff',
                          transition: 'left 0.2s ease',
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEdit(task)}
                        style={{
                          ...btnBase,
                          background: 'rgba(255,255,255,0.06)',
                          color: 'rgba(255,255,255,0.55)',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        style={{
                          ...btnBase,
                          background: 'rgba(248,113,113,0.08)',
                          color: 'rgba(248,113,113,0.8)',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
