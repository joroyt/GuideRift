import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'

const ALLOWED_EVENTS = new Set([
  'page_view',
  'task_selected',
  'task_started',
  'task_completed',
])

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  // Always return 200 — fire and forget
  try {
    const body = await req.json()
    const { event_type, link_id, task_id } = body

    if (!event_type || !ALLOWED_EVENTS.has(event_type) || !link_id) {
      return NextResponse.json({ ok: true })
    }

    const supabase = getServerClient()
    await supabase.from('analytics_events').insert({
      event_type,
      link_id,
      task_id: task_id || null,
      ip_address: getIp(req),
    })
  } catch {
    // swallow
  }

  return NextResponse.json({ ok: true })
}
