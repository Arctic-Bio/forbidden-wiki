import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  try {
    const [user] = await sql`
      SELECT id, username, display_name, bio, avatar_url, role, edit_count, created_at
      FROM users WHERE username = ${username}
    `
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const contributions = await sql`
      SELECT uc.id, uc.type, uc.target_id, uc.target_title, uc.created_at,
             a.title as article_title, a.slug as article_slug
      FROM user_contributions uc
      LEFT JOIN articles a ON uc.target_id = a.id
      WHERE uc.user_id = ${user.id}
      ORDER BY uc.created_at DESC
      LIMIT 50
    `
    const articles = await sql`
      SELECT id, title, slug, created_at, view_count
      FROM articles WHERE author_id = ${user.id} AND status = 'published'
      ORDER BY created_at DESC LIMIT 10
    `
    return NextResponse.json({ user, contributions, articles })
  } catch (err) {
    console.error('[user GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
