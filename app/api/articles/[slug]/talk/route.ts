import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const article = await sql`SELECT id FROM articles WHERE slug = ${slug}`
    if (article.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [talkPage] = await sql`SELECT * FROM talk_pages WHERE article_id = ${article[0].id}`
    if (!talkPage) return NextResponse.json({ threads: [] })

    const threads = await sql`
      SELECT tt.*, u.username as author_name,
             (SELECT COUNT(*) FROM talk_posts WHERE thread_id = tt.id AND is_deleted = false) as post_count
      FROM talk_threads tt
      JOIN users u ON tt.author_id = u.id
      WHERE tt.talk_page_id = ${talkPage.id}
      ORDER BY tt.updated_at DESC
    `
    return NextResponse.json({ threads, talk_page_id: talkPage.id })
  } catch (err) {
    console.error('[talk GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  try {
    const { title, content } = await req.json()
    const article = await sql`SELECT id FROM articles WHERE slug = ${slug}`
    if (article.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let [talkPage] = await sql`SELECT * FROM talk_pages WHERE article_id = ${article[0].id}`
    if (!talkPage) {
      const [newPage] = await sql`INSERT INTO talk_pages (article_id) VALUES (${article[0].id}) RETURNING *`
      talkPage = newPage
    }

    const [thread] = await sql`
      INSERT INTO talk_threads (talk_page_id, title, author_id)
      VALUES (${talkPage.id}, ${title}, ${user.id})
      RETURNING *
    `
    await sql`
      INSERT INTO talk_posts (thread_id, author_id, content)
      VALUES (${thread.id}, ${user.id}, ${content})
    `
    return NextResponse.json({ success: true, thread_id: thread.id })
  } catch (err) {
    console.error('[talk POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
