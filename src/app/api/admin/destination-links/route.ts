import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'
import { verifyToken, ADMIN_COOKIE } from '@/lib/auth'

export const runtime = 'nodejs'

async function checkAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value
  if (!token) return false
  return verifyToken(token)
}

export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const linkId = searchParams.get('linkId')
  if (!linkId) {
    return NextResponse.json({ error: 'missing_link_id' }, { status: 400 })
  }

  const supabase = getServerClient()
  const { data, error } = await supabase
    .from('destination_links')
    .select('label, url')
    .eq('link_id', linkId)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ destinationLinks: data ?? [] })
}
