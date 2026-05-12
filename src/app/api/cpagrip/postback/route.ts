import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const tracking_id = formData.get('tracking_id') as string | null
  const password = formData.get('password') as string | null

  if (!tracking_id) {
    return new NextResponse('OK', { status: 200 })
  }

  const supabase = getServerClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('status, link_id, task_id')
    .eq('session_id', tracking_id)
    .single()

  if (!session || session.status === 'completed') {
    return new NextResponse('OK', { status: 200 })
  }

  const { data: task } = await supabase
    .from('tasks')
    .select('cpagrip_password')
    .eq('id', session.task_id)
    .single()

  if (task?.cpagrip_password) {
    if (task.cpagrip_password !== password) {
      console.warn('[cpagrip/postback] Password mismatch for session:', tracking_id)
      return new NextResponse('OK', { status: 200 })
    }
  }

  await supabase
    .from('sessions')
    .update({ status: 'completed', used_at: new Date().toISOString() })
    .eq('session_id', tracking_id)

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
      if (error) console.error('[cpagrip/postback] Analytics error:', error)
    })

  return new NextResponse('OK', { status: 200 })
}
