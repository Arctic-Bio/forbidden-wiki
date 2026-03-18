'use client'

import { use } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { useAuth } from '@/components/auth-context'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils-wiki'
import {
  User, BookOpen, PenSquare, Shield, CalendarDays,
  FileText, Clock, TrendingUp, MessageSquare
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface UserProfile {
  id: string; username: string; display_name: string | null; bio: string | null
  avatar_url: string | null; role: string; edit_count: number; created_at: string
}
interface Contribution {
  id: string; type: string; target_id: string; target_title: string | null
  article_title: string | null; article_slug: string | null; created_at: string
}
interface Article {
  id: string; title: string; slug: string; created_at: string; view_count: number
}

export default function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const { user: currentUser } = useAuth()

  const { data, isLoading } = useSWR(`/api/user/${username}`, fetcher)
  const profile: UserProfile | null = data?.user || null
  const contributions: Contribution[] = data?.contributions || []
  const articles: Article[] = data?.articles || []

  if (!isLoading && !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center py-20">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h1 className="font-serif text-2xl font-bold mb-2">User Not Found</h1>
            <p className="text-muted-foreground">The user "{username}" does not exist.</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const isOwnProfile = currentUser?.username === username

  const roleColor = profile?.role === 'admin' ? 'text-red-500' : profile?.role === 'moderator' ? 'text-accent' : 'text-muted-foreground'
  const roleIcon = profile?.role === 'admin' || profile?.role === 'moderator' ? <Shield className="w-3 h-3" /> : null

  const typeLabel = (type: string) => {
    if (type === 'edit') return 'Edited article'
    if (type === 'create') return 'Created article'
    if (type === 'forum_post') return 'Forum post'
    if (type === 'talk') return 'Talk page'
    return type
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border-2 border-border">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {isLoading ? (
                  <>
                    <Skeleton className="h-7 w-40 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </>
                ) : (
                  <>
                    <h1 className="font-serif text-2xl font-bold">
                      {profile?.display_name || profile?.username}
                    </h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                      <span>@{profile?.username}</span>
                      {profile?.role !== 'user' && (
                        <span className={`flex items-center gap-1 font-medium ${roleColor}`}>
                          {roleIcon} {profile?.role}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <PenSquare className="w-3.5 h-3.5" /> {profile?.edit_count} edits
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" /> Joined {profile ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '...'}
                      </span>
                    </div>
                    {profile?.bio && (
                      <p className="mt-3 text-sm text-foreground/80 max-w-xl">{profile.bio}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6">
          <Tabs defaultValue="contributions">
            <TabsList className="bg-muted h-9 mb-6">
              <TabsTrigger value="contributions" className="text-xs h-7 gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Recent Activity
              </TabsTrigger>
              <TabsTrigger value="articles" className="text-xs h-7 gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Articles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contributions">
              {isLoading ? (
                <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
              ) : contributions.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-lg">
                  <Clock className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground text-sm">No activity yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contributions.map(c => (
                    <div key={c.id} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {c.type === 'forum_post' ? <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" /> :
                         c.type === 'create' ? <BookOpen className="w-3.5 h-3.5 text-primary" /> :
                         <PenSquare className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-muted-foreground">{typeLabel(c.type)}: </span>
                        {c.article_slug ? (
                          <Link href={`/wiki/${c.article_slug}`} className="text-xs font-medium hover:text-primary">
                            {c.article_title || c.target_title}
                          </Link>
                        ) : (
                          <span className="text-xs font-medium">{c.target_title}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{formatDate(c.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="articles">
              {isLoading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
              ) : articles.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-lg">
                  <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground text-sm">No articles created.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {articles.map(a => (
                    <Link key={a.id} href={`/wiki/${a.slug}`}
                      className="flex items-center justify-between bg-card border border-border rounded-lg p-3 hover:border-primary/40 group transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">{a.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{a.view_count}</span>
                        <span>{formatDate(a.created_at)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
