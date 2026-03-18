'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { useAuth } from '@/components/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier || !password) { setError('All fields are required.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      await refresh()
      router.push('/')
    } catch {
      setError('Unexpected error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h1 className="font-serif text-2xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to The Forbidden Wiki</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="identifier" className="text-sm mb-1.5 block">Username or Email</Label>
                <Input id="identifier" value={identifier} onChange={e => setIdentifier(e.target.value)}
                  placeholder="your_username or email@example.com"
                  autoComplete="username" className="bg-muted border-border h-10" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="password" className="text-sm">Password</Label>
                </div>
                <div className="relative">
                  <Input id="password" type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="Your password"
                    autoComplete="current-password" className="bg-muted border-border h-10 pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            New to the wiki?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
