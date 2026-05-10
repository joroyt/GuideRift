import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json()
    if (!session_id) return NextResponse.json({ ok: true })

    const supabase = getServerClient()
    await supabase
      .from('sessions')
      .update({ status: 'cancelled' })
      .eq('session_id', session_id)
      .eq('status', 'pending') // only cancel if still pending

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[session/cancel]', err)
    return NextResponse.json({ ok: true }) // always succeed from client's perspective
  }
}
