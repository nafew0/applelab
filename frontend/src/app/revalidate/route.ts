import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

/**
 * On-demand ISR endpoint called by the Django catalog signals
 * (`repairs/signals.py`) after a catalog change. Lives outside /api so the
 * Django proxy rewrite never captures it, and is excluded from the locale
 * middleware. Not `_revalidate`: underscore folders are private (unrouted).
 *
 * Body: { secret: string, tags: string[] }
 */
export async function POST(request: Request) {
  const expected = process.env.NEXT_REVALIDATE_SECRET
  if (!expected) {
    return NextResponse.json({ detail: 'revalidation disabled' }, { status: 503 })
  }
  let body: { secret?: string; tags?: unknown }
  try {
    body = (await request.json()) as { secret?: string; tags?: unknown }
  } catch {
    return NextResponse.json({ detail: 'invalid json' }, { status: 400 })
  }
  if (body.secret !== expected) {
    return NextResponse.json({ detail: 'forbidden' }, { status: 401 })
  }
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === 'string' && t.length < 200).slice(0, 100)
    : []
  // expire: 0 — an owner who just edited a price must see it on the next load,
  // not after one stale-while-revalidate round trip.
  for (const tag of tags) revalidateTag(tag, { expire: 0 })
  return NextResponse.json({ revalidated: tags })
}
