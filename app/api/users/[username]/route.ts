import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  try {
    const [user] = await sql`
      SELECT id, username, display_name, bio, avatar_url, role, edit_count, is_verified, created_at
      FROM users WHERE username = ${username}
    `
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const contributions = await sql`
      SELECT * FROM user_contributions WHERE user_id = ${user.id}
      ORDER BY created_at DESC LIMIT 20
    `
    const articles = await sql`
      SELECT id, title, slug, updated_at, status FROM articles
      WHERE author_id = ${user.id} AND status = 'published'
      ORDER BY updated_at DESC LIMIT 10
    `
    return NextResponse.json({ user, contributions, articles })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username } = await params
  if (session.username !== username && session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { display_name, bio, avatar_url } = await req.json()
    await sql`
      UPDATE users SET display_name = ${display_name || null}, bio = ${bio || null},
        avatar_url = ${avatar_url || null}
      WHERE username = ${username}
    `
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
