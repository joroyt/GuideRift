import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const linkId = searchParams.get('linkId')
  const taskId = searchParams.get('taskId')
  const dest = searchParams.get('dest')

  if (!linkId || !taskId || !dest) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 })
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    ''

  const supabase = getServerClient()
  if (!req.cookies.get('admin_token')?.value) {
    supabase
      .from('analytics_events')
      .insert({ link_id: linkId, task_id: taskId, event_type: 'task_completed', ip_address: ip })
      .then(({ error }) => {
        if (error) console.error('[workink/complete] Analytics error:', error)
      })
  }

  return NextResponse.redirect(decodeURIComponent(dest), { status: 302 })
}
