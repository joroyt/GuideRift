import { getServerClient } from './supabase'

export interface TaskOption {
  id: string
  name: string
  description: string | null
  affiliate_url: string | null
  task_type: string
  is_recommended: boolean
  sort_order: number
  allowed_countries: string[] | null
  commission_eur: number | null
}

export async function selectTasksForCountry(country: string | null): Promise<TaskOption[]> {
  const supabase = getServerClient()

  const { data: myleadTasks } = await supabase
    .from('tasks')
    .select('id, name, description, affiliate_url, task_type, allowed_countries, commission_eur')
    .eq('task_type', 'mylead')
    .eq('is_active', true)

  const filtered = ((myleadTasks ?? []) as any[]).filter((task) => {
    if (!task.allowed_countries || task.allowed_countries.length === 0) return true
    if (!country) return false
    return task.allowed_countries.includes(country)
  })

  filtered.sort((a, b) => (b.commission_eur ?? 0) - (a.commission_eur ?? 0))

  const top2 = filtered.slice(0, 2)

  const { data: workinkTasks } = await supabase
    .from('tasks')
    .select('id, name, description, affiliate_url, task_type')
    .eq('task_type', 'workink')
    .eq('is_active', true)
    .limit(1)

  const result: TaskOption[] = top2.map((task, idx) => ({
    id: task.id,
    name: task.name,
    description: task.description,
    affiliate_url: task.affiliate_url,
    task_type: task.task_type,
    is_recommended: idx === 0,
    sort_order: idx,
    allowed_countries: task.allowed_countries ?? null,
    commission_eur: task.commission_eur ?? null,
  }))

  const workinkTask = workinkTasks?.[0]
  if (workinkTask) {
    result.push({
      id: workinkTask.id,
      name: workinkTask.name,
      description: workinkTask.description,
      affiliate_url: workinkTask.affiliate_url,
      task_type: workinkTask.task_type,
      is_recommended: false,
      sort_order: result.length,
      allowed_countries: null,
      commission_eur: null,
    })
  }

  return result
}
