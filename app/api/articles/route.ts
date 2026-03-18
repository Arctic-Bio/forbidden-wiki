import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || ''
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
  const offset = (page - 1) * limit
  const category = req.nextUrl.searchParams.get('category') || ''
  const sort = req.nextUrl.searchParams.get('sort') || 'recent'

  try {
    let articles
    const orderClause = sort === 'popular' ? 'a.view_count DESC' : sort === 'az' ? 'a.title ASC' : 'a.updated_at DESC'

    if (q) {
      articles = await sql`
        SELECT a.id, a.title, a.slug, a.summary, a.view_count, a.updated_at,
               u.username as author_name, c.name as category_name,
               ts_rank(to_tsvector('english', a.title || ' ' || COALESCE(a.content, '')), plainto_tsquery('english', ${q})) as rank
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'published'
          AND to_tsvector('english', a.title || ' ' || COALESCE(a.content, '')) @@ plainto_tsquery('english', ${q})
        ORDER BY rank DESC, a.updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (category) {
      articles = await sql`
        SELECT a.id, a.title, a.slug, a.summary, a.view_count, a.updated_at,
               u.username as author_name, c.name as category_name
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'published' AND c.slug = ${category}
        ORDER BY a.updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (sort === 'popular') {
      articles = await sql`
        SELECT a.id, a.title, a.slug, a.summary, a.view_count, a.updated_at,
               u.username as author_name, c.name as category_name
        FROM articles a LEFT JOIN users u ON a.author_id = u.id LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'published' ORDER BY a.view_count DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else if (sort === 'az') {
      articles = await sql`
        SELECT a.id, a.title, a.slug, a.summary, a.view_count, a.updated_at,
               u.username as author_name, c.name as category_name
        FROM articles a LEFT JOIN users u ON a.author_id = u.id LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'published' ORDER BY a.title ASC LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      articles = await sql`
        SELECT a.id, a.title, a.slug, a.summary, a.view_count, a.updated_at,
               u.username as author_name, c.name as category_name
        FROM articles a LEFT JOIN users u ON a.author_id = u.id LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'published' ORDER BY a.updated_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    }
    return NextResponse.json({ articles })
  } catch (err) {
    console.error('[articles GET]', err)
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}
