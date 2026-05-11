'use client'

import { useState, useEffect, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'

interface Link {
  id: string
  title: string
  slug: string
  destination_url: string
  is_active: boolean
  created_at: string
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
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

export default function AdminLinksPage() {
  const [links, setLinks] = useState<Link[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Form state
  const [fTitle, setFTitle] = useState('')
  const [fSlug, setFSlug] = useState('')
  const [fUrl, setFUrl] = useState('')
  const [fActive, setFActive] = useState(true)
  const [slugManual, setSlugManual] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/admin/api/links')
    setLinks(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setEditingLink(null)
    setFTitle('')
    setFSlug('')
    setFUrl('')
    setFActive(true)
    setSlugManual(false)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (link: Link) => {
    setEditingLink(link)
    setFTitle(link.title)
    setFSlug(link.slug)
    setFUrl(link.destination_url)
    setFActive(link.is_active)
    setSlugManual(true)
    setFormError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingLink(null)
  }

  const handleTitleChange = (v: string) => {
    setFTitle(v)
    if (!slugManual) setFSlug(slugify(v))
  }

  const handleSlugChange = (v: string) => {
    setFSlug(v)
    setSlugManual(true)
  }

  const handleSave = async () => {
    if (!fTitle.trim() || !fSlug.trim() || !fUrl.trim()) {
      setFormError('Title, slug, and destination URL are required.')
      return
    }
    setSaving(true)
    setFormError('')

    const body = {
      title: fTitle.trim(),
      slug: fSlug.trim(),
      destination_url: fUrl.trim(),
      is_active: fActive,
    }

    const res = editingLink
      ? await fetch('/admin/api/links', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingLink.id, ...body }),
        })
      : await fetch('/admin/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

    const json = await res.json()
    if (!res.ok) {
      setFormError(
        json.error === 'slug_taken'
          ? 'That slug is already taken.'
          : json.error || 'Something went wrong.'
      )
      setSaving(false)
      return
    }

    setSaving(false)
    closeForm()
    load()
  }

  const toggleActive = async (link: Link) => {
    await fetch('/admin/api/links', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: link.id, is_active: !link.is_active }),
    })
    load()
  }

  const handleCopy = (link: Link) => {
    navigator.clipboard.writeText(`${window.location.origin}/${link.slug}`)
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this link?')) return
    await fetch(`/admin/api/links?id=${id}`, { method: 'DELETE' })
    load()
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  }

  const input: React.CSSProperties = {
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

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>
          Links
        </h1>
        <button
          onClick={openNew}
          style={{ ...btnBase, background: '#ffffff', color: '#0a0a0a', padding: '8px 16px', fontSize: '13px' }}
        >
          New link
        </button>
      </div>

      {/* Form panel */}
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
            {editingLink ? 'Edit link' : 'New link'}
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Title */}
            <div>
              <label style={labelStyle}>Title</label>
              <input
                style={input}
                value={fTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>

            {/* Slug */}
            <div>
              <label style={labelStyle}>Slug</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.25)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  /
                </span>
                <input
                  style={{ ...input, paddingLeft: '20px' }}
                  value={fSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                />
              </div>
            </div>

            {/* Destination URL */}
            <div>
              <label style={labelStyle}>Destination URL</label>
              <input
                style={input}
                value={fUrl}
                onChange={(e) => setFUrl(e.target.value)}
              />
            </div>

            {/* Active toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Active</label>
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
              {saving ? 'Saving...' : editingLink ? 'Save changes' : 'Create link'}
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

      {/* Links table */}
      {loading ? (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Loading...</p>
      ) : links.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>No links yet.</p>
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
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Title</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Slug</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr
                  key={link.id}
                  style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    {link.title}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                    /{link.slug}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div
                      onClick={() => toggleActive(link)}
                      title={link.is_active ? 'Click to deactivate' : 'Click to activate'}
                      style={{
                        width: '32px',
                        height: '18px',
                        borderRadius: '9px',
                        background: link.is_active ? '#22c55e' : 'rgba(255,255,255,0.1)',
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
                          left: link.is_active ? '16px' : '2px',
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
                        onClick={() => handleCopy(link)}
                        title="Copy link"
                        style={{
                          ...btnBase,
                          background: 'rgba(255,255,255,0.06)',
                          color: copiedId === link.id ? 'rgba(74,222,128,0.8)' : 'rgba(255,255,255,0.55)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {copiedId === link.id ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                      <button
                        onClick={() => openEdit(link)}
                        style={{
                          ...btnBase,
                          background: 'rgba(255,255,255,0.06)',
                          color: 'rgba(255,255,255,0.55)',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
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
