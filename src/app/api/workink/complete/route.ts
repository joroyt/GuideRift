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

  const { data: destLinks } = await supabase
    .from('destination_links')
    .select('label, url')
    .eq('link_id', linkId)
    .order('sort_order', { ascending: true })

  if (!destLinks || destLinks.length <= 1) {
    return NextResponse.redirect(destLinks?.[0]?.url ?? dest, { status: 302 })
  }

  const { data: link } = await supabase
    .from('links')
    .select('slug')
    .eq('id', linkId)
    .single()

  if (!link?.slug) {
    return NextResponse.redirect(dest, { status: 302 })
  }

  const origin = new URL(req.url).origin
  return NextResponse.redirect(`${origin}/${link.slug}?unlocked=1`, { status: 302 })
}
