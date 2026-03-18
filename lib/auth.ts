import { cookies } from 'next/headers'
import { sql } from '@/lib/db'
import { cache } from 'react'

export interface User {
  id: string
  username: string
  email: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  role: 'user' | 'editor' | 'admin' | 'banned'
  edit_count: number
  is_verified: boolean
  created_at: string
}

export const getSession = cache(async (): Promise<User | null> => {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('wiki_session')?.value
    if (!token) return null

    const rows = await sql`
      SELECT u.id, u.username, u.email, u.display_name, u.bio, u.avatar_url,
             u.role, u.edit_count, u.is_verified, u.created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${token}
        AND s.expires_at > NOW()
        AND u.role != 'banned'
    `
    if (rows.length === 0) return null
    return rows[0] as User
  } catch {
    return null
  }
})

export async function requireAuth(): Promise<User> {
  const user = await getSession()
  if (!user) throw new Error('Unauthorized')
  return user
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin'
}

export function isEditor(user: User | null): boolean {
  return user?.role === 'admin' || user?.role === 'editor'
}
