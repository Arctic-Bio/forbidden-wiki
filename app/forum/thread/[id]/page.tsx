'use client'

import { use, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { useAuth } from '@/components/auth-context'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatDate } from '@/lib/utils-wiki'
import { MessageSquare, ChevronRight, Lock, Pin, User, Clock, Reply, Shield, MoreVertical, Edit2, Trash2, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface ForumPost {
  id: string; content: string; created_at: string; is_deleted: boolean
  author_name: string; avatar_url: string | null; author_role: string; author_edits: number; author_joined: string
  author_id: string; updated_at: string; edit_count: number
}
interface Thread {
  id: string; title: string; author_name: string; is_pinned: boolean
  is_locked: boolean; view_count: number; reply_count: number
  board_name: string; board_slug: string
}

export default function ForumThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const [reply, setReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')
  const [deletePostId, setDeletePostId] = useState<string | null>(null)

  const { data, isLoading, mutate } = useSWR(`/api/forum/${id}`, fetcher)
  const thread: Thread | null = data?.thread || null
  const posts: ForumPost[] = data?.posts || []

  const submitReply = async () => {
    if (!reply.trim()) return
    setSubmitting(true); setError('')
    try {
      const res = await fetch(`/api/forum/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply.trim() }),
      })
      const result = await res.json()
      if (!res.ok) { setError(result.error || 'Failed to post reply'); return }
      setReply('')
      mutate()
    } catch {
      setError('Unexpected error.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (post: ForumPost) => {
    setEditingPostId(post.id)
    setEditContent(post.content)
    setEditError('')
  }

  const submitEdit = async () => {
    if (!editContent.trim()) return
    setEditSubmitting(true); setEditError('')
    try {
      const res = await fetch(`/api/forum/post/${editingPostId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      })
      const result = await res.json()
      if (!res.ok) { setEditError(result.error || 'Failed to edit post'); return }
      setEditingPostId(null)
      mutate()
    } catch {
      setEditError('Unexpected error.')
    } finally {
      setEditSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deletePostId) return
    try {
      const res = await fetch(`/api/forum/post/${deletePostId}`, {
        method: 'DELETE',
      })
      if (!res.ok) { 
        const result = await res.json()
        console.error('Delete failed:', result.error)
        return 
      }
      setDeletePostId(null)
      mutate()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="max-w-5xl mx-auto px-4 py-6">
            {thread && (
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                <Link href="/" className="hover:text-foreground">Home</Link>
                <ChevronRight className="w-3 h-3" />
                <Link href="/forum" className="hover:text-foreground">Forum</Link>
                <ChevronRight className="w-3 h-3" />
                <Link href={`/forum/${thread.board_slug}`} className="hover:text-foreground">{thread.board_name}</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground truncate max-w-48">{thread.title}</span>
              </nav>
            )}
            <div className="flex items-start gap-3">
              {thread?.is_pinned && <Pin className="w-4 h-4 text-accent mt-1.5 shrink-0" />}
              {thread?.is_locked && <Lock className="w-4 h-4 text-muted-foreground mt-1.5 shrink-0" />}
              <h1 className="font-serif text-2xl font-bold">{thread?.title || '...'}</h1>
            </div>
            {thread && (
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>by {thread.author_name}</span>
                <span>{thread.reply_count} replies</span>
                <span>{thread.view_count} views</span>
                {thread.is_locked && <Badge variant="outline" className="text-xs py-0">Locked</Badge>}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, idx) => (
                <div key={post.id} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="flex gap-0">
                    {/* Author sidebar */}
                    <div className="w-32 shrink-0 bg-muted/30 border-r border-border p-3 text-center hidden sm:flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {post.avatar_url ? (
                          <img src={post.avatar_url} alt={post.author_name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <Link href={`/user/${post.author_name}`}
                        className="text-xs font-semibold hover:text-primary transition-colors line-clamp-1 w-full text-center">
                        {post.author_name}
                      </Link>
                      {post.author_role !== 'user' && (
                        <Badge variant="secondary" className="text-xs py-0 gap-1">
                          {post.author_role === 'admin' && <Shield className="w-2.5 h-2.5" />}
                          {post.author_role}
                        </Badge>
                      )}
                      <div className="text-xs text-muted-foreground">
                        <div>{post.author_edits} edits</div>
                        <div>since {new Date(post.author_joined).getFullYear()}</div>
                      </div>
                    </div>
                    {/* Post body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(post.created_at)}</span>
                          {post.edit_count > 0 && (
                            <span className="text-xs">(edited {post.edit_count}x)</span>
                          )}
                          {idx === 0 && <Badge variant="secondary" className="text-xs py-0">OP</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                          {user && (post.author_id === user.id || user.role === 'admin') && !editingPostId && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEdit(post)}>
                                  <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setDeletePostId(post.id)}
                                  className="text-destructive focus:text-destructive">
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      <div className="px-4 py-4">
                        {editingPostId === post.id ? (
                          <div className="space-y-2">
                            {editError && (
                              <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground rounded p-2 text-xs">{editError}</div>
                            )}
                            <Textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                              placeholder="Edit your post..." rows={4}
                              className="bg-muted border-border resize-none" />
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => setEditingPostId(null)}>
                                <X className="w-3.5 h-3.5 mr-1" /> Cancel
                              </Button>
                              <Button size="sm" disabled={!editContent.trim() || editSubmitting}
                                onClick={submitEdit}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                {editSubmitting ? 'Saving...' : 'Save Edit'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm leading-relaxed text-foreground">
                            {post.is_deleted ? (
                              <em className="text-muted-foreground">This post has been removed.</em>
                            ) : (
                              <p style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Reply form */}
              {user && !thread?.is_locked && (
                <div className="bg-card border border-border rounded-lg p-5 mt-6">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Reply className="w-4 h-4 text-primary" /> Post a Reply
                  </h3>
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground rounded p-2 text-xs mb-3">{error}</div>
                  )}
                  <Textarea value={reply} onChange={e => setReply(e.target.value)}
                    placeholder="Write your reply..." rows={4}
                    className="bg-muted border-border resize-none mb-3" />
                  <div className="flex justify-end">
                    <Button disabled={!reply.trim() || submitting} onClick={submitReply}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                      <MessageSquare className="w-4 h-4" />
                      {submitting ? 'Posting...' : 'Post Reply'}
                    </Button>
                  </div>
                </div>
              )}

              {thread?.is_locked && (
                <div className="text-center py-6 text-sm text-muted-foreground flex items-center justify-center gap-2 bg-card border border-border rounded-lg">
                  <Lock className="w-4 h-4" /> This thread is locked.
                </div>
              )}
              {!user && (
                <div className="text-center py-6 text-sm text-muted-foreground bg-card border border-border rounded-lg">
                  <Link href="/login" className="text-primary hover:underline">Sign in</Link> to post a reply.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletePostId} onOpenChange={open => !open && setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  )
}
