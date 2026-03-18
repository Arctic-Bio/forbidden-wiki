'use client'

import useSWR from 'swr'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ChevronRight, Layers } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Category {
  id: string; name: string; slug: string; description: string | null; article_count: number
}

export default function CategoriesPage() {
  const { data, isLoading } = useSWR('/api/categories', fetcher)
  const categories: Category[] = data?.categories || []

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" /> Categories
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Browse articles organized by topic</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => (
                <Link key={cat.id} href={`/categories/${cat.slug}`}
                  className="block bg-card border border-border rounded-lg p-5 hover:border-primary/40 group transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="font-serif font-semibold text-base group-hover:text-primary transition-colors">
                      {cat.name}
                    </h2>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary mt-0.5 shrink-0" />
                  </div>
                  {cat.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{cat.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BookOpen className="w-3 h-3" />
                    <span>{cat.article_count} article{cat.article_count !== 1 ? 's' : ''}</span>
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
