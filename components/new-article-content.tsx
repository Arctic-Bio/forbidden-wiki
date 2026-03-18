'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import { useAuth } from '@/components/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Bold, Italic, Link as LinkIcon, List, ListOrdered, Quote,
  Heading1, Heading2, Heading3, Code, Eye, PenSquare, Save,
  Table, Minus, Plus, X, Upload
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Category { id: string; name: string; slug: string }

export default function NewArticleContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillTitle = searchParams.get('title') || ''

  const [title, setTitle] = useState(prefillTitle)
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [editSummary, setEditSummary] = useState('')
  const [isMinor, setIsMinor] = useState(false)
  const [infoboxRows, setInfoboxRows] = useState<{ key: string; value: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)

  const { data: catData } = useSWR('/api/categories', fetcher)
  const categories: Category[] = catData?.categories || []

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const insertAtCursor = (before: string, after = '') => {
    const ta = document.getElementById('wiki-editor') as HTMLTextAreaElement
    if (!ta) return
    const start = ta.selectionStart, end = ta.selectionEnd
    const selected = content.slice(start, end)
    const newVal = content.slice(0, start) + before + selected + after + content.slice(end)
    setContent(newVal)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + before.length, end + before.length) }, 0)
  }

  const addTag = () => {
    const t = tagsInput.trim()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagsInput('')
  }

  const addInfoboxRow = () => setInfoboxRows([...infoboxRows, { key: '', value: '' }])

  const submit = async () => {
    if (!title.trim() || !content.trim()) { setError('Title and content are required.'); return }
    setSubmitting(true); setError('')
    try {
      const infobox = infoboxRows.reduce((acc, r) => {
        if (r.key.trim()) acc[r.key.trim()] = r.value.trim()
        return acc
      }, {} as Record<string, string>)

      const res = await fetch('/api/articles/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, content, summary, category_id: categoryId || null,
          tags, edit_summary: editSummary, is_minor_edit: isMinor,
          infobox: Object.keys(infobox).length > 0 ? infobox : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save article'); return }
      router.push(`/wiki/${data.slug}`)
    } catch {
      setError('Unexpected error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <main className="flex-1">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
            <PenSquare className="w-5 h-5 text-primary" /> Create New Article
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPreview(!preview)} className="gap-1.5 h-8">
              {preview ? <PenSquare className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {preview ? 'Edit' : 'Preview'}
            </Button>
            <Button size="sm" disabled={submitting} onClick={submit}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 h-8">
              <Save className="w-3.5 h-3.5" />
              {submitting ? 'Saving...' : 'Publish Article'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Title */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Article Title *</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter article title..."
                className="text-lg font-serif bg-card border-border h-11"
              />
            </div>

            {/* Editor */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Content *</Label>
              {!preview ? (
                <>
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 flex-wrap bg-muted border border-border rounded-t-lg px-2 py-1.5">
                    {[
                      { icon: Heading1, action: () => insertAtCursor('# '), title: 'Heading 1' },
                      { icon: Heading2, action: () => insertAtCursor('## '), title: 'Heading 2' },
                      { icon: Heading3, action: () => insertAtCursor('### '), title: 'Heading 3' },
                      { icon: Bold, action: () => insertAtCursor('**', '**'), title: 'Bold' },
                      { icon: Italic, action: () => insertAtCursor('*', '*'), title: 'Italic' },
                      { icon: Code, action: () => insertAtCursor('`', '`'), title: 'Code' },
                      { icon: Quote, action: () => insertAtCursor('> '), title: 'Quote' },
                      { icon: List, action: () => insertAtCursor('- '), title: 'List' },
                      { icon: ListOrdered, action: () => insertAtCursor('1. '), title: 'Ordered List' },
                      { icon: LinkIcon, action: () => insertAtCursor('[', '](url)'), title: 'Link' },
                      { icon: Minus, action: () => insertAtCursor('\n---\n'), title: 'Divider' },
                      { icon: Table, action: () => insertAtCursor('\n| Column 1 | Column 2 |\n| --- | --- |\n| Cell | Cell |\n'), title: 'Table' },
                    ].map(({ icon: Icon, action, title: ttl }) => (
                      <button key={ttl} type="button" onClick={action} title={ttl}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    ))}
                    <div className="ml-2 text-xs text-muted-foreground">Use [[Article Title]] for wiki links</div>
                  </div>
                  <Textarea
                    id="wiki-editor"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Write your article content here using Markdown formatting..."
                    rows={22}
                    className="rounded-t-none border-t-0 bg-card border-border font-mono text-sm resize-none"
                  />
                </>
              ) : (
                <div className="border border-border rounded-lg p-6 min-h-[500px] bg-card wiki-content"
                  dangerouslySetInnerHTML={{ __html: renderPreview(content) }} />
              )}
            </div>

            {/* Summary */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Article Summary</Label>
              <Textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Brief description for search results and previews..."
                rows={3}
                className="bg-card border-border resize-none text-sm"
              />
            </div>

            {/* Edit summary + minor */}
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-48">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Edit Summary</Label>
                <Input
                  value={editSummary}
                  onChange={e => setEditSummary(e.target.value)}
                  placeholder="Describe your changes..."
                  className="bg-card border-border h-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 mt-5">
                <Switch id="minor" checked={isMinor} onCheckedChange={setIsMinor} />
                <Label htmlFor="minor" className="text-sm cursor-pointer">Minor edit</Label>
              </div>
            </div>
          </div>

          {/* Sidebar settings */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-3">Article Settings</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="bg-muted border-border h-9 text-sm">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Tags</Label>
                  <div className="flex gap-1.5 mb-2">
                    <Input
                      value={tagsInput}
                      onChange={e => setTagsInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add a tag..."
                      className="bg-muted border-border h-8 text-xs"
                    />
                    <Button size="sm" variant="outline" onClick={addTag} className="h-8 px-2 border-border">
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
                        {tag}
                        <button onClick={() => setTags(tags.filter(t => t !== tag))}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Infobox */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Infobox</h3>
                <Button size="sm" variant="ghost" onClick={addInfoboxRow} className="h-7 px-2 text-xs gap-1">
                  <Plus className="w-3 h-3" /> Add Row
                </Button>
              </div>
              {infoboxRows.length === 0 ? (
                <p className="text-xs text-muted-foreground">Add key-value pairs for an infobox sidebar.</p>
              ) : (
                <div className="space-y-2">
                  {infoboxRows.map((row, i) => (
                    <div key={i} className="flex gap-1.5">
                      <Input
                        value={row.key}
                        onChange={e => { const r = [...infoboxRows]; r[i].key = e.target.value; setInfoboxRows(r) }}
                        placeholder="Label"
                        className="bg-muted border-border h-7 text-xs w-2/5"
                      />
                      <Input
                        value={row.value}
                        onChange={e => { const r = [...infoboxRows]; r[i].value = e.target.value; setInfoboxRows(r) }}
                        placeholder="Value"
                        className="bg-muted border-border h-7 text-xs flex-1"
                      />
                      <button onClick={() => setInfoboxRows(infoboxRows.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Media attach */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">Attach Media</h3>
              <p className="text-xs text-muted-foreground mb-3">Upload images and videos after publishing, or link from the media library.</p>
              <Link href="/media">
                <Button variant="outline" size="sm" className="border-border gap-1.5 w-full text-xs h-8">
                  <Upload className="w-3.5 h-3.5" /> Go to Media Library
                </Button>
              </Link>
            </div>

            <Button disabled={submitting} onClick={submit}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Save className="w-4 h-4" />
              {submitting ? 'Publishing...' : 'Publish Article'}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

function renderPreview(markdown: string): string {
  return markdown
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[\[(.+?)\]\]/g, '<a href="#">$1</a>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h1-6brp]|<\/p>)(.+)$/gm, '<p>$1</p>')
}
