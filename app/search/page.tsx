'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, truncate } from '@/lib/utils-wiki'
import { Search, FileText, TrendingUp, Clock, ChevronRight } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function SearchResults() {
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [input, setInput] = useState(searchParams.get('q') || '')

  const { data, isLoading } = useSWR(
    q ? `/api/articles?q=${encodeURIComponent(q)}&limit=20` : null, fetcher
  )
  const articles = data?.articles || []

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setQ(input.trim())
    window.history.pushState(null, '', input.trim() ? `?q=${encodeURIComponent(input.trim())}` : '/search')
  }

  return (
    <>
      <div className="max-w-2xl mx-auto mb-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={input} onChange={e => setInput(e.target.value)}
              placeholder="Search articles, topics, categories..."
              className="pl-10 h-11 bg-card border-border text-base" autoFocus />
          </div>
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6">
            Search
          </Button>
        </form>
      </div>

      {q && (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold">
              {isLoading ? 'Searching...' : `${articles.length} result${articles.length !== 1 ? 's' : ''} for "${q}"`}
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-lg">
              <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="font-serif text-lg font-medium mb-1">No results found</p>
              <p className="text-sm text-muted-foreground mb-4">
                No articles match your search. You can create one.
              </p>
              <Link href={`/wiki/new?title=${encodeURIComponent(q)}`}>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Create "{q}"
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article: {
                id: string; title: string; slug: string; summary: string | null;
                view_count: number; updated_at: string; author_name: string; category_name: string | null
              }) => (
                <Link key={article.id} href={`/wiki/${article.slug}`}
                  className="block bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors group">
                  <h3 className="font-serif font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p className="text-sm text-muted-foreground mb-2">{truncate(article.summary, 200)}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {article.category_name && (
                      <Badge variant="secondary" className="text-xs py-0">{article.category_name}</Badge>
                    )}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(article.updated_at)}</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{article.view_count} views</span>
                    <span>by {article.author_name}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {!q && (
        <div className="max-w-3xl mx-auto">
          <RecentArticles />
        </div>
      )}
    </>
  )
}

function RecentArticles() {
  const { data } = useSWR('/api/articles?limit=6', fetcher)
  const articles = data?.articles || []
  if (articles.length === 0) return null
  return (
    <div>
      <h2 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" /> Recent Articles
      </h2>
      <div className="space-y-2">
        {articles.map((a: { id: string; title: string; slug: string; category_name: string | null; updated_at: string }) => (
          <Link key={a.id} href={`/wiki/${a.slug}`}
            className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-primary/40 group transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-medium text-sm group-hover:text-primary transition-colors">{a.title}</span>
              {a.category_name && <Badge variant="secondary" className="text-xs py-0">{a.category_name}</Badge>}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              <span>{formatDate(a.updated_at)}</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl font-bold mb-2">Search the Wiki</h1>
            <p className="text-muted-foreground">Find articles, topics, and more</p>
          </div>
          <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
            <SearchResults />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
