import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// This endpoint has been removed — task assignment is now global, not per-link.
export async function GET() {
  return NextResponse.json([], { status: 200 })
}
