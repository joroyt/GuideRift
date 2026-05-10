import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { session_id, link_id, task_id } = body

    if (!session_id || !link_id || !task_id) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
    }

    const ip = getIp(req)
    const supabase = getServerClient()

    // Rate limit: max 3 sessions per IP per link in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('link_id', link_id)
      .eq('ip_address', ip)
      .gte('created_at', oneHourAgo)

    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }

    const expiresAt = new Date(Date.now() + 25 * 1000).toISOString()

    const { error } = await supabase.from('sessions').insert({
      session_id,
      link_id,
      task_id,
      ip_address: ip,
      status: 'pending',
      expires_at: expiresAt,
    })

    if (error) {
      // Duplicate session_id — refuse silently
      if (error.code === '23505') {
        return NextResponse.json({ error: 'duplicate_session' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[session/create]', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
