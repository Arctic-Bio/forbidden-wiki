'use client'

import { Suspense } from 'react'
import NewArticleContent from '@/components/new-article-content'
import Header from '@/components/header'
import Footer from '@/components/footer'

export default function NewArticlePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>}>
        <NewArticleContent />
      </Suspense>
      <Footer />
    </div>
  )
}
