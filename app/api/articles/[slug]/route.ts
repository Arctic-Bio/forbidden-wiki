import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { slugify } from '@/lib/utils-wiki'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const rows = await sql`
      SELECT a.*, u.username as author_name, u.display_name as author_display,
             c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.slug = ${slug} AND a.status != 'deleted'
    `
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await sql`UPDATE articles SET view_count = view_count + 1 WHERE slug = ${slug}`

    const article = rows[0]
    const tags = await sql`
      SELECT t.name, t.slug FROM tags t
      JOIN article_tags at ON t.id = at.tag_id
      WHERE at.article_id = ${article.id}
    `
    const media = await sql`
      SELECT id, blob_url, media_type, caption, alt_text, filename
      FROM media WHERE article_id = ${article.id}
    `
    return NextResponse.json({ article: { ...article, tags, media } })
  } catch (err) {
    console.error('[article GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  try {
    const { title, content, summary, edit_summary, is_minor_edit, category_id, tags, infobox } = await req.json()

    const existing = await sql`SELECT * FROM articles WHERE slug = ${slug}`
    if (existing.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const article = existing[0]
    if (article.is_locked && user.role !== 'admin') {
      return NextResponse.json({ error: 'Article is locked' }, { status: 403 })
    }

    const newSlug = slugify(title)
    const [rev] = await sql`
      SELECT COALESCE(MAX(revision_number), 0) + 1 as next_rev
      FROM article_revisions WHERE article_id = ${article.id}
    `

    await sql`
      INSERT INTO article_revisions (article_id, title, content, summary, edit_summary, editor_id, is_minor_edit, revision_number, byte_size)
      VALUES (${article.id}, ${title}, ${content}, ${summary || null}, ${edit_summary || null},
              ${user.id}, ${is_minor_edit || false}, ${rev.next_rev}, ${content.length})
    `

    await sql`
      UPDATE articles SET title = ${title}, slug = ${newSlug}, content = ${content},
        summary = ${summary || null}, category_id = ${category_id || null},
        infobox = ${infobox ? JSON.stringify(infobox) : null},
        updated_at = NOW()
      WHERE id = ${article.id}
    `

    if (tags && Array.isArray(tags)) {
      await sql`DELETE FROM article_tags WHERE article_id = ${article.id}`
      for (const tagName of tags) {
        const tagSlug = slugify(tagName)
        const [tag] = await sql`
          INSERT INTO tags (name, slug) VALUES (${tagName}, ${tagSlug})
          ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `
        await sql`
          INSERT INTO article_tags (article_id, tag_id) VALUES (${article.id}, ${tag.id})
          ON CONFLICT DO NOTHING
        `
      }
    }

    await sql`UPDATE users SET edit_count = edit_count + 1 WHERE id = ${user.id}`
    await sql`
      INSERT INTO user_contributions (user_id, type, target_id, target_title)
      VALUES (${user.id}, 'article_edit', ${article.id}, ${title})
    `

    return NextResponse.json({ success: true, slug: newSlug })
  } catch (err) {
    console.error('[article PUT]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params: _params }: { params: Promise<{ slug: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { title, content, summary, category_id, tags, infobox } = await req.json()
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

    const slug = slugify(title)
    const existing = await sql`SELECT id FROM articles WHERE slug = ${slug}`
    if (existing.length > 0) return NextResponse.json({ error: 'Article with this title exists' }, { status: 409 })

    const [article] = await sql`
      INSERT INTO articles (title, slug, content, summary, status, author_id, category_id, infobox)
      VALUES (${title}, ${slug}, ${content || ''}, ${summary || null}, 'published', ${user.id},
              ${category_id || null}, ${infobox ? JSON.stringify(infobox) : null})
      RETURNING *
    `

    await sql`
      INSERT INTO article_revisions (article_id, title, content, summary, editor_id, revision_number, byte_size)
      VALUES (${article.id}, ${title}, ${content || ''}, ${summary || null}, ${user.id}, 1, ${(content || '').length})
    `

    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        const tagSlug = slugify(tagName)
        const [tag] = await sql`
          INSERT INTO tags (name, slug) VALUES (${tagName}, ${tagSlug})
          ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `
        await sql`INSERT INTO article_tags (article_id, tag_id) VALUES (${article.id}, ${tag.id}) ON CONFLICT DO NOTHING`
      }
    }

    await sql`
      INSERT INTO talk_pages (article_id) VALUES (${article.id})
    `
    await sql`UPDATE users SET edit_count = edit_count + 1 WHERE id = ${user.id}`
    await sql`
      INSERT INTO user_contributions (user_id, type, target_id, target_title)
      VALUES (${user.id}, 'article_create', ${article.id}, ${title})
    `

    return NextResponse.json({ success: true, slug })
  } catch (err) {
    console.error('[article POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
