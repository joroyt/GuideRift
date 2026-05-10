import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ ready: false })
    }

    const supabase = getServerClient()

    const { data: session } = await supabase
      .from('sessions')
      .select('id, status, expires_at, used_at, link_id')
      .eq('session_id', sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ ready: false })
    }

    // Once used, always return not-ready to prevent replay
    if (session.used_at) {
      return NextResponse.json({ ready: false })
    }

    if (session.status !== 'pending') {
      return NextResponse.json({ ready: false })
    }

    // Timer must have expired
    if (!session.expires_at || new Date(session.expires_at) > new Date()) {
      return NextResponse.json({ ready: false })
    }

    // Fetch the destination URL from the link — never exposed until all checks pass
    const { data: link } = await supabase
      .from('links')
      .select('destination_url, is_active')
      .eq('id', session.link_id!)
      .single()

    if (!link || !link.is_active) {
      return NextResponse.json({ ready: false })
    }

    // Mark session as used (one-time)
    await supabase
      .from('sessions')
      .update({ used_at: new Date().toISOString(), status: 'completed' })
      .eq('session_id', sessionId)

    return NextResponse.json({ ready: true, url: link.destination_url })
  } catch (err) {
    console.error('[session/check]', err)
    return NextResponse.json({ ready: false })
  }
}
