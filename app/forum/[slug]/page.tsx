'use client'

import { use, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { useAuth } from '@/components/auth-context'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, truncate } from '@/lib/utils-wiki'
import { MessageSquare, Pin, Lock, TrendingUp, Clock, ChevronRight, Plus, X } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Thread {
  id: string; title: string; author_name: string; is_pinned: boolean; is_locked: boolean
  view_count: number; reply_count: number; last_reply_name: string | null
  last_reply_at: string | null; created_at: string; first_post: string | null
}

export default function ForumBoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [showNewThread, setShowNewThread] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading, mutate } = useSWR(`/api/forum?board=${slug}&page=${page}`, fetcher)
  const board = data?.board
  const threads: Thread[] = data?.threads || []

  const createThread = async () => {
    if (!newTitle.trim() || !newContent.trim()) { setError('Title and content are required.'); return }
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board_slug: slug, title: newTitle.trim(), content: newContent.trim() }),
      })
      const result = await res.json()
      if (!res.ok) { setError(result.error || 'Failed to create thread'); return }
      setNewTitle(''); setNewContent(''); setShowNewThread(false)
      mutate()
    } catch {
      setError('Unexpected error.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/forum" className="hover:text-foreground">Forum</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground">{board?.name || slug}</span>
            </nav>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-serif text-2xl font-bold">{board?.name || slug}</h1>
                {board?.description && (
                  <p className="text-muted-foreground text-sm mt-1">{board.description}</p>
                )}
              </div>
              {user && !board?.is_locked && (
                <Button onClick={() => setShowNewThread(!showNewThread)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-9">
                  {showNewThread ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {showNewThread ? 'Cancel' : 'New Thread'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* New thread form */}
          {showNewThread && (
            <div className="bg-card border border-border rounded-lg p-5 mb-6">
              <h2 className="font-semibold text-sm mb-4">Start a New Thread</h2>
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground rounded p-2 text-xs mb-3">{error}</div>
              )}
              <div className="space-y-3">
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="Thread title..." className="bg-muted border-border h-10" />
                <Textarea value={newContent} onChange={e => setNewContent(e.target.value)}
                  placeholder="Write your post..." rows={5}
                  className="bg-muted border-border resize-none" />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowNewThread(false)} className="border-border">Cancel</Button>
                  <Button size="sm" disabled={submitting} onClick={createThread}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {submitting ? 'Posting...' : 'Post Thread'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Threads */}
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : threads.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-lg">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="font-serif text-lg font-medium mb-2">No threads yet</p>
              {user && !board?.is_locked && (
                <p className="text-sm text-muted-foreground">Be the first to start a discussion.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {threads.map(thread => (
                <Link key={thread.id} href={`/forum/thread/${thread.id}`}
                  className="flex items-start gap-4 bg-card border border-border rounded-lg p-4 hover:border-primary/40 group transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {thread.is_pinned && <Pin className="w-3 h-3 text-accent shrink-0" />}
                      {thread.is_locked && <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
                      <h2 className="font-medium text-sm group-hover:text-primary transition-colors">
                        {thread.title}
                      </h2>
                    </div>
                    {thread.first_post && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{truncate(thread.first_post, 120)}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>by {thread.author_name}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(thread.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      <MessageSquare className="w-3 h-3" />
                      <span className="font-medium text-foreground">{thread.reply_count}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <TrendingUp className="w-3 h-3" />
                      <span>{thread.view_count}</span>
                    </div>
                    {thread.last_reply_at && (
                      <div className="mt-1 text-xs">{formatDate(thread.last_reply_at)}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
