import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId } = await params
  try {
    const { content } = await req.json()
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }

    const [post] = await sql`SELECT * FROM forum_posts WHERE id = ${postId}`
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (post.is_deleted) return NextResponse.json({ error: 'Cannot edit deleted post' }, { status: 410 })
    
    // Only allow author or admin to edit
    if (post.author_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [updated] = await sql`
      UPDATE forum_posts
      SET content = ${content.trim()}, edit_count = edit_count + 1, updated_at = NOW()
      WHERE id = ${postId}
      RETURNING *
    `

    return NextResponse.json({ success: true, post: updated })
  } catch (err) {
    console.error('[forum post PUT]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId } = await params
  try {
    const [post] = await sql`SELECT * FROM forum_posts WHERE id = ${postId}`
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (post.is_deleted) return NextResponse.json({ error: 'Post already deleted' }, { status: 410 })
    
    // Only allow author or admin to delete
    if (post.author_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await sql`
      UPDATE forum_posts
      SET is_deleted = true, updated_at = NOW()
      WHERE id = ${postId}
    `

    // Decrement thread reply count if not already deleted
    const [thread] = await sql`SELECT * FROM forum_threads WHERE id = ${post.thread_id}`
    if (thread && thread.reply_count > 0) {
      await sql`UPDATE forum_threads SET reply_count = reply_count - 1 WHERE id = ${post.thread_id}`
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[forum post DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
