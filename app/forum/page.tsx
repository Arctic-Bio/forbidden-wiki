'use client'

import useSWR from 'swr'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils-wiki'
import {
  MessageSquare, Pin, Lock, TrendingUp, Clock, Users, ChevronRight
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Board {
  id: string; name: string; slug: string; description: string | null
  thread_count: number; post_count: number; is_locked: boolean
}

export default function ForumPage() {
  const { data, isLoading } = useSWR('/api/forum', fetcher)
  const boards: Board[] = data?.boards || []

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Community Forum
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Discuss articles, policies, and connect with other contributors</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : (
            <div className="space-y-2">
              {boards.map(board => (
                <Link key={board.id} href={`/forum/${board.slug}`}
                  className="flex items-center gap-4 bg-card border border-border rounded-lg p-4 hover:border-primary/40 group transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-sm group-hover:text-primary transition-colors">{board.name}</h2>
                      {board.is_locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    {board.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{board.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-xs text-muted-foreground shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="font-medium text-foreground">{board.thread_count}</div>
                      <div>threads</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="font-medium text-foreground">{board.post_count}</div>
                      <div>posts</div>
                    </div>
                    <ChevronRight className="w-4 h-4 group-hover:text-primary transition-colors" />
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
