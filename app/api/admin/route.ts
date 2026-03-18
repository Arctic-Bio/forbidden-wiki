import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const notifications = await sql`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`
    const articles = await sql`
      SELECT a.*, u.username as author_name FROM articles a
      JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC LIMIT 20
    `
    const users = await sql`
      SELECT id, username, email, role, edit_count, is_verified, created_at FROM users
      ORDER BY created_at DESC LIMIT 20
    `
    const stats = await sql`
      SELECT
        (SELECT COUNT(*) FROM articles WHERE status = 'published') as published_articles,
        (SELECT COUNT(*) FROM articles WHERE status = 'draft') as draft_articles,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_count,
        (SELECT COUNT(*) FROM users WHERE role = 'banned') as banned_count,
        (SELECT COUNT(*) FROM media) as media_files,
        (SELECT COUNT(*) FROM forum_threads WHERE is_deleted = false) as forum_threads
    `
    const logs = await sql`
      SELECT ml.*, u.username as moderator_name FROM moderation_logs ml
      JOIN users u ON ml.moderator_id = u.id
      ORDER BY ml.created_at DESC LIMIT 20
    `
    return NextResponse.json({ notifications, articles, users, stats: stats[0], logs })
  } catch (err) {
    console.error('[admin GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { action, target_user_id, target_article_id, reason, name, description } = body

    if (action === 'ban_user' && target_user_id) {
      await sql`UPDATE users SET role = 'banned' WHERE id = ${target_user_id}`
    } else if (action === 'unban_user' && target_user_id) {
      await sql`UPDATE users SET role = 'user' WHERE id = ${target_user_id}`
    } else if (action === 'promote_editor' && target_user_id) {
      await sql`UPDATE users SET role = 'editor' WHERE id = ${target_user_id}`
    } else if (action === 'promote_admin' && target_user_id) {
      await sql`UPDATE users SET role = 'admin' WHERE id = ${target_user_id}`
    } else if (action === 'lock_article' && target_article_id) {
      await sql`UPDATE articles SET is_locked = true WHERE id = ${target_article_id}`
    } else if (action === 'unlock_article' && target_article_id) {
      await sql`UPDATE articles SET is_locked = false WHERE id = ${target_article_id}`
    } else if (action === 'feature_article' && target_article_id) {
      await sql`UPDATE articles SET is_featured = true WHERE id = ${target_article_id}`
    } else if (action === 'unfeature_article' && target_article_id) {
      await sql`UPDATE articles SET is_featured = false WHERE id = ${target_article_id}`
    } else if (action === 'delete_article' && target_article_id) {
      await sql`UPDATE articles SET status = 'deleted' WHERE id = ${target_article_id}`
    } else if (action === 'create_category' && name) {
      const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      await sql`
        INSERT INTO categories (name, slug, description) VALUES (${name}, ${slug}, ${description || null})
        ON CONFLICT (slug) DO NOTHING
      `
    }

    await sql`
      INSERT INTO moderation_logs (moderator_id, target_user_id, target_article_id, action, reason)
      VALUES (${session.id}, ${target_user_id || null}, ${target_article_id || null}, ${action}, ${reason || null})
    `
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
