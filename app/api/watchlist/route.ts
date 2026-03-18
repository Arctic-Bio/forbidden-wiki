import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// Get watchlist status
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const articleId = req.nextUrl.searchParams.get('article_id')
  try {
    if (articleId) {
      const [row] = await sql`
        SELECT 1 FROM watchlist WHERE user_id = ${user.id} AND article_id = ${articleId}
      `
      return NextResponse.json({ watching: !!row })
    }
    const watchlist = await sql`
      SELECT a.id, a.title, a.slug, a.updated_at, u.username as last_editor
      FROM watchlist w
      JOIN articles a ON w.article_id = a.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE w.user_id = ${user.id}
      ORDER BY w.created_at DESC
    `
    return NextResponse.json({ watchlist })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { article_id } = await req.json()
    await sql`
      INSERT INTO watchlist (user_id, article_id) VALUES (${user.id}, ${article_id})
      ON CONFLICT DO NOTHING
    `
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { article_id } = await req.json()
    await sql`DELETE FROM watchlist WHERE user_id = ${user.id} AND article_id = ${article_id}`
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
