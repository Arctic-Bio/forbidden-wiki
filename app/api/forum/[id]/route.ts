import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const [thread] = await sql`
      SELECT ft.*, fb.name as board_name, fb.slug as board_slug, u.username as author_name
      FROM forum_threads ft
      JOIN forum_boards fb ON ft.board_id = fb.id
      JOIN users u ON ft.author_id = u.id
      WHERE ft.id = ${id} AND ft.is_deleted = false
    `
    if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await sql`UPDATE forum_threads SET view_count = view_count + 1 WHERE id = ${id}`

    const posts = await sql`
      SELECT fp.*, u.username as author_name, u.avatar_url, u.role as author_role,
             u.edit_count as author_edits, u.created_at as author_joined
      FROM forum_posts fp
      JOIN users u ON fp.author_id = u.id
      WHERE fp.thread_id = ${id}
      ORDER BY fp.created_at ASC
    `
    return NextResponse.json({ thread, posts })
  } catch (err) {
    console.error('[forum thread GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const { content } = await req.json()
    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })

    const [thread] = await sql`SELECT * FROM forum_threads WHERE id = ${id}`
    if (!thread || thread.is_deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (thread.is_locked && user.role !== 'admin') {
      return NextResponse.json({ error: 'Thread is locked' }, { status: 403 })
    }

    const [post] = await sql`
      INSERT INTO forum_posts (thread_id, author_id, content)
      VALUES (${id}, ${user.id}, ${content})
      RETURNING *
    `
    await sql`
      UPDATE forum_threads
      SET reply_count = reply_count + 1, last_reply_at = NOW(), last_reply_by = ${user.id}
      WHERE id = ${id}
    `
    await sql`UPDATE forum_boards SET post_count = post_count + 1 WHERE id = ${thread.board_id}`

    return NextResponse.json({ success: true, post })
  } catch (err) {
    console.error('[forum thread POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
