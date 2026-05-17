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
    .select('*, destination_links(id, label, url, sort_order)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, slug, is_active = true, destinationLinks } = body

  if (!title || !slug) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  if (!destinationLinks || !Array.isArray(destinationLinks) || destinationLinks.length === 0) {
    return NextResponse.json({ error: 'missing_destination_links' }, { status: 400 })
  }

  const invalid = destinationLinks.find(
    (dl: { label?: string; url?: string }) => !dl.label?.trim() || !dl.url?.trim()
  )
  if (invalid) {
    return NextResponse.json({ error: 'invalid_destination_link' }, { status: 400 })
  }

  const supabase = getServerClient()

  const { data: link, error: linkError } = await supabase
    .from('links')
    .insert({ title, slug: slug.trim().toLowerCase(), is_active })
    .select()
    .single()

  if (linkError) {
    if (linkError.code === '23505') {
      return NextResponse.json({ error: 'slug_taken' }, { status: 409 })
    }
    return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  const rows = destinationLinks.map((dl: { label: string; url: string; sort_order?: number }, i: number) => ({
    link_id: link.id,
    label: dl.label.trim(),
    url: dl.url.trim(),
    sort_order: dl.sort_order ?? i,
  }))

  const { error: dlError } = await supabase.from('destination_links').insert(rows)
  if (dlError) return NextResponse.json({ error: dlError.message }, { status: 500 })

  return NextResponse.json(link, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, destinationLinks, ...fields } = body

  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  const supabase = getServerClient()

  if (Object.keys(fields).length > 0) {
    const { error } = await supabase.from('links').update(fields).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (destinationLinks !== undefined && Array.isArray(destinationLinks)) {
    const { error: deleteError } = await supabase
      .from('destination_links')
      .delete()
      .eq('link_id', id)
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    if (destinationLinks.length > 0) {
      const rows = destinationLinks.map(
        (dl: { label: string; url: string; sort_order?: number }, i: number) => ({
          link_id: id,
          label: dl.label.trim(),
          url: dl.url.trim(),
          sort_order: dl.sort_order ?? i,
        })
      )
      const { error: insertError } = await supabase.from('destination_links').insert(rows)
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
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
