import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'

const ACCEPTED_STATUSES = new Set(['pending', 'accepted', 'pre-approved'])

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const clickid = searchParams.get('clickid')
  const status = searchParams.get('status')

  if (!clickid || !status || !ACCEPTED_STATUSES.has(status)) {
    return new NextResponse('OK', { status: 200 })
  }

  const supabase = getServerClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('status, link_id, task_id')
    .eq('session_id', clickid)
    .single()

  if (!session || session.status === 'completed') {
    return new NextResponse('OK', { status: 200 })
  }

  await supabase
    .from('sessions')
    .update({ status: 'completed', used_at: new Date().toISOString() })
    .eq('session_id', clickid)

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    ''

  supabase
    .from('analytics_events')
    .insert({
      link_id: session.link_id,
      task_id: session.task_id,
      event_type: 'task_completed',
      ip_address: ip,
    })
    .then(({ error }) => {
      if (error) console.error('[mylead/postback] Analytics error:', error)
    })

  return new NextResponse('OK', { status: 200 })
}
