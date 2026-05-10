'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/admin/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/admin/links')
    } else {
      setError('Incorrect password.')
      setLoading(false)
    }
  }

  return (
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
          maxWidth: '360px',
          width: '100%',
          padding: '2rem',
        }}
      >
        <h1
          style={{
            margin: '0 0 4px',
            fontSize: '16px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          Admin
        </h1>
        <p
          style={{
            margin: '0 0 24px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          Enter your password to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            style={{
              width: '100%',
              background: '#161616',
              border: '0.5px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '11px 14px',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.85)',
              outline: 'none',
              marginBottom: '12px',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <p
              style={{
                margin: '0 0 10px',
                fontSize: '12px',
                color: 'rgba(248,113,113,0.9)',
              }}
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              background: loading || !password ? 'rgba(255,255,255,0.08)' : '#ffffff',
              color: loading || !password ? 'rgba(255,255,255,0.3)' : '#0a0a0a',
              border: 'none',
              borderRadius: '10px',
              padding: '11px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
