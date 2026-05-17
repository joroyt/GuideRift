import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'

const WORKINK_LINK_URL = 'https://work.ink/1U29/content-gate'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { slug, taskId } = body

  if (!slug || !taskId) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 })
  }

  const supabase = getServerClient()

  const { data: link } = await supabase
    .from('links')
    .select('id, is_active')
    .eq('slug', slug)
    .single()

  if (!link || !link.is_active) {
    return NextResponse.json({ error: 'link_not_found' }, { status: 404 })
  }

  const { data: firstDestLink } = await supabase
    .from('destination_links')
    .select('url')
    .eq('link_id', link.id)
    .order('sort_order', { ascending: true })
    .limit(1)
    .single()

  if (!firstDestLink?.url) {
    return NextResponse.json({ error: 'no_destination' }, { status: 404 })
  }

  let sr: string
  try {
    const completionUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/workink/complete?linkId=${link.id}&taskId=${taskId}&dest=${encodeURIComponent(firstDestLink.url)}`
    const workinkRes = await fetch(
      `https://work.ink/_api/v2/override?destination=${encodeURIComponent(completionUrl)}`
    )
    if (!workinkRes.ok) {
      throw new Error(`Work.ink API returned ${workinkRes.status}`)
    }
    const workinkJson = await workinkRes.json()
    sr = workinkJson.sr
    if (!sr) throw new Error('No sr in Work.ink response')
  } catch (err) {
    console.error('[workink/redirect] Override API error:', err)
    return NextResponse.json({ error: 'workink_api_failed' }, { status: 500 })
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    ''

  supabase
    .from('analytics_events')
    .insert({ link_id: link.id, task_id: taskId, event_type: 'task_started', ip_address: ip })
    .then(({ error }) => {
      if (error) console.error('[workink/redirect] Analytics error:', error)
    })

  const url = `${WORKINK_LINK_URL}?sr=${encodeURIComponent(sr)}`
  console.log('[workink/redirect] Redirecting to:', url)
  return NextResponse.json({ url })
}
