'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { useAuth } from '@/components/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { formatDate } from '@/lib/utils-wiki'
import {
  Shield, Users, FileText, Image, MessageSquare,
  Lock, Unlock, Star, StarOff, Trash2, UserX, UserCheck,
  TrendingUp, PenSquare, Clock, ChevronRight, Plus, X, Layers
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Stats {
  published_articles: number; draft_articles: number; total_users: number
  admin_count: number; banned_count: number; media_files: number; forum_threads: number
}
interface AdminArticle {
  id: string; title: string; slug: string; status: string; is_locked: boolean
  is_featured: boolean; view_count: number; updated_at: string; author_name: string
}
interface AdminUser {
  id: string; username: string; email: string; role: string
  edit_count: number; created_at: string; is_banned?: boolean
}
interface ModerationLog {
  id: string; action: string; moderator_name: string; target_user_id: string | null
  target_article_id: string | null; reason: string | null; created_at: string
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.push('/')
  }, [user, loading, router])

  const { data, isLoading, mutate } = useSWR(user?.role === 'admin' ? '/api/admin' : null, fetcher)

  const stats: Stats | null = data?.stats || null
  const articles: AdminArticle[] = data?.articles || []
  const users: AdminUser[] = data?.users || []
  const logs: ModerationLog[] = data?.logs || []

  const [newCatName, setNewCatName] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')
  const [catSubmitting, setCatSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const doAction = async (action: string, extra: Record<string, string | boolean | null> = {}) => {
    setActionLoading(action + JSON.stringify(extra))
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      if (res.ok) mutate()
    } finally {
      setActionLoading(null)
    }
  }

  const createCategory = async () => {
    if (!newCatName.trim()) return
    setCatSubmitting(true)
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_category', name: newCatName.trim(), description: newCatDesc.trim() || null }),
      })
      setNewCatName(''); setNewCatDesc('')
      mutate()
    } finally {
      setCatSubmitting(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!user || user.role !== 'admin') return null

  const StatCard = ({ icon: Icon, label, value, color = 'text-primary' }: {
    icon: React.ElementType; label: string; value: number | string; color?: string
  }) => (
    <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <div className="font-bold text-xl">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Manage content, users, and site settings</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <StatCard icon={FileText} label="Published Articles" value={stats.published_articles} />
              <StatCard icon={Users} label="Total Users" value={stats.total_users} />
              <StatCard icon={Image} label="Media Files" value={stats.media_files} />
              <StatCard icon={MessageSquare} label="Forum Threads" value={stats.forum_threads} />
            </div>
          )}

          <Tabs defaultValue="articles">
            <TabsList className="bg-muted mb-6 h-9">
              <TabsTrigger value="articles" className="text-xs h-7 gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Articles
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs h-7 gap-1.5">
                <Users className="w-3.5 h-3.5" /> Users
              </TabsTrigger>
              <TabsTrigger value="categories" className="text-xs h-7 gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Categories
              </TabsTrigger>
              <TabsTrigger value="logs" className="text-xs h-7 gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Mod Log
              </TabsTrigger>
            </TabsList>

            {/* Articles tab */}
            <TabsContent value="articles">
              <div className="space-y-2">
                {articles.map(article => (
                  <div key={article.id} className="flex items-center gap-4 bg-card border border-border rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/wiki/${article.slug}`}
                          className="font-medium text-sm hover:text-primary transition-colors truncate max-w-64">
                          {article.title}
                        </Link>
                        <Badge variant={article.status === 'published' ? 'default' : 'secondary'}
                          className="text-xs py-0 shrink-0">
                          {article.status}
                        </Badge>
                        {article.is_locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                        {article.is_featured && <Star className="w-3 h-3 text-accent" />}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        by {article.author_name} · {formatDate(article.updated_at)} · {article.view_count} views
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                        title={article.is_locked ? 'Unlock' : 'Lock'}
                        onClick={() => doAction(article.is_locked ? 'unlock_article' : 'lock_article', { target_article_id: article.id })}>
                        {article.is_locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                        title={article.is_featured ? 'Unfeature' : 'Feature'}
                        onClick={() => doAction(article.is_featured ? 'unfeature_article' : 'feature_article', { target_article_id: article.id })}>
                        {article.is_featured ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                      </Button>
                      <Link href={`/wiki/${article.slug}/edit`}>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit">
                          <PenSquare className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        title="Delete" onClick={() => {
                          if (confirm(`Delete "${article.title}"?`))
                            doAction('delete_article', { target_article_id: article.id })
                        }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Users tab */}
            <TabsContent value="users">
              <div className="space-y-2">
                {users.map(u => (
                  <div key={u.id} className="flex items-center gap-4 bg-card border border-border rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/user/${u.username}`}
                          className="font-medium text-sm hover:text-primary transition-colors">
                          {u.username}
                        </Link>
                        <Badge variant={u.role === 'admin' ? 'default' : u.role === 'banned' ? 'destructive' : 'secondary'}
                          className="text-xs py-0 shrink-0">
                          {u.role}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {u.email} · {u.edit_count} edits · joined {formatDate(u.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {u.role !== 'admin' && (
                        <>
                          <Select onValueChange={role => doAction('promote_' + (role === 'editor' ? 'editor' : 'admin'), { target_user_id: u.id })}>
                            <SelectTrigger className="h-7 text-xs w-24 border-border bg-muted">
                              <SelectValue placeholder="Set role" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="editor">editor</SelectItem>
                              <SelectItem value="admin">admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost"
                            className={`h-7 w-7 p-0 ${u.role === 'banned' ? 'text-green-500 hover:text-green-600' : 'text-destructive hover:text-destructive'}`}
                            title={u.role === 'banned' ? 'Unban' : 'Ban'}
                            onClick={() => doAction(u.role === 'banned' ? 'unban_user' : 'ban_user', { target_user_id: u.id })}>
                            {u.role === 'banned' ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Categories tab */}
            <TabsContent value="categories">
              <CategoryManager createCategory={createCategory}
                newCatName={newCatName} setNewCatName={setNewCatName}
                newCatDesc={newCatDesc} setNewCatDesc={setNewCatDesc}
                catSubmitting={catSubmitting} />
            </TabsContent>

            {/* Moderation log */}
            <TabsContent value="logs">
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No moderation actions logged.</p>
                ) : logs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 bg-card border border-border rounded-lg p-3 text-sm">
                    <Badge variant="outline" className="text-xs py-0 mt-0.5 shrink-0">{log.action}</Badge>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{log.moderator_name}</span>
                      {log.reason && <span className="text-muted-foreground"> · {log.reason}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(log.created_at)}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function CategoryManager({ createCategory, newCatName, setNewCatName, newCatDesc, setNewCatDesc, catSubmitting }: {
  createCategory: () => void
  newCatName: string; setNewCatName: (v: string) => void
  newCatDesc: string; setNewCatDesc: (v: string) => void
  catSubmitting: boolean
}) {
  const { data } = useSWR('/api/categories', fetcher)
  const categories = data?.categories || []

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Create Category
        </h3>
        <div className="space-y-3">
          <Input value={newCatName} onChange={e => setNewCatName(e.target.value)}
            placeholder="Category name" className="bg-muted border-border h-9 text-sm" />
          <Input value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)}
            placeholder="Description (optional)" className="bg-muted border-border h-9 text-sm" />
          <Button disabled={!newCatName.trim() || catSubmitting} onClick={createCategory}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            {catSubmitting ? 'Creating...' : 'Create Category'}
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-semibold text-sm mb-4">Existing Categories</h3>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <div className="space-y-2">
            {categories.map((c: { id: string; name: string; slug: string; article_count: number }) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded bg-muted text-sm">
                <div>
                  <Link href={`/categories/${c.slug}`} className="font-medium hover:text-primary">{c.name}</Link>
                  <span className="text-xs text-muted-foreground ml-2">{c.article_count} articles</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
