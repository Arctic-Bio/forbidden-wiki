import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Accept both "identifier" (from login page) and legacy "login"
    const login = body.identifier || body.login
    const { password } = body
    if (!login || !password) {
      return NextResponse.json({ error: 'Login and password required' }, { status: 400 })
    }

    const rows = await sql`
      SELECT id, username, email, password_hash, role, display_name
      FROM users
      WHERE (email = ${login} OR username = ${login})
        AND role != 'banned'
    `
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await sql`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expires.toISOString()})
    `
    await sql`
      UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}
    `

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
    })
    response.cookies.set('wiki_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
    })
    return response
  } catch (err) {
    console.error('[auth/login]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
