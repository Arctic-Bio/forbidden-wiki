import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { slugify } from '@/lib/utils-wiki'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, content, summary, category_id, tags, edit_summary, is_minor_edit, infobox } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const slug = slugify(title)

    // Check slug uniqueness
    const existing = await sql`SELECT id FROM articles WHERE slug = ${slug}`
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An article with this title already exists' }, { status: 409 })
    }

    const [article] = await sql`
      INSERT INTO articles (title, slug, content, summary, status, author_id, category_id, infobox)
      VALUES (${title.trim()}, ${slug}, ${content}, ${summary || null}, 'published',
              ${session.id}, ${category_id || null}, ${infobox ? JSON.stringify(infobox) : null})
      RETURNING id, slug
    `

    // Save first revision
    await sql`
      INSERT INTO article_revisions (article_id, title, content, summary, edit_summary, editor_id, is_minor_edit, revision_number, byte_size)
      VALUES (${article.id}, ${title.trim()}, ${content}, ${summary || null},
              ${edit_summary || 'Initial article'}, ${session.id}, false, 1, ${content.length})
    `

    // Handle tags
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        const tSlug = slugify(tagName)
        const [tag] = await sql`
          INSERT INTO tags (name, slug) VALUES (${tagName}, ${tSlug})
          ON CONFLICT (slug) DO UPDATE SET article_count = tags.article_count + 1
          RETURNING id
        `
        await sql`INSERT INTO article_tags (article_id, tag_id) VALUES (${article.id}, ${tag.id}) ON CONFLICT DO NOTHING`
      }
    }

    // Update category count
    if (category_id) {
      await sql`UPDATE categories SET article_count = article_count + 1 WHERE id = ${category_id}`
    }

    // Log contribution
    await sql`
      INSERT INTO user_contributions (user_id, type, target_id, target_title)
      VALUES (${session.id}, 'article_create', ${article.id}, ${title.trim()})
    `
    await sql`UPDATE users SET edit_count = edit_count + 1 WHERE id = ${session.id}`

    return NextResponse.json({ slug: article.slug })
  } catch (err) {
    console.error('[articles/new POST]', err)
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
  }
}
