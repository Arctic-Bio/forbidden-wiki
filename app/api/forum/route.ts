import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// GET forum threads for a board
export async function GET(req: NextRequest) {
  const boardSlug = req.nextUrl.searchParams.get('board') || ''
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit

  try {
    const boards = await sql`SELECT * FROM forum_boards ORDER BY display_order`
    if (!boardSlug) return NextResponse.json({ boards })

    const board = boards.find((b: {slug: string}) => b.slug === boardSlug)
    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 })

    const threads = await sql`
      SELECT ft.*, u.username as author_name, lu.username as last_reply_name,
             (SELECT content FROM forum_posts WHERE thread_id = ft.id ORDER BY created_at ASC LIMIT 1) as first_post
      FROM forum_threads ft
      JOIN users u ON ft.author_id = u.id
      LEFT JOIN users lu ON ft.last_reply_by = lu.id
      WHERE ft.board_id = ${board.id} AND ft.is_deleted = false
      ORDER BY ft.is_pinned DESC, COALESCE(ft.last_reply_at, ft.created_at) DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return NextResponse.json({ board, threads })
  } catch (err) {
    console.error('[forum GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST create new thread
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { board_slug, title, content } = await req.json()
    if (!board_slug || !title || !content) {
      return NextResponse.json({ error: 'Board, title and content required' }, { status: 400 })
    }

    const [board] = await sql`SELECT * FROM forum_boards WHERE slug = ${board_slug}`
    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    if (board.is_locked && user.role !== 'admin') {
      return NextResponse.json({ error: 'Board is locked' }, { status: 403 })
    }

    const [thread] = await sql`
      INSERT INTO forum_threads (board_id, title, author_id, last_reply_at)
      VALUES (${board.id}, ${title}, ${user.id}, NOW())
      RETURNING *
    `
    await sql`
      INSERT INTO forum_posts (thread_id, author_id, content)
      VALUES (${thread.id}, ${user.id}, ${content})
    `
    await sql`UPDATE forum_boards SET thread_count = thread_count + 1, post_count = post_count + 1 WHERE id = ${board.id}`
    await sql`
      INSERT INTO user_contributions (user_id, type, target_id, target_title)
      VALUES (${user.id}, 'forum_post', ${thread.id}, ${title})
    `
    return NextResponse.json({ success: true, thread_id: thread.id })
  } catch (err) {
    console.error('[forum POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
