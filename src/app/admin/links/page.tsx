'use client'

import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, Trash2, Plus } from 'lucide-react'

interface DestinationLink {
  id?: string
  label: string
  url: string
  sort_order: number
}

interface Link {
  id: string
  title: string
  slug: string
  is_active: boolean
  created_at: string
  destination_links?: DestinationLink[]
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
  const [fLinks, setFLinks] = useState<{ label: string; url: string }[]>([{ label: 'Download', url: '' }])
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
    setFLinks([{ label: 'Download', url: '' }])
    setFActive(true)
    setSlugManual(false)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (link: Link) => {
    setEditingLink(link)
    setFTitle(link.title)
    setFSlug(link.slug)
    const dl = link.destination_links
    setFLinks(
      dl && dl.length > 0
        ? [...dl]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((d) => ({ label: d.label, url: d.url }))
        : [{ label: 'Download', url: '' }]
    )
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

  const addDestLink = () => setFLinks([...fLinks, { label: '', url: '' }])
  const removeDestLink = (i: number) => setFLinks(fLinks.filter((_, idx) => idx !== i))
  const updateDestLink = (i: number, field: 'label' | 'url', value: string) =>
    setFLinks(fLinks.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))

  const handleSave = async () => {
    if (!fTitle.trim() || !fSlug.trim()) {
      setFormError('Title and slug are required.')
      return
    }
    if (fLinks.length === 0) {
      setFormError('At least one destination link is required.')
      return
    }
    if (fLinks.some((l) => !l.label.trim() || !l.url.trim())) {
      setFormError('All destination links must have a label and URL.')
      return
    }
    setSaving(true)
    setFormError('')

    const body = {
      title: fTitle.trim(),
      slug: fSlug.trim(),
      is_active: fActive,
      destinationLinks: fLinks.map((l, i) => ({
        label: l.label.trim(),
        url: l.url.trim(),
        sort_order: i,
      })),
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
    if (!confirm('Delete this page?')) return
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

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>
          Pages
        </h1>
        <button
          onClick={openNew}
          style={{ ...btnBase, background: '#ffffff', color: '#0a0a0a', padding: '8px 16px', fontSize: '13px' }}
        >
          New page
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
            {editingLink ? 'Edit page' : 'New page'}
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Page Title */}
            <div>
              <label style={labelStyle}>Page Title</label>
              <input
                style={inputStyle}
                value={fTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>

            {/* Page Slug */}
            <div>
              <label style={labelStyle}>Page Slug</label>
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
                  style={{ ...inputStyle, paddingLeft: '20px' }}
                  value={fSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                />
              </div>
            </div>

            {/* Destination Links */}
            <div>
              <label style={labelStyle}>Destination Links</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {fLinks.map((lnk, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      style={{ ...inputStyle, width: '140px', flexShrink: 0 }}
                      value={lnk.label}
                      placeholder="Label"
                      onChange={(e) => updateDestLink(i, 'label', e.target.value)}
                    />
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      value={lnk.url}
                      placeholder="https://..."
                      onChange={(e) => updateDestLink(i, 'url', e.target.value)}
                    />
                    {fLinks.length > 1 && (
                      <button
                        onClick={() => removeDestLink(i)}
                        style={{
                          ...btnBase,
                          background: 'rgba(248,113,113,0.08)',
                          color: 'rgba(248,113,113,0.6)',
                          padding: '7px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addDestLink}
                style={{
                  ...btnBase,
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.4)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={12} />
                Add Link
              </button>
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
              {saving ? 'Saving...' : editingLink ? 'Save changes' : 'Create page'}
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

      {/* Pages table */}
      {loading ? (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Loading...</p>
      ) : links.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>No pages yet.</p>
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
                        title="Copy URL"
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
