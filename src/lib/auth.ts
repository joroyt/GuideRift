export const ADMIN_COOKIE = 'admin_token'

// Derive a deterministic token from the admin password using Web Crypto (Edge-safe)
export async function deriveToken(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + ':link-monetize-admin')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyToken(token: string): Promise<boolean> {
  const expected = await deriveToken(process.env.ADMIN_PASSWORD || '')
  return token === expected
}
