import type { Metadata } from 'next'
import { Inter, Lora, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-context'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const lora = Lora({ subsets: ['latin'], variable: '--font-serif' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'The Forbidden Wiki',
  description: 'The Forbidden Wiki — an open collaborative encyclopedia for knowledge without limits.',
  generator: 'v0.app',
  keywords: ['wiki', 'encyclopedia', 'knowledge', 'collaborative'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${lora.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
