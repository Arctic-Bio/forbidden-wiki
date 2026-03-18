'use client'

import useSWR from 'swr'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { useAuth } from '@/components/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils-wiki'
import {
  PenSquare, Eye, MessageSquare, History, Star, Lock,
  Share2, BookMarked, Tag, ChevronRight, AlertTriangle, User
} from 'lucide-react'
import TalkTab from '@/components/talk-tab'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ArticlePage() {
  const params = useParams()
  const slug = params.slug as string
  const { user } = useAuth()
  const router = useRouter()
  const [watching, setWatching] = useState(false)

  const { data, isLoading, error } = useSWR(`/api/articles/${slug}`, fetcher)
  const { data: watchData } = useSWR(
    user && data?.article ? `/api/watchlist?article_id=${data.article.id}` : null, fetcher
  )

  if (watchData && watching !== watchData.watching) setWatching(watchData.watching)

  const toggleWatch = async () => {
    if (!user || !data?.article) return
    const method = watching ? 'DELETE' : 'POST'
    await fetch('/api/watchlist', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id: data.article.id }),
    })
    setWatching(!watching)
  }

  if (error || (!isLoading && !data?.article)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center py-20">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <h1 className="font-serif text-2xl font-bold mb-2">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This article does not exist yet. Would you like to create it?
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
              <Link href={`/wiki/new?title=${encodeURIComponent(slug.replace(/-/g, ' '))}`}>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <PenSquare className="w-4 h-4" /> Create This Article
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const article = data?.article

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/articles" className="hover:text-foreground">Articles</Link>
            {article?.category_name && (
              <>
                <ChevronRight className="w-3 h-3" />
                <Link href={`/categories/${article.category_slug}`} className="hover:text-foreground">
                  {article.category_name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground truncate max-w-48">{article?.title || '...'}</span>
          </nav>

          <Tabs defaultValue="article">
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div className="flex-1 min-w-0">
                {isLoading ? (
                  <Skeleton className="h-9 w-64 mb-2" />
                ) : (
                  <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground text-balance">
                    {article?.title}
                  </h1>
                )}
                <div className="flex items-center flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                  {article?.is_locked && (
                    <span className="flex items-center gap-1 text-accent">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                  {article?.is_featured && (
                    <span className="flex items-center gap-1 text-accent">
                      <Star className="w-3 h-3" /> Featured
                    </span>
                  )}
                  {article?.author_name && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <Link href={`/user/${article.author_name}`} className="hover:text-foreground hover:underline">
                        {article.author_display || article.author_name}
                      </Link>
                    </span>
                  )}
                  {article?.updated_at && (
                    <span>Last updated {formatDate(article.updated_at)}</span>
                  )}
                  {article?.view_count !== undefined && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {article.view_count.toLocaleString()} views
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {user && !article?.is_locked && (
                  <Link href={`/wiki/${slug}/edit`}>
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 border-border">
                      <PenSquare className="w-3.5 h-3.5" /> Edit
                    </Button>
                  </Link>
                )}
                {user && (
                  <Button size="sm" variant="outline" onClick={toggleWatch}
                    className={`gap-1.5 h-8 border-border ${watching ? 'text-accent border-accent/50' : ''}`}>
                    <Star className="w-3.5 h-3.5" />
                    {watching ? 'Watching' : 'Watch'}
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                  onClick={() => navigator.clipboard.writeText(window.location.href)}>
                  <Share2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <TabsList className="bg-muted border-b border-border rounded-none h-auto p-0 w-full justify-start gap-0 mb-6">
              <TabsTrigger value="article" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 gap-1.5 text-sm">
                <BookMarked className="w-3.5 h-3.5" /> Article
              </TabsTrigger>
              <TabsTrigger value="talk" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 gap-1.5 text-sm">
                <MessageSquare className="w-3.5 h-3.5" /> Talk
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 gap-1.5 text-sm">
                <History className="w-3.5 h-3.5" /> History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="article">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Article content */}
                <div className="lg:col-span-3">
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                    </div>
                  ) : (
                    <>
                      {article?.summary && (
                        <div className="bg-wiki-infobox border border-border rounded-lg p-4 mb-6 italic text-muted-foreground text-sm">
                          {article.summary}
                        </div>
                      )}
                      {article?.infobox && <Infobox data={article.infobox} />}
                      <div className="wiki-content prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: renderContent(article?.content || '') }} />
                      {/* Media gallery */}
                      {article?.media?.length > 0 && (
                        <div className="mt-8 border-t border-border pt-6">
                          <h3 className="font-serif text-lg font-semibold mb-4">Media</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {article.media.map((m: { id: string; blob_url: string; media_type: string; caption?: string; alt_text?: string }) => (
                              <div key={m.id} className="rounded-lg overflow-hidden border border-border bg-card">
                                {m.media_type === 'image' ? (
                                  <img src={m.blob_url} alt={m.alt_text || ''} className="w-full h-32 object-cover" />
                                ) : m.media_type === 'video' ? (
                                  <video src={m.blob_url} controls className="w-full h-32 object-cover" />
                                ) : null}
                                {m.caption && <p className="text-xs text-muted-foreground p-2">{m.caption}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Tags */}
                      {article?.tags?.length > 0 && (
                        <div className="mt-6 flex items-center gap-2 flex-wrap">
                          <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                          {article.tags.map((t: { name: string; slug: string }) => (
                            <Link key={t.slug} href={`/search?tag=${t.slug}`}>
                              <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-primary/20">{t.name}</Badge>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Sidebar TOC */}
                {!isLoading && article?.content && (
                  <aside className="hidden lg:block">
                    <TableOfContents content={article.content} />
                  </aside>
                )}
              </div>
            </TabsContent>

            <TabsContent value="talk">
              <TalkTab slug={slug} />
            </TabsContent>

            <TabsContent value="history">
              <HistoryTab slug={slug} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function Infobox({ data }: { data: Record<string, string> }) {
  return (
    <div className="float-right ml-6 mb-4 w-64 bg-[var(--wiki-infobox)] border border-border rounded-lg overflow-hidden text-sm">
      <div className="bg-[var(--wiki-infobox-header)] text-primary-foreground px-3 py-2 font-semibold text-center text-xs uppercase tracking-wider">
        Information
      </div>
      <table className="w-full">
        <tbody>
          {Object.entries(data).map(([k, v]) => (
            <tr key={k} className="border-t border-border">
              <td className="px-3 py-1.5 font-medium text-muted-foreground text-xs w-2/5">{k}</td>
              <td className="px-3 py-1.5 text-xs">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TableOfContents({ content }: { content: string }) {
  const headings: { level: number; text: string; id: string }[] = []
  const lines = content.split('\n')
  lines.forEach(line => {
    const m = line.match(/^(#{1,3})\s+(.+)$/)
    if (m) {
      headings.push({ level: m[1].length, text: m[2], id: m[2].toLowerCase().replace(/[^\w]+/g, '-') })
    }
  })
  if (headings.length === 0) return null
  return (
    <div className="bg-[var(--wiki-toc-bg)] border border-border rounded-lg p-4 sticky top-20">
      <h4 className="font-semibold text-sm mb-3 font-serif">Contents</h4>
      <ul className="space-y-1">
        {headings.map((h, i) => (
          <li key={i} style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
            <a href={`#${h.id}`} className="text-xs text-[var(--wiki-link)] hover:underline block py-0.5">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function HistoryTab({ slug }: { slug: string }) {
  const { data, isLoading } = useSWR(`/api/articles/${slug}/history`, fetcher)
  const revisions = data?.revisions || []

  return (
    <div className="max-w-3xl">
      <h3 className="font-serif text-xl font-semibold mb-4">Revision History</h3>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : revisions.length === 0 ? (
        <p className="text-muted-foreground text-sm">No revision history available.</p>
      ) : (
        <div className="space-y-2">
          {revisions.map((rev: { id: string; revision_number: number; editor_name: string; edit_summary?: string; byte_size: number; is_minor_edit: boolean; created_at: string }, i: number) => (
            <div key={rev.id} className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg text-sm">
              <span className="font-mono text-xs text-muted-foreground w-8 shrink-0">r{rev.revision_number}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/user/${rev.editor_name}`} className="font-medium hover:text-primary text-sm">
                    {rev.editor_name}
                  </Link>
                  {rev.is_minor_edit && <Badge variant="secondary" className="text-xs py-0">minor</Badge>}
                  {i === 0 && <Badge className="text-xs py-0 bg-primary/20 text-primary border-primary/30">current</Badge>}
                </div>
                {rev.edit_summary && <p className="text-xs text-muted-foreground mt-0.5 truncate">{rev.edit_summary}</p>}
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-muted-foreground">{formatDate(rev.created_at)}</div>
                <div className="text-xs text-muted-foreground font-mono">{rev.byte_size?.toLocaleString()} bytes</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function renderContent(markdown: string): string {
  return markdown
    .replace(/^### (.+)$/gm, (_, t) => `<h3 id="${t.toLowerCase().replace(/[^\w]+/g, '-')}">${t}</h3>`)
    .replace(/^## (.+)$/gm, (_, t) => `<h2 id="${t.toLowerCase().replace(/[^\w]+/g, '-')}">${t}</h2>`)
    .replace(/^# (.+)$/gm, (_, t) => `<h1 id="${t.toLowerCase().replace(/[^\w]+/g, '-')}">${t}</h1>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[\[(.+?)\]\]/g, (_, t) => `<a href="/wiki/${t.toLowerCase().replace(/\s+/g, '-')}">${t}</a>`)
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h1-6brp]|<\/p>)(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
}
