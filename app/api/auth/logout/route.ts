import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get('wiki_session')?.value
  if (token) {
    await sql`DELETE FROM sessions WHERE token = ${token}`
  }
  const response = NextResponse.json({ success: true })
  response.cookies.delete('wiki_session')
  return response
}
