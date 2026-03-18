'use client'

import Link from 'next/link'
import { BookOpen, Github } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="font-serif font-bold text-sm">The Forbidden Wiki</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              An open collaborative encyclopedia for knowledge without limits.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Content</h4>
            <ul className="space-y-1.5">
              {[
                { href: '/articles', label: 'All Articles' },
                { href: '/categories', label: 'Categories' },
                { href: '/media', label: 'Media Library' },
                { href: '/wiki/new', label: 'Create Article' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Community</h4>
            <ul className="space-y-1.5">
              {[
                { href: '/forum', label: 'Forum' },
                { href: '/forum/introductions', label: 'Introductions' },
                { href: '/forum/policy', label: 'Policies' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Account</h4>
            <ul className="space-y-1.5">
              {[
                { href: '/login', label: 'Log In' },
                { href: '/register', label: 'Register' },
                { href: '/watchlist', label: 'Watchlist' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Content available under{' '}
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" className="hover:text-foreground underline" target="_blank" rel="noopener noreferrer">
              CC BY-SA 4.0
            </a>
            {' '}unless otherwise noted.
          </p>
          <p className="text-xs text-muted-foreground">
            The Forbidden Wiki &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  )
}
