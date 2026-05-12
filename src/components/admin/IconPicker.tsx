'use client'

import { useState, useMemo } from 'react'
import { ICON_NAMES, renderIcon } from '@/lib/icons'

interface IconPickerProps {
  value: string
  onChange: (name: string) => void
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

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => ICON_NAMES.filter((n) => n.toLowerCase().includes(search.toLowerCase())),
    [search]
  )

  return (
    <div>
      {/* Current selection row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            background: '#1a1a1a',
            border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {renderIcon(value, 'Download', { size: 16, color: 'rgba(255,255,255,0.7)', strokeWidth: 1.5 })}
        </div>
        <span
          style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', flex: 1 }}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => { setOpen((o) => !o); setSearch('') }}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {open ? 'Close' : 'Change'}
        </button>
      </div>

      {/* Picker panel */}
      {open && (
        <div
          style={{
            marginTop: '10px',
            background: '#131313',
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '12px',
          }}
        >
          <input
            style={inputStyle}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search icons…"
            autoFocus
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '4px',
              maxHeight: '240px',
              overflowY: 'auto',
              marginTop: '10px',
            }}
          >
            {filtered.map((name) => (
              <div
                key={name}
                onClick={() => { onChange(name); setOpen(false); setSearch('') }}
                title={name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 4px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: value === name ? 'rgba(99,179,237,0.1)' : 'transparent',
                  border: `0.5px solid ${value === name ? 'rgba(99,179,237,0.3)' : 'transparent'}`,
                  transition: 'background 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (value !== name) {
                    ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== name) {
                    ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
                  }
                }}
              >
                {renderIcon(name, 'Download', { size: 16, color: 'rgba(255,255,255,0.65)', strokeWidth: 1.5 })}
                <span
                  style={{
                    fontSize: '8px',
                    color: 'rgba(255,255,255,0.35)',
                    textAlign: 'center',
                    lineHeight: '1.2',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                  }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
              No icons match &ldquo;{search}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  )
}
