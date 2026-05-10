import { createClient } from '@supabase/supabase-js'

// Plain client — all query results typed as `any` to avoid fighting Supabase's
// generated-type machinery. Server-side only (service_role key).
export function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
