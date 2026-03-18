import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const articleId = formData.get('article_id') as string | null
    const caption = formData.get('caption') as string | null
    const altText = formData.get('alt_text') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 413 })

    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    const isAudio = file.type.startsWith('audio/')
    const mediaType = isVideo ? 'video' : isImage ? 'image' : isAudio ? 'audio' : 'document'

    const safeName = `wiki/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const blob = await put(safeName, file, { access: 'public' })

    const [media] = await sql`
      INSERT INTO media (filename, original_name, blob_url, blob_pathname, content_type,
                         file_size, media_type, caption, alt_text, uploader_id, article_id)
      VALUES (${safeName}, ${file.name}, ${blob.url}, ${blob.pathname}, ${file.type},
              ${file.size}, ${mediaType}, ${caption || null}, ${altText || null},
              ${user.id}, ${articleId || null})
      RETURNING *
    `
    return NextResponse.json({ success: true, media })
  } catch (err) {
    console.error('[media upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
  const limit = 24
  const type = req.nextUrl.searchParams.get('type') || ''
  const offset = (page - 1) * limit

  try {
    let media
    if (type) {
      media = await sql`
        SELECT m.*, u.username as uploader_name
        FROM media m JOIN users u ON m.uploader_id = u.id
        WHERE m.media_type = ${type}
        ORDER BY m.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      media = await sql`
        SELECT m.*, u.username as uploader_name
        FROM media m JOIN users u ON m.uploader_id = u.id
        ORDER BY m.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }
    return NextResponse.json({ media })
  } catch (err) {
    console.error('[media GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
