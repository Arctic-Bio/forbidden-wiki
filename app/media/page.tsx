'use client'

import { useState, useRef } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { useAuth } from '@/components/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatBytes } from '@/lib/utils-wiki'
import {
  Upload, Image as ImageIcon, Video, FileAudio, File,
  Copy, Check, Trash2, X, Plus, Play, ExternalLink
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface MediaItem {
  id: string; filename: string; original_name: string; blob_url: string
  content_type: string; file_size: number; media_type: string
  caption: string | null; alt_text: string | null
  uploader_name: string; created_at: string
}

export default function MediaPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [caption, setCaption] = useState('')
  const [altText, setAltText] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const typeFilter = activeTab !== 'all' ? `&type=${activeTab}` : ''
  const { data, isLoading, mutate } = useSWR(`/api/media?page=1${typeFilter}`, fetcher)
  const media: MediaItem[] = data?.media || []

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    setSelectedFiles(Array.from(files))
    setUploadError('')
  }

  const uploadFiles = async () => {
    if (!selectedFiles.length || !user) return
    setUploading(true); setUploadError('')
    try {
      for (const file of selectedFiles) {
        const fd = new FormData()
        fd.append('file', file)
        if (caption) fd.append('caption', caption)
        if (altText) fd.append('alt_text', altText)
        const res = await fetch('/api/media', { method: 'POST', body: fd })
        if (!res.ok) {
          const err = await res.json()
          setUploadError(err.error || 'Upload failed')
          return
        }
      }
      setSelectedFiles([])
      setCaption('')
      setAltText('')
      mutate()
    } catch {
      setUploadError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const copyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.blob_url)
    setCopiedId(item.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const deleteMedia = async (id: string) => {
    if (!confirm('Delete this media file?')) return
    await fetch(`/api/media/${id}`, { method: 'DELETE' })
    mutate()
  }

  const mediaTypeIcon = (type: string) => {
    if (type === 'image') return <ImageIcon className="w-4 h-4" />
    if (type === 'video') return <Video className="w-4 h-4" />
    if (type === 'audio') return <FileAudio className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" /> Media Library
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Upload and manage images and videos for wiki articles</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload panel */}
            {user && (
              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-lg overflow-hidden sticky top-20">
                  <div className="px-4 py-3 border-b border-border bg-secondary/30">
                    <h2 className="font-semibold text-sm flex items-center gap-2">
                      <Upload className="w-4 h-4 text-primary" /> Upload Media
                    </h2>
                  </div>
                  <div className="p-4 space-y-4">
                    {uploadError && (
                      <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground rounded p-2 text-xs">
                        {uploadError}
                      </div>
                    )}

                    {/* Drop zone */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Drop files here</p>
                      <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">Images, Videos (max 100MB)</p>
                      <input ref={fileRef} type="file" multiple accept="image/*,video/*,audio/*"
                        className="hidden" onChange={e => handleFiles(e.target.files)} />
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Selected files:</p>
                        {selectedFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs bg-muted rounded p-2">
                            {f.type.startsWith('image/') ? <ImageIcon className="w-3.5 h-3.5 shrink-0" /> : <Video className="w-3.5 h-3.5 shrink-0" />}
                            <span className="flex-1 truncate">{f.name}</span>
                            <span className="text-muted-foreground shrink-0">{formatBytes(f.size)}</span>
                            <button onClick={() => setSelectedFiles(selectedFiles.filter((_, j) => j !== i))}>
                              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Caption (optional)</Label>
                      <Input value={caption} onChange={e => setCaption(e.target.value)}
                        placeholder="Describe this media..." className="bg-muted border-border h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Alt Text (for accessibility)</Label>
                      <Input value={altText} onChange={e => setAltText(e.target.value)}
                        placeholder="Descriptive text for screen readers..." className="bg-muted border-border h-8 text-xs" />
                    </div>

                    <Button disabled={!selectedFiles.length || uploading} onClick={uploadFiles}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}` : ''}`}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Gallery */}
            <div className={user ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-muted h-9 mb-6">
                  <TabsTrigger value="all" className="text-xs h-7">All</TabsTrigger>
                  <TabsTrigger value="image" className="text-xs h-7 gap-1">
                    <ImageIcon className="w-3 h-3" /> Images
                  </TabsTrigger>
                  <TabsTrigger value="video" className="text-xs h-7 gap-1">
                    <Video className="w-3 h-3" /> Videos
                  </TabsTrigger>
                  <TabsTrigger value="audio" className="text-xs h-7 gap-1">
                    <FileAudio className="w-3 h-3" /> Audio
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
                    </div>
                  ) : media.length === 0 ? (
                    <div className="text-center py-20 bg-card border border-border rounded-lg">
                      <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                      <p className="font-serif text-lg font-medium mb-2">No media files yet</p>
                      {user && <p className="text-sm text-muted-foreground">Upload your first file using the panel.</p>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {media.map(item => (
                        <div key={item.id} className="group relative bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 transition-colors">
                          {/* Preview */}
                          <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
                            {item.media_type === 'image' ? (
                              <img src={item.blob_url} alt={item.alt_text || item.original_name}
                                className="w-full h-full object-cover" />
                            ) : item.media_type === 'video' ? (
                              <div className="relative w-full h-full">
                                <video src={item.blob_url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <Play className="w-8 h-8 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                {mediaTypeIcon(item.media_type)}
                                <span className="text-xs text-center px-2 truncate max-w-full">{item.original_name}</span>
                              </div>
                            )}
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button onClick={() => copyUrl(item)} title="Copy URL"
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                                {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <a href={item.blob_url} target="_blank" rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              {user && (
                                <button onClick={() => deleteMedia(item.id)} title="Delete"
                                  className="w-8 h-8 rounded-full bg-red-500/30 hover:bg-red-500/50 flex items-center justify-center text-white transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          {/* Info */}
                          <div className="p-2">
                            <p className="text-xs font-medium truncate" title={item.original_name}>{item.original_name}</p>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-xs text-muted-foreground">{formatBytes(item.file_size)}</span>
                              <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
                            </div>
                            {item.caption && <p className="text-xs text-muted-foreground mt-1 truncate">{item.caption}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
