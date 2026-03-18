import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [media] = await sql`SELECT * FROM media WHERE id = ${id}`
    if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (media.uploader_id !== session.id && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await del(media.blob_url)
    await sql`DELETE FROM media WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[media DELETE]', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
