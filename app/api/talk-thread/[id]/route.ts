import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const [thread] = await sql`SELECT * FROM talk_threads WHERE id = ${id}`
    if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const posts = await sql`
      SELECT tp.*, u.username as author_name
      FROM talk_posts tp JOIN users u ON tp.author_id = u.id
      WHERE tp.thread_id = ${id} AND tp.is_deleted = false
      ORDER BY tp.created_at ASC
    `
    return NextResponse.json({ thread, posts })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const { content } = await req.json()
    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })
    const [post] = await sql`
      INSERT INTO talk_posts (thread_id, author_id, content)
      VALUES (${id}, ${user.id}, ${content})
      RETURNING *
    `
    await sql`
      UPDATE talk_threads SET reply_count = reply_count + 1, updated_at = NOW() WHERE id = ${id}
    `
    return NextResponse.json({ success: true, post })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
