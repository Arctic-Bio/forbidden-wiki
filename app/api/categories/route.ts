import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const categories = await sql`
      SELECT id, name, slug, description, article_count
      FROM categories
      ORDER BY name ASC
    `
    return NextResponse.json({ categories })
  } catch (err) {
    console.error('[categories GET]', err)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
