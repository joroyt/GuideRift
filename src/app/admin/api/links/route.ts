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
  if (!(await checkAuth(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const supabase = getServerClient()
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, slug, destination_url, is_active = true, tasks = [] } = body

  if (!title || !slug || !destination_url) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const supabase = getServerClient()

  // Insert link
  const { data: link, error: linkError } = await supabase
    .from('links')
    .insert({ title, slug: slug.trim().toLowerCase(), destination_url, is_active })
    .select()
    .single()

  if (linkError) {
    if (linkError.code === '23505') {
      return NextResponse.json({ error: 'slug_taken' }, { status: 409 })
    }
    return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  // Insert link_tasks
  if (tasks.length > 0) {
    const linkTaskRows = tasks.map((t: { task_id: string; sort_order: number; is_recommended: boolean }) => ({
      link_id: link.id,
      task_id: t.task_id,
      sort_order: t.sort_order,
      is_recommended: t.is_recommended,
    }))
    await supabase.from('link_tasks').insert(linkTaskRows)
  }

  return NextResponse.json(link, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, tasks, ...fields } = body

  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  const supabase = getServerClient()

  // Update link fields
  if (Object.keys(fields).length > 0) {
    const { error } = await supabase.from('links').update(fields).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Replace link_tasks if provided
  if (Array.isArray(tasks)) {
    await supabase.from('link_tasks').delete().eq('link_id', id)
    if (tasks.length > 0) {
      const rows = tasks.map((t: { task_id: string; sort_order: number; is_recommended: boolean }) => ({
        link_id: id,
        task_id: t.task_id,
        sort_order: t.sort_order,
        is_recommended: t.is_recommended,
      }))
      await supabase.from('link_tasks').insert(rows)
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  const supabase = getServerClient()
  const { error } = await supabase.from('links').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
