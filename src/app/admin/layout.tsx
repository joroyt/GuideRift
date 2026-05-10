'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/admin/links', label: 'Links' },
  { href: '/admin/tasks', label: 'Tasks' },
  { href: '/admin/analytics', label: 'Analytics' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname === '/admin/login') return <>{children}</>

  const handleLogout = async () => {
    await fetch('/admin/api/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f0f',
        display: 'flex',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: '200px',
          flexShrink: 0,
          background: '#0a0a0a',
          borderRight: '0.5px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
        }}
      >
        <div
          style={{
            padding: '0 20px 20px',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
            marginBottom: '16px',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '-0.01em',
            }}
          >
            Admin
          </span>
        </div>
        <nav style={{ flex: 1, padding: '0 10px' }}>
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'block',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: active ? 500 : 400,
                  color: active ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.4)',
                  background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                  textDecoration: 'none',
                  marginBottom: '2px',
                  transition: 'all 0.12s ease',
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div style={{ padding: '0 10px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.3)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              transition: 'color 0.12s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: '32px 36px',
          overflowY: 'auto',
        }}
      >
        {children}
      </main>
    </div>
  )
}
