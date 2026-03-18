'use client'

import useSWR from 'swr'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, truncate } from '@/lib/utils-wiki'
import {
  BookOpen, TrendingUp, Clock, Star, Users, FileText,
  Image as ImageIcon, MessageSquare, ChevronRight, PenSquare, ArrowRight
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Article {
  id: string; title: string; slug: string; summary: string | null
  view_count: number; updated_at: string; author_name: string; category_name: string | null
}
interface Category { id: string; name: string; slug: string; description: string | null; article_count: number }
interface Stats { article_count: number; user_count: number; media_count: number; thread_count: number }

export default function HomePage() {
  const { data, isLoading } = useSWR('/api/home', fetcher)

  const stats: Stats = data?.stats || {}
  const categories: Category[] = data?.categories || []
  const featured: Article[] = data?.featured || []
  const recent: Article[] = data?.recent || []
  const popular: Article[] = data?.popular || []

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs text-primary font-semibold uppercase tracking-widest mb-4">
                <BookOpen className="w-3.5 h-3.5" />
                The Open Encyclopedia
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
                The <span className="text-primary">Forbidden</span> Wiki
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                A collaborative encyclopedia for knowledge without limits. Read, write, and contribute to articles on any topic.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/articles">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                    <BookOpen className="w-4 h-4" /> Browse Articles
                  </Button>
                </Link>
                <Link href="/wiki/new">
                  <Button variant="outline" className="border-border gap-2">
                    <PenSquare className="w-4 h-4" /> Create Article
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
              {[
                { label: 'Articles', value: stats.article_count || 0, icon: FileText },
                { label: 'Contributors', value: stats.user_count || 0, icon: Users },
                { label: 'Media Files', value: stats.media_count || 0, icon: ImageIcon },
                { label: 'Forum Threads', value: stats.thread_count || 0, icon: MessageSquare },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 py-5 px-4 md:px-6">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-bold font-mono">{value.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Featured articles */}
              {(featured.length > 0 || isLoading) && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-xl font-semibold flex items-center gap-2">
                      <Star className="w-4 h-4 text-accent" /> Featured Articles
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isLoading ? Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-36 rounded-lg" />
                    )) : featured.map(article => (
                      <ArticleCard key={article.id} article={article} featured />
                    ))}
                  </div>
                </section>
              )}

              {/* Recent articles */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-xl font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" /> Recently Updated
                  </h2>
                  <Link href="/articles" className="text-sm text-primary hover:underline flex items-center gap-1">
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  )) : recent.slice(0, 5).map(article => (
                    <ArticleRow key={article.id} article={article} />
                  ))}
                  {!isLoading && recent.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="font-serif text-xl mb-2">No articles yet</p>
                      <p className="text-sm mb-6">Be the first to contribute to the wiki.</p>
                      <Link href="/wiki/new">
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                          Create the first article
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Popular articles */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Popular Articles</h3>
                </div>
                <div className="p-1">
                  {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 m-1 rounded" />
                  )) : popular.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-4 text-center">No articles yet</p>
                  ) : popular.map((article, i) => (
                    <Link key={article.id} href={`/wiki/${article.slug}`}
                      className="flex items-center gap-3 px-3 py-2 rounded hover:bg-muted group transition-colors">
                      <span className="text-xs font-mono font-bold text-primary w-5 shrink-0">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{article.title}</p>
                        {article.category_name && (
                          <p className="text-xs text-muted-foreground">{article.category_name}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Browse Categories</h3>
                  <Link href="/categories" className="text-xs text-primary hover:underline">All</Link>
                </div>
                <div className="p-2">
                  {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 m-1 rounded" />
                  )) : categories.slice(0, 8).map(cat => (
                    <Link key={cat.id} href={`/categories/${cat.slug}`}
                      className="flex items-center justify-between px-3 py-1.5 rounded hover:bg-muted group transition-colors">
                      <span className="text-sm group-hover:text-primary transition-colors">{cat.name}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-secondary/30">
                  <h3 className="font-semibold text-sm">Quick Links</h3>
                </div>
                <div className="p-2">
                  {[
                    { href: '/wiki/new', label: 'Create Article', icon: PenSquare },
                    { href: '/forum', label: 'Community Forum', icon: MessageSquare },
                    { href: '/media', label: 'Media Library', icon: ImageIcon },
                    { href: '/register', label: 'Join the Wiki', icon: Users },
                  ].map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href}
                      className="flex items-center gap-3 px-3 py-2 rounded hover:bg-muted group transition-colors">
                      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                      <span className="text-sm group-hover:text-primary transition-colors">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function ArticleCard({ article, featured }: { article: Article; featured?: boolean }) {
  return (
    <Link href={`/wiki/${article.slug}`}
      className="block bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors group">
      {featured && (
        <div className="flex items-center gap-1 text-accent text-xs font-semibold mb-2">
          <Star className="w-3 h-3" /> Featured
        </div>
      )}
      <h3 className="font-serif font-semibold text-base mb-1 group-hover:text-primary transition-colors line-clamp-2">
        {article.title}
      </h3>
      {article.summary && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{article.summary}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {article.category_name && <Badge variant="secondary" className="text-xs py-0">{article.category_name}</Badge>}
        <span>{formatDate(article.updated_at)}</span>
      </div>
    </Link>
  )
}

function ArticleRow({ article }: { article: Article }) {
  return (
    <Link href={`/wiki/${article.slug}`}
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted group transition-colors">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">{article.title}</h3>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          {article.category_name && <span>{article.category_name}</span>}
          <span>·</span>
          <span>by {article.author_name}</span>
          <span>·</span>
          <span>{formatDate(article.updated_at)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <TrendingUp className="w-3 h-3" />
        {article.view_count}
      </div>
    </Link>
  )
}
