import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const session_id = searchParams.get('session_id')

  if (!session_id) {
    return NextResponse.json({ error: 'missing_session_id' }, { status: 400 })
  }

  const supabase = getServerClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('status, link_id')
    .eq('session_id', session_id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 })
  }

  if (session.status === 'completed') {
    const { data: link } = await supabase
      .from('links')
      .select('destination_url')
      .eq('id', session.link_id)
      .single()

    return NextResponse.json({ status: 'completed', destination_url: link?.destination_url ?? null })
  }

  return NextResponse.json({ status: 'pending' })
}
