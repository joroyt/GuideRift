import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { getServerClient } from '@/lib/supabase'
import { getCountryFromRequest } from '@/lib/geo'
import { selectTasksForCountry } from '@/lib/tasks'
import LinkCard from './LinkCard'

export const dynamic = 'force-dynamic'

export type { TaskOption } from '@/lib/tasks'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const supabase = getServerClient()
  const { data } = await supabase
    .from('links')
    .select('title')
    .eq('slug', params.slug)
    .single()

  return { title: data?.title ?? 'Download' }
}

export interface LinkData {
  id: string
  title: string
  slug: string
}

export type DestinationLink = { label: string; url: string }

async function getLinkWithTasks(slug: string): Promise<{
  link: LinkData
  tasks: Awaited<ReturnType<typeof selectTasksForCountry>>
  destinationLinkCount: number
} | null> {
  const supabase = getServerClient()

  const { data: link } = await supabase
    .from('links')
    .select('id, title, slug, is_active')
    .eq('slug', slug)
    .single()

  if (!link || !link.is_active) return null

  const country = getCountryFromRequest()

  const [tasks, { count }] = await Promise.all([
    selectTasksForCountry(country),
    supabase
      .from('destination_links')
      .select('id', { count: 'exact', head: true })
      .eq('link_id', link.id),
  ])

  return {
    link: { id: link.id, title: link.title, slug: link.slug },
    tasks,
    destinationLinkCount: count ?? 0,
  }
}

export default async function SlugPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const data = await getLinkWithTasks(params.slug)

  if (!data) notFound()

  const { link, tasks, destinationLinkCount } = data
  const isAdmin = !!(cookies().get('admin_token')?.value)
  const unlockedViaWorkink = searchParams.unlocked === '1'

  let initialDestinationLinks: DestinationLink[] = []
  if (unlockedViaWorkink) {
    const supabase = getServerClient()
    const { data: destLinks } = await supabase
      .from('destination_links')
      .select('label, url')
      .eq('link_id', link.id)
      .order('sort_order', { ascending: true })
    initialDestinationLinks = destLinks ?? []
  }

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

  return <LinkCard link={link} tasks={tasks} isAdmin={isAdmin} destinationLinkCount={destinationLinkCount} unlockedViaWorkink={unlockedViaWorkink} initialDestinationLinks={initialDestinationLinks} />
}
