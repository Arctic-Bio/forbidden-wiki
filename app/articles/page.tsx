'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { formatDate, truncate } from '@/lib/utils-wiki'
import { BookOpen, TrendingUp, Clock, ChevronLeft, ChevronRight, PenSquare } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Article {
  id: string; title: string; slug: string; summary: string | null
  view_count: number; updated_at: string; author_name: string; category_name: string | null
}
interface Category { id: string; name: string; slug: string }

function ArticlesList() {
  const searchParams = useSearchParams()
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sort, setSort] = useState('recent')
  const LIMIT = 20

  const { data, isLoading } = useSWR(
    `/api/articles?page=${page}&limit=${LIMIT}${category ? `&category=${category}` : ''}&sort=${sort}`, fetcher
  )
  const { data: catData } = useSWR('/api/categories', fetcher)
  const articles: Article[] = data?.articles || []
  const categories: Category[] = catData?.categories || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Filters sidebar */}
      <aside className="lg:col-span-1">
        <div className="bg-card border border-border rounded-lg overflow-hidden sticky top-20">
          <div className="px-4 py-3 border-b border-border bg-secondary/30">
            <h2 className="font-semibold text-sm">Filter Articles</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Sort by</label>
              <Select value={sort} onValueChange={v => { setSort(v); setPage(1) }}>
                <SelectTrigger className="bg-muted border-border h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Viewed</SelectItem>
                  <SelectItem value="az">A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Category</label>
              <div className="space-y-1">
                <button onClick={() => { setCategory(''); setPage(1) }}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${!category ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
                  All Categories
                </button>
                {categories.map(c => (
                  <button key={c.id} onClick={() => { setCategory(c.slug); setPage(1) }}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors truncate ${category === c.slug ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Article list */}
      <div className="lg:col-span-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-lg">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="font-serif text-xl font-medium mb-2">No articles found</p>
            <p className="text-muted-foreground text-sm mb-6">Be the first to contribute.</p>
            <Link href="/wiki/new">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <PenSquare className="w-4 h-4" /> Create Article
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {articles.map(article => (
                <Link key={article.id} href={`/wiki/${article.slug}`}
                  className="block bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      {article.summary && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{truncate(article.summary, 160)}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {article.category_name && (
                          <Badge variant="secondary" className="text-xs py-0">{article.category_name}</Badge>
                        )}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(article.updated_at)}</span>
                        <span>by {article.author_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <TrendingUp className="w-3 h-3" />
                      {article.view_count.toLocaleString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="gap-1.5 border-border">
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button variant="outline" size="sm" disabled={articles.length < LIMIT} onClick={() => setPage(p => p + 1)}
                className="gap-1.5 border-border">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ArticlesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> All Articles
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Browse the full encyclopedia</p>
            </div>
            <Link href="/wiki/new">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 hidden sm:flex">
                <PenSquare className="w-4 h-4" /> New Article
              </Button>
            </Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <ArticlesList />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
