import { notFound } from 'next/navigation'
import { getServerClient } from '@/lib/supabase'
import LinkCard from './LinkCard'

export const dynamic = 'force-dynamic'

export interface TaskOption {
  id: string
  name: string
  description: string | null
  affiliate_url: string | null
  task_type: string
  is_recommended: boolean
  sort_order: number
}

export interface LinkData {
  id: string
  title: string
  slug: string
}

async function getLinkWithTasks(slug: string): Promise<{
  link: LinkData
  tasks: TaskOption[]
} | null> {
  const supabase = getServerClient()

  const { data: link } = await supabase
    .from('links')
    .select('id, title, slug, is_active')
    .eq('slug', slug)
    .single()

  if (!link || !link.is_active) return null

  const { data: linkTasks } = await supabase
    .from('link_tasks')
    .select(`
      sort_order,
      is_recommended,
      tasks (
        id, name, description, affiliate_url, task_type, is_active
      )
    `)
    .eq('link_id', link.id)
    .order('sort_order', { ascending: true })

  const tasks: TaskOption[] = (linkTasks || [])
    .filter((lt: any) => lt.tasks?.is_active)
    .map((lt: any) => ({
      id: lt.tasks.id,
      name: lt.tasks.name,
      description: lt.tasks.description,
      affiliate_url: lt.tasks.affiliate_url,
      task_type: lt.tasks.task_type ?? 'cpi',
      is_recommended: lt.is_recommended,
      sort_order: lt.sort_order,
    }))

  return { link: { id: link.id, title: link.title, slug: link.slug }, tasks }
}

export default async function SlugPage({
  params,
}: {
  params: { slug: string }
}) {
  const data = await getLinkWithTasks(params.slug)

  if (!data) notFound()

  const { link, tasks } = data

  if (tasks.length === 0) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #090909 0%, #131313 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <div
          style={{
            background: '#111111',
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>
            No tasks are available for this link right now. Check back later.
          </p>
        </div>
      </main>
    )
  }

  return <LinkCard link={link} tasks={tasks} />
}
