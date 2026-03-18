import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Only fetch essential category data (no description) and limit to top 8
    const categories = await sql`
      SELECT id, name, slug 
      FROM categories 
      ORDER BY name 
      LIMIT 8
    `
    
    const stats = await sql`
      SELECT
        (SELECT COUNT(*) FROM articles WHERE status = 'published') as article_count,
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM media) as media_count,
        (SELECT COUNT(*) FROM forum_threads WHERE is_deleted = false) as thread_count
    `
    
    // Limit featured to 2 instead of 3, remove summary
    const featured = await sql`
      SELECT a.id, a.title, a.slug, a.view_count, a.updated_at,
             u.username as author_name, c.name as category_name
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.is_featured = true AND a.status = 'published'
      ORDER BY a.updated_at DESC LIMIT 2
    `
    
    // Limit recent to 5 instead of 8, truncate summary to 100 chars
    const recent = await sql`
      SELECT a.id, a.title, a.slug, SUBSTRING(a.summary, 1, 100) as summary, a.view_count, a.updated_at,
             u.username as author_name, c.name as category_name
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'published'
      ORDER BY a.updated_at DESC LIMIT 5
    `
    
    // Limit popular to 4 instead of 5
    const popular = await sql`
      SELECT a.id, a.title, a.slug, a.view_count, c.name as category_name
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'published'
      ORDER BY a.view_count DESC LIMIT 4
    `
    
    return NextResponse.json({ categories, stats: stats[0], featured, recent, popular })
  } catch (err) {
    console.error('[home data]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
