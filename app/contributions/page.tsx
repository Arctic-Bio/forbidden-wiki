'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { useAuth } from '@/components/auth-context'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils-wiki'
import {
  BookOpen, PenSquare, MessageSquare, Image, Clock,
  FileText, ChevronRight, Activity
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Contribution {
  id: string
  type: string
  target_id: string
  target_title: string | null
  article_slug: string | null
  created_at: string
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  article_create: { label: 'Created article', icon: BookOpen, color: 'text-green-500' },
  article_edit:   { label: 'Edited article',  icon: PenSquare,  color: 'text-primary'   },
  talk_post:      { label: 'Talk page post',  icon: MessageSquare, color: 'text-accent'  },
  forum_post:     { label: 'Forum post',      icon: MessageSquare, color: 'text-accent'  },
  media_upload:   { label: 'Uploaded media',  icon: Image,         color: 'text-blue-400'},
}

export default function ContributionsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const { data, isLoading } = useSWR(
    user ? `/api/user/${user.username}` : null, fetcher
  )
  const contributions: Contribution[] = data?.contributions || []

  // Group by date
  const grouped: Record<string, Contribution[]> = {}
  contributions.forEach(c => {
    const date = new Date(c.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(c)
  })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> My Contributions
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your complete editing history on The Forbidden Wiki
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Stats bar */}
          {user && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: PenSquare, label: 'Total Edits', value: user.edit_count },
                { icon: FileText, label: 'Contributions', value: contributions.length },
                { icon: Clock, label: 'Member Since', value: null },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-lg font-bold font-mono">{value ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading || isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-14 rounded-lg" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : contributions.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-lg">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="font-serif text-xl font-medium mb-2">No contributions yet</p>
              <p className="text-muted-foreground text-sm mb-6">Start by editing or creating an article.</p>
              <Link href="/wiki/new" className="text-primary hover:underline font-medium flex items-center gap-1 justify-center">
                <PenSquare className="w-4 h-4" /> Create your first article
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([date, items]) => (
                <div key={date}>
                  <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> {date}
                    <Badge variant="secondary" className="text-xs py-0">{items.length}</Badge>
                  </h2>
                  <div className="space-y-1.5 border-l-2 border-border pl-4">
                    {items.map(c => {
                      const cfg = typeConfig[c.type] || { label: c.type, icon: FileText, color: 'text-muted-foreground' }
                      const Icon = cfg.icon
                      return (
                        <div key={c.id}
                          className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors">
                          <div className={`w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 ${cfg.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-muted-foreground">{cfg.label}: </span>
                            {c.article_slug ? (
                              <Link href={`/wiki/${c.article_slug}`}
                                className="text-sm font-medium hover:text-primary transition-colors">
                                {c.target_title || c.target_id}
                              </Link>
                            ) : (
                              <span className="text-sm font-medium">{c.target_title || c.target_id}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {new Date(c.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {c.article_slug && (
                              <Link href={`/wiki/${c.article_slug}`}>
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                              </Link>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
