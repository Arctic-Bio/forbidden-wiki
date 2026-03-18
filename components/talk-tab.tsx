'use client'

import useSWR from 'swr'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-context'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils-wiki'
import { MessageSquare, Plus, ChevronDown, ChevronUp, Send, User } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function TalkTab({ slug }: { slug: string }) {
  const { user } = useAuth()
  const { data, isLoading, mutate } = useSWR(`/api/articles/${slug}/talk`, fetcher)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedThread, setExpandedThread] = useState<string | null>(null)

  const threads = data?.threads || []

  const submitThread = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    setSubmitting(true)
    try {
      await fetch(`/api/articles/${slug}/talk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      })
      setNewTitle('')
      setNewContent('')
      setShowNew(false)
      mutate()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-xl font-semibold">Talk Page</h3>
        {user && (
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 h-8"
            onClick={() => setShowNew(!showNew)}>
            <Plus className="w-3.5 h-3.5" /> New Thread
          </Button>
        )}
      </div>

      {showNew && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-sm mb-3">Start a new discussion</h4>
          <Input
            placeholder="Thread title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="mb-3 bg-muted border-border"
          />
          <Textarea
            placeholder="Write your message..."
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            rows={4}
            className="mb-3 bg-muted border-border resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button size="sm" disabled={submitting} onClick={submitThread}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
              <Send className="w-3.5 h-3.5" /> Post
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : threads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-serif text-lg mb-1">No discussions yet</p>
          <p className="text-sm">Start a conversation about this article.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread: { id: string; title: string; author_name: string; post_count: number; is_resolved: boolean; created_at: string; updated_at: string }) => (
            <TalkThread key={thread.id} thread={thread} isExpanded={expandedThread === thread.id}
              onToggle={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
              user={user} slug={slug} onReply={() => mutate()} />
          ))}
        </div>
      )}
    </div>
  )
}

function TalkThread({ thread, isExpanded, onToggle, user, slug, onReply }: {
  thread: { id: string; title: string; author_name: string; post_count: number; is_resolved: boolean; created_at: string; updated_at: string }
  isExpanded: boolean; onToggle: () => void; user: { username: string } | null; slug: string; onReply: () => void
}) {
  const { data } = useSWR(isExpanded ? `/api/talk-thread/${thread.id}` : null, fetcher)
  const [reply, setReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const posts = data?.posts || []

  const submitReply = async () => {
    if (!reply.trim()) return
    setSubmitting(true)
    try {
      await fetch(`/api/talk-thread/${thread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply }),
      })
      setReply('')
      onReply()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors text-left">
        <div>
          <p className="font-medium text-sm">{thread.title}</p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span>{thread.author_name}</span>
            <span>·</span>
            <span>{Number(thread.post_count)} {Number(thread.post_count) === 1 ? 'reply' : 'replies'}</span>
            <span>·</span>
            <span>{formatDate(thread.updated_at)}</span>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          {posts.map((post: { id: string; author_name: string; content: string; created_at: string }) => (
            <div key={post.id} className="px-4 py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <Link href={`/user/${post.author_name}`} className="text-xs font-semibold hover:text-primary">{post.author_name}</Link>
                <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
            </div>
          ))}
          {user && (
            <div className="p-4 bg-muted/30">
              <Textarea
                placeholder="Reply to this thread..."
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={3}
                className="mb-2 bg-muted border-border resize-none text-sm"
              />
              <div className="flex justify-end">
                <Button size="sm" disabled={submitting} onClick={submitReply}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 h-7 text-xs">
                  <Send className="w-3 h-3" /> Reply
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
