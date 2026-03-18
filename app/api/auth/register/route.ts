import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }
    if (username.length < 3 || username.length > 50) {
      return NextResponse.json({ error: 'Username must be 3-50 characters' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await sql`
      SELECT id FROM users WHERE email = ${email} OR username = ${username}
    `
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Username or email already taken' }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(password, 12)
    const [user] = await sql`
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES (${username}, ${email}, ${password_hash}, ${username})
      RETURNING id, username, email, role
    `

    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await sql`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expires.toISOString()})
    `

    const response = NextResponse.json({ success: true, user })
    response.cookies.set('wiki_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
    })
    return response
  } catch (err) {
    console.error('[auth/register]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
