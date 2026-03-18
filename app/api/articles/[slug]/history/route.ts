import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const article = await sql`SELECT id FROM articles WHERE slug = ${slug}`
    if (article.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const revisions = await sql`
      SELECT ar.id, ar.revision_number, ar.edit_summary, ar.is_minor_edit,
             ar.byte_size, ar.created_at, u.username as editor_name
      FROM article_revisions ar
      JOIN users u ON ar.editor_id = u.id
      WHERE ar.article_id = ${article[0].id}
      ORDER BY ar.revision_number DESC
    `
    return NextResponse.json({ revisions })
  } catch (err) {
    console.error('[revisions GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
