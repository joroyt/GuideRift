import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'
import { verifyToken, ADMIN_COOKIE } from '@/lib/auth'

export const runtime = 'nodejs'

async function checkAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value
  if (!token) return false
  return verifyToken(token)
}

// GET /admin/api/links/tasks?link_id=xxx
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const link_id = searchParams.get('link_id')
  if (!link_id) return NextResponse.json([], { status: 200 })

  const supabase = getServerClient()
  const { data, error } = await supabase
    .from('link_tasks')
    .select('task_id, sort_order, is_recommended')
    .eq('link_id', link_id)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
