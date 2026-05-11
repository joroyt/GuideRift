import { headers } from 'next/headers'

export function getCountryFromRequest(): string | null {
  const headersList = headers()
  const country = headersList.get('x-vercel-ip-country')
  return country ?? null
}
