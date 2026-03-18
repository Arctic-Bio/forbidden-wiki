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
import { BookOpen, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordStrength = password.length === 0 ? null : password.length < 6 ? 'weak' : password.length < 10 ? 'medium' : 'strong'
  const passwordsMatch = confirm.length > 0 && password === confirm

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !email || !password || !confirm) { setError('All fields are required.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      setError('Username must be 3–30 characters, letters/numbers/underscores only.'); return
    }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
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
            <h1 className="font-serif text-2xl font-bold">Join The Forbidden Wiki</h1>
            <p className="text-muted-foreground text-sm mt-1">Create an account to start contributing</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm mb-1.5 block">Username</Label>
                <Input id="username" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="your_username" autoComplete="username"
                  className="bg-muted border-border h-10" />
                <p className="text-xs text-muted-foreground mt-1">3–30 chars, letters, numbers, underscores</p>
              </div>
              <div>
                <Label htmlFor="email" className="text-sm mb-1.5 block">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" autoComplete="email"
                  className="bg-muted border-border h-10" />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm mb-1.5 block">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
                    autoComplete="new-password" className="bg-muted border-border h-10 pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordStrength && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength === 'strong' ? 'bg-green-500' : passwordStrength === 'medium' ? 'bg-accent' : 'bg-destructive'}`} />
                    <span className={`text-xs ${passwordStrength === 'strong' ? 'text-green-500' : passwordStrength === 'medium' ? 'text-accent' : 'text-destructive'}`}>
                      {passwordStrength}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="confirm" className="text-sm mb-1.5 block">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirm" type={showPass ? 'text' : 'password'} value={confirm}
                    onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password"
                    autoComplete="new-password" className="bg-muted border-border h-10 pr-10" />
                  {confirm.length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {passwordsMatch
                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                        : <XCircle className="w-4 h-4 text-destructive" />}
                    </span>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10">
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
