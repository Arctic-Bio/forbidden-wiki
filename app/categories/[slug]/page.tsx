'use client'

import { use } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatDate, truncate } from '@/lib/utils-wiki'
import { BookOpen, TrendingUp, Clock, ChevronRight, ArrowLeft } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Article {
  id: string; title: string; slug: string; summary: string | null;
  view_count: number; updated_at: string; author_name: string
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { data: articlesData, isLoading } = useSWR(`/api/articles?category=${slug}&limit=50`, fetcher)
  const { data: catData } = useSWR('/api/categories', fetcher)

  const articles: Article[] = articlesData?.articles || []
  const categories = catData?.categories || []
  const category = categories.find((c: { slug: string; name: string; description: string | null }) => c.slug === slug)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/categories" className="hover:text-foreground">Categories</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground">{category?.name || slug}</span>
            </nav>
            <h1 className="font-serif text-2xl font-bold">{category?.name || slug}</h1>
            {category?.description && (
              <p className="text-muted-foreground text-sm mt-1">{category.description}</p>
            )}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
          </div>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-lg">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="font-serif text-xl font-medium mb-2">No articles yet</p>
              <Link href={`/wiki/new`}>
                <span className="text-primary text-sm hover:underline cursor-pointer">Create the first article in this category</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map(article => (
                <Link key={article.id} href={`/wiki/${article.slug}`}
                  className="block bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-semibold group-hover:text-primary transition-colors mb-1">{article.title}</h3>
                      {article.summary && (
                        <p className="text-sm text-muted-foreground">{truncate(article.summary, 180)}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(article.updated_at)}</span>
                        <span>by {article.author_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <TrendingUp className="w-3 h-3" />{article.view_count}
                    </div>
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
