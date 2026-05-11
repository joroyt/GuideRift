import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { link_id, task_id } = body

  if (!link_id || !task_id) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 })
  }

  const supabase = getServerClient()

  const { data: link } = await supabase
    .from('links')
    .select('id')
    .eq('id', link_id)
    .eq('is_active', true)
    .single()

  if (!link) {
    return NextResponse.json({ error: 'link_not_found' }, { status: 404 })
  }

  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', task_id)
    .eq('is_active', true)
    .single()

  if (!task) {
    return NextResponse.json({ error: 'task_not_found' }, { status: 404 })
  }

  const session_id = uuidv4()
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    ''

  const { error } = await supabase
    .from('sessions')
    .insert({ session_id, link_id, task_id, ip_address: ip, status: 'pending' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  supabase
    .from('analytics_events')
    .insert({ link_id, task_id, event_type: 'task_started', ip_address: ip })
    .then(({ error: e }) => {
      if (e) console.error('[session/create] Analytics error:', e)
    })

  return NextResponse.json({ session_id }, { status: 201 })
}
