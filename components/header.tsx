'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/components/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  BookOpen, Search, PenSquare, User, LogOut, Settings,
  Bell, Shield, ChevronDown, Menu, X, Star, BookMarked
} from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`)
      setSearch('')
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-serif font-bold text-lg text-foreground hidden sm:block">
              The <span className="text-primary">Forbidden</span> Wiki
            </span>
            <span className="font-serif font-bold text-lg text-foreground sm:hidden">TFW</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search the wiki..."
                className="pl-9 h-9 bg-muted border-border text-sm"
              />
            </div>
          </form>

          {/* Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/articles" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded hover:bg-muted transition-colors">
              Articles
            </Link>
            <Link href="/categories" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded hover:bg-muted transition-colors">
              Categories
            </Link>
            <Link href="/forum" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded hover:bg-muted transition-colors">
              Forum
            </Link>
            <Link href="/media" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded hover:bg-muted transition-colors">
              Media
            </Link>
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <Link href="/wiki/new">
                  <Button size="sm" className="hidden sm:flex gap-1.5 h-8 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <PenSquare className="w-3.5 h-3.5" />
                    New Article
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 h-8">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                        {(user.display_name || user.username).charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden sm:block text-sm">{user.display_name || user.username}</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                    <DropdownMenuItem asChild>
                      <Link href={`/user/${user.username}`} className="flex items-center gap-2">
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/watchlist" className="flex items-center gap-2">
                        <Star className="w-4 h-4" /> Watchlist
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/contributions" className="flex items-center gap-2">
                        <BookMarked className="w-4 h-4" /> Contributions
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive-foreground">
                      <LogOut className="w-4 h-4 mr-2" /> Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="h-8 text-sm">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="h-8 text-sm bg-primary hover:bg-primary/90 text-primary-foreground">Join</Button>
                </Link>
              </div>
            )}
            {/* Mobile menu */}
            <Button variant="ghost" size="sm" className="md:hidden h-8 w-8 p-0" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-3 flex flex-col gap-1">
            {[
              { href: '/articles', label: 'Articles' },
              { href: '/categories', label: 'Categories' },
              { href: '/forum', label: 'Forum' },
              { href: '/media', label: 'Media' },
              ...(user ? [{ href: '/wiki/new', label: 'New Article' }] : []),
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="px-3 py-2 text-sm rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(false)}>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
