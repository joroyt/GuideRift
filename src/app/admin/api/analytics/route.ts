import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'
import { verifyToken, ADMIN_COOKIE } from '@/lib/auth'

export const runtime = 'nodejs'

async function checkAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value
  if (!token) return false
  return verifyToken(token)
}

function getStartDate(period: string): string | null {
  const now = new Date()
  if (period === '7d') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
  if (period === '30d') {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
  return null // all time
}

export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const since = searchParams.get('since')
  const until = searchParams.get('until')
  const period = searchParams.get('period') ?? '7d'
  const startDate = since ?? getStartDate(period)

  const supabase = getServerClient()

  let query = supabase
    .from('analytics_events')
    .select('event_type, link_id, task_id, links(title, slug), tasks(name, task_type)')

  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  if (until) {
    query = query.lte('created_at', until)
  }

  const { data: events, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = events ?? []

  // Global metrics
  const totalPageViews = rows.filter((e) => e.event_type === 'page_view').length
  const totalCompletions = rows.filter((e) => e.event_type === 'task_completed').length
  const completionRate = totalPageViews > 0 ? totalCompletions / totalPageViews : 0

  // Per-link breakdown
  const linkMap: Record<
    string,
    {
      title: string
      slug: string
      views: number
      starts: number
      completions: number
    }
  > = {}

  for (const e of rows) {
    if (!e.link_id) continue
    if (!linkMap[e.link_id]) {
      linkMap[e.link_id] = {
        title: (e.links as any)?.title ?? 'Unknown',
        slug: (e.links as any)?.slug ?? '',
        views: 0,
        starts: 0,
        completions: 0,
      }
    }
    if (e.event_type === 'page_view') linkMap[e.link_id].views++
    if (e.event_type === 'task_started') linkMap[e.link_id].starts++
    if (e.event_type === 'task_completed') linkMap[e.link_id].completions++
  }

  const perLink = Object.entries(linkMap).map(([id, d]) => ({
    id,
    ...d,
    completion_rate: d.views > 0 ? d.completions / d.views : 0,
  }))

  // Per-task breakdown
  const taskMap: Record<
    string,
    { name: string; task_type: string; shown: number; completed: number }
  > = {}

  for (const e of rows) {
    if (!e.task_id) continue
    if (!taskMap[e.task_id]) {
      taskMap[e.task_id] = {
        name: (e.tasks as any)?.name ?? 'Unknown',
        task_type: (e.tasks as any)?.task_type ?? 'workink',
        shown: 0,
        completed: 0,
      }
    }
    if (e.event_type === 'task_started') taskMap[e.task_id].shown++
    if (e.event_type === 'task_completed') taskMap[e.task_id].completed++
  }

  const perTask = Object.entries(taskMap).map(([id, d]) => ({
    id,
    ...d,
    completion_rate: d.shown > 0 ? d.completed / d.shown : 0,
  }))

  return NextResponse.json({
    totals: {
      page_views: totalPageViews,
      completions: totalCompletions,
      completion_rate: completionRate,
    },
    per_link: perLink,
    per_task: perTask,
  })
}
