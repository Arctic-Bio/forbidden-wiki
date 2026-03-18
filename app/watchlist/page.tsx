'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { useAuth } from '@/components/auth-context'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils-wiki'
import { Star, FileText, Clock, X, BookOpen } from 'lucide-react'
import { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface WatchlistItem {
  id: string; title: string; slug: string; updated_at: string; last_editor: string | null
}

export default function WatchlistPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const { data, isLoading, mutate: refresh } = useSWR(user ? '/api/watchlist' : null, fetcher)
  const watchlist: WatchlistItem[] = data?.watchlist || []

  const unwatch = async (id: string) => {
    await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id: id }),
    })
    refresh()
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-accent" /> Watchlist
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Articles you're watching for changes</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {loading || isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : watchlist.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-lg">
              <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="font-serif text-xl font-medium mb-2">Your watchlist is empty</p>
              <p className="text-muted-foreground text-sm mb-6">
                Click the "Watch" button on any article to track changes.
              </p>
              <Link href="/articles">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <BookOpen className="w-4 h-4" /> Browse Articles
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{watchlist.length} article{watchlist.length !== 1 ? 's' : ''} watched</p>
              <div className="space-y-2">
                {watchlist.map(item => (
                  <div key={item.id}
                    className="flex items-center gap-4 bg-card border border-border rounded-lg p-3 hover:border-primary/20 transition-colors">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Link href={`/wiki/${item.slug}`} className="flex-1 min-w-0">
                      <p className="font-medium text-sm hover:text-primary transition-colors truncate">{item.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Updated {formatDate(item.updated_at)}</span>
                        {item.last_editor && <span>by {item.last_editor}</span>}
                      </div>
                    </Link>
                    <button onClick={() => unwatch(item.id)} title="Remove from watchlist"
                      className="text-muted-foreground hover:text-foreground shrink-0 p-1 hover:bg-muted rounded transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
