# FlowMind Feature Implementation Documentation

This document outlines the technical specifications and implementation details for selected FlowMind enhancement features.

## Table of Contents
1. [Transcript File Upload System](#1-transcript-file-upload-system)
2. [Personal Learning Dashboard](#2-personal-learning-dashboard)
3. [Advanced Search & Filtering](#3-advanced-search--filtering)
4. [Export & Sharing](#4-export--sharing)
5. [Multi-Language Support](#5-multi-language-support)

---

## 1. Transcript File Upload System

### Overview
Enable users to upload their own VTT/SRT transcript files to expand the knowledge base with personalized content.

### Technical Requirements

#### File Support
- **Supported Formats**: `.vtt`, `.srt`, `.txt` (plain transcript)
- **Max File Size**: 50MB per file
- **Batch Upload**: Up to 10 files simultaneously
- **File Validation**: Format verification and content parsing

#### Implementation Structure

```typescript
// New types to add to src/types/types.ts
export interface UploadedFile {
  id: string
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  uploadedAt: Date
  userId: string
  status: 'processing' | 'completed' | 'failed'
  processingProgress?: number
}

export interface CustomTranscript {
  id: string
  fileId: string
  title: string
  description?: string
  courseType: 'custom' | 'nodejs' | 'python'
  segments: ProcessedSegment[]
  metadata: {
    duration?: number
    language: string
    tags: string[]
  }
}
```

#### API Endpoints

**Upload Endpoint**: `POST /api/upload/transcript`
```typescript
// src/app/api/upload/transcript/route.ts
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    // Validate files
    const validatedFiles = await validateTranscriptFiles(files)
    
    // Save files to storage
    const uploadedFiles = await Promise.all(
      validatedFiles.map(file => saveToStorage(file))
    )
    
    // Process files in background
    for (const file of uploadedFiles) {
      await processTranscriptFile(file.id)
    }
    
    return Response.json({ 
      success: true, 
      files: uploadedFiles 
    })
  } catch (error) {
    return Response.json(
      { error: 'Upload failed' }, 
      { status: 500 }
    )
  }
}
```

**Processing Status**: `GET /api/upload/transcript/{id}/status`
```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const status = await getProcessingStatus(params.id)
  return Response.json(status)
}
```

#### File Processing Pipeline

```typescript
// src/lib/transcript-processor.ts
export class CustomTranscriptProcessor {
  async processFile(fileId: string): Promise<void> {
    const file = await getUploadedFile(fileId)
    
    try {
      // Update status to processing
      await updateFileStatus(fileId, 'processing', 0)
      
      // Parse transcript format
      const parsedContent = await this.parseTranscriptFile(file)
      await updateFileStatus(fileId, 'processing', 25)
      
      // Create segments
      const segments = await this.createSegments(parsedContent)
      await updateFileStatus(fileId, 'processing', 50)
      
      // Generate embeddings
      const processedSegments = await this.generateEmbeddings(segments)
      await updateFileStatus(fileId, 'processing', 75)
      
      // Store in vector database
      await this.storeInVectorDB(processedSegments)
      await updateFileStatus(fileId, 'completed', 100)
      
    } catch (error) {
      await updateFileStatus(fileId, 'failed', 0)
      throw error
    }
  }
  
  private async parseTranscriptFile(file: UploadedFile) {
    const content = await readFileContent(file.filename)
    
    if (file.filename.endsWith('.vtt')) {
      return this.parseVTT(content)
    } else if (file.filename.endsWith('.srt')) {
      return this.parseSRT(content)
    } else {
      return this.parseTextTranscript(content)
    }
  }
}
```

#### UI Components

**Upload Component**: `src/components/upload/TranscriptUploader.tsx`
```typescript
'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface TranscriptUploaderProps {
  onUploadComplete: (files: UploadedFile[]) => void
  maxFiles?: number
}

export default function TranscriptUploader({ 
  onUploadComplete, 
  maxFiles = 10 
}: TranscriptUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    setUploading(true)
    const formData = new FormData()
    
    acceptedFiles.forEach(file => {
      formData.append('files', file)
    })
    
    try {
      const response = await fetch('/api/upload/transcript', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Start polling for processing status
        await monitorProcessingStatus(result.files)
        onUploadComplete(result.files)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }, [onUploadComplete])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/vtt': ['.vtt'],
      'application/x-subrip': ['.srt'],
      'text/plain': ['.txt']
    },
    maxFiles,
    maxSize: 50 * 1024 * 1024 // 50MB
  })
  
  return (
    <div 
      {...getRootProps()} 
      className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop transcript files here...</p>
      ) : (
        <div>
          <p>Drag & drop transcript files, or click to select</p>
          <p className="text-sm text-gray-500 mt-2">
            Supports .vtt, .srt, .txt files (max 50MB each)
          </p>
        </div>
      )}
      
      {uploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress.overall || 0}%` }}
            />
          </div>
          <p className="text-sm mt-2">Processing files...</p>
        </div>
      )}
    </div>
  )
}
```

#### Database Schema

```sql
-- Add to your database migration
CREATE TABLE uploaded_files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
  processing_progress INTEGER DEFAULT 0
);

CREATE TABLE custom_transcripts (
  id TEXT PRIMARY KEY,
  file_id TEXT REFERENCES uploaded_files(id),
  title TEXT NOT NULL,
  description TEXT,
  course_type TEXT DEFAULT 'custom',
  duration INTEGER,
  language TEXT DEFAULT 'en',
  tags TEXT[], -- JSON array for PostgreSQL
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT NOT NULL
);
```

---

## 2. Personal Learning Dashboard

### Overview
Track user learning progress, conversation analytics, and provide personalized insights.

### Features

#### Learning Progress Tracking
- Topics covered and mastery levels
- Time spent on different subjects
- Knowledge gaps identification
- Learning streaks and milestones

#### Implementation Structure

```typescript
// Add to src/types/types.ts
export interface LearningProgress {
  userId: string
  totalConversations: number
  totalMessages: number
  timeSpent: number // minutes
  topicsExplored: TopicProgress[]
  learningStreak: number
  lastActiveDate: Date
  achievements: Achievement[]
}

export interface TopicProgress {
  topic: string
  courseType: 'nodejs' | 'python' | 'both'
  questionsAsked: number
  confidence: number // 0-100
  lastStudied: Date
  relatedConcepts: string[]
}

export interface Achievement {
  id: string
  name: string
  description: string
  earnedAt: Date
  category: 'streak' | 'topic_mastery' | 'exploration' | 'milestone'
}
```

#### Analytics Service

```typescript
// src/lib/analytics.ts
export class LearningAnalytics {
  async updateProgress(userId: string, message: Message): Promise<void> {
    const topics = await this.extractTopicsFromMessage(message)
    const timeSpent = await this.calculateSessionTime(userId)
    
    await this.updateTopicProgress(userId, topics)
    await this.updateOverallStats(userId, timeSpent)
    await this.checkAchievements(userId)
  }
  
  async getProgressSummary(userId: string): Promise<LearningProgress> {
    return await this.aggregateUserProgress(userId)
  }
  
  async getWeeklyProgress(userId: string): Promise<WeeklyProgress[]> {
    return await this.calculateWeeklyStats(userId)
  }
  
  private async extractTopicsFromMessage(message: Message): Promise<string[]> {
    // Use OpenAI to extract learning topics from messages
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Extract 2-3 main technical topics from this programming question or answer. Return as comma-separated values."
        },
        {
          role: "user",
          content: message.content
        }
      ],
      max_tokens: 50
    })
    
    return response.choices[0].message.content
      ?.split(',')
      .map(topic => topic.trim().toLowerCase()) || []
  }
}
```

#### Dashboard Components

**Main Dashboard**: `src/components/dashboard/LearningDashboard.tsx`
```typescript
'use client'

import { useState, useEffect } from 'react'
import { LearningProgress } from '@/types/types'

export default function LearningDashboard() {
  const [progress, setProgress] = useState<LearningProgress | null>(null)
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week')
  
  useEffect(() => {
    fetchProgress()
  }, [timeframe])
  
  const fetchProgress = async () => {
    const response = await fetch(`/api/dashboard/progress?timeframe=${timeframe}`)
    const data = await response.json()
    setProgress(data)
  }
  
  if (!progress) return <div>Loading...</div>
  
  return (
    <div className="space-y-6 p-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard 
          title="Conversations" 
          value={progress.totalConversations}
          icon="💬"
        />
        <StatsCard 
          title="Learning Streak" 
          value={`${progress.learningStreak} days`}
          icon="🔥"
        />
        <StatsCard 
          title="Topics Explored" 
          value={progress.topicsExplored.length}
          icon="📚"
        />
        <StatsCard 
          title="Time Spent" 
          value={`${Math.round(progress.timeSpent / 60)}h`}
          icon="⏱️"
        />
      </div>
      
      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopicProgressChart topics={progress.topicsExplored} />
        <LearningActivityChart userId={progress.userId} timeframe={timeframe} />
      </div>
      
      {/* Achievements */}
      <AchievementsList achievements={progress.achievements} />
    </div>
  )
}
```

---

## 3. Advanced Search & Filtering

### Overview
Comprehensive search capabilities across conversations, sources, and content with intelligent filtering options.

### Features

#### Global Search Engine
- Full-text search across all conversations
- Source-specific search within transcripts
- Semantic search using embeddings
- Advanced filters and facets

#### Implementation

```typescript
// src/lib/search-engine.ts
export interface SearchQuery {
  query: string
  filters: {
    courseType?: 'nodejs' | 'python' | 'custom'
    dateRange?: { start: Date; end: Date }
    messageType?: 'user' | 'assistant'
    sources?: string[]
    topics?: string[]
    minScore?: number
  }
  limit?: number
  offset?: number
}

export interface SearchResult {
  id: string
  type: 'message' | 'source' | 'transcript'
  title: string
  content: string
  snippet: string
  score: number
  metadata: {
    conversationId?: string
    timestamp?: Date
    courseType?: string
    source?: string
  }
}

export class AdvancedSearchEngine {
  async search(query: SearchQuery): Promise<{
    results: SearchResult[]
    totalCount: number
    facets: SearchFacets
  }> {
    // Combine multiple search strategies
    const [semanticResults, fullTextResults, sourceResults] = await Promise.all([
      this.semanticSearch(query),
      this.fullTextSearch(query),
      this.sourceSearch(query)
    ])
    
    // Merge and rank results
    const mergedResults = this.mergeResults([
      semanticResults,
      fullTextResults,
      sourceResults
    ])
    
    // Apply filters
    const filteredResults = this.applyFilters(mergedResults, query.filters)
    
    // Generate facets for UI
    const facets = this.generateFacets(filteredResults)
    
    return {
      results: filteredResults.slice(query.offset || 0, (query.offset || 0) + (query.limit || 20)),
      totalCount: filteredResults.length,
      facets
    }
  }
  
  private async semanticSearch(query: SearchQuery): Promise<SearchResult[]> {
    const embedding = await this.createEmbedding(query.query)
    
    // Search in vector database
    const vectorResults = await this.vectorSearch(embedding, query.filters)
    
    return vectorResults.map(result => ({
      id: result.id,
      type: 'source',
      title: result.payload.sectionName || 'Untitled',
      content: result.payload.content,
      snippet: this.createSnippet(result.payload.content, query.query),
      score: result.score,
      metadata: {
        courseType: result.payload.courseId,
        source: result.payload.videoId,
        timestamp: new Date(result.payload.timestamp)
      }
    }))
  }
}
```

#### Search UI Components

**Search Interface**: `src/components/search/AdvancedSearch.tsx`
```typescript
'use client'

import { useState, useEffect } from 'react'
import { SearchQuery, SearchResult } from '@/lib/search-engine'

export default function AdvancedSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [filters, setFilters] = useState<SearchQuery['filters']>({})
  const [loading, setLoading] = useState(false)
  
  const handleSearch = async (searchQuery: string) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          filters,
          limit: 20
        })
      })
      
      const data = await response.json()
      setResults(data.results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex space-x-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder="Search conversations, sources, and content..."
          className="flex-1 p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={() => handleSearch(query)}
          disabled={loading}
          className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      {/* Filters */}
      <SearchFilters filters={filters} onFiltersChange={setFilters} />
      
      {/* Results */}
      <div className="space-y-4">
        {results.map(result => (
          <SearchResultCard key={result.id} result={result} />
        ))}
      </div>
    </div>
  )
}
```

---

## 4. Export & Sharing

### Overview
Export conversations and generate study materials in various formats with sharing capabilities.

### Features

#### Export Formats
- **PDF**: Formatted conversations with styling
- **Markdown**: Plain text with markdown formatting
- **JSON**: Raw data export for developers
- **Study Notes**: AI-generated summaries

#### Implementation

```typescript
// src/lib/export-service.ts
export interface ExportOptions {
  format: 'pdf' | 'markdown' | 'json' | 'study-notes'
  includeMetadata: boolean
  includeSources: boolean
  dateRange?: { start: Date; end: Date }
  conversationIds?: string[]
}

export class ExportService {
  async exportConversations(
    userId: string, 
    options: ExportOptions
  ): Promise<{ url: string; filename: string }> {
    const conversations = await this.getConversations(userId, options)
    
    switch (options.format) {
      case 'pdf':
        return await this.exportToPDF(conversations, options)
      case 'markdown':
        return await this.exportToMarkdown(conversations, options)
      case 'json':
        return await this.exportToJSON(conversations, options)
      case 'study-notes':
        return await this.generateStudyNotes(conversations, options)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }
  
  private async exportToPDF(
    conversations: Conversation[], 
    options: ExportOptions
  ): Promise<{ url: string; filename: string }> {
    const puppeteer = require('puppeteer')
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    
    // Generate HTML content
    const html = this.generateHTMLForConversations(conversations, options)
    
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const filename = `flowmind-export-${Date.now()}.pdf`
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
    })
    
    await browser.close()
    
    // Save to storage and return URL
    const url = await this.saveToStorage(pdfBuffer, filename)
    
    return { url, filename }
  }
  
  private async generateStudyNotes(
    conversations: Conversation[], 
    options: ExportOptions
  ): Promise<{ url: string; filename: string }> {
    // Extract key topics and concepts
    const allMessages = conversations.flatMap(c => c.messages)
    const keyTopics = await this.extractKeyTopics(allMessages)
    
    // Generate study notes using AI
    const prompt = `Create comprehensive study notes from these programming conversations:
    
    Topics covered: ${keyTopics.join(', ')}
    
    Format as:
    # Study Notes
    
    ## Key Concepts
    [List main concepts with explanations]
    
    ## Code Examples
    [Important code snippets with explanations]
    
    ## Practice Questions
    [Generate 5-10 practice questions]
    
    ## Further Reading
    [Suggest related topics to explore]`
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000
    })
    
    const studyNotes = response.choices[0].message.content || ''
    const filename = `study-notes-${Date.now()}.md`
    const url = await this.saveTextToStorage(studyNotes, filename)
    
    return { url, filename }
  }
}
```

#### Export UI Components

**Export Dialog**: `src/components/export/ExportDialog.tsx`
```typescript
'use client'

import { useState } from 'react'
import { ExportOptions } from '@/lib/export-service'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  conversationIds?: string[]
}

export default function ExportDialog({ 
  isOpen, 
  onClose, 
  conversationIds 
}: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeMetadata: true,
    includeSources: true
  })
  const [exporting, setExporting] = useState(false)
  
  const handleExport = async () => {
    setExporting(true)
    
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...options,
          conversationIds
        })
      })
      
      const { url, filename } = await response.json()
      
      // Trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <h2 className="text-xl font-semibold mb-4">Export Conversations</h2>
        
        {/* Format Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Format</label>
          <select
            value={options.format}
            onChange={(e) => setOptions({
              ...options,
              format: e.target.value as ExportOptions['format']
            })}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="pdf">PDF Document</option>
            <option value="markdown">Markdown File</option>
            <option value="json">JSON Data</option>
            <option value="study-notes">AI Study Notes</option>
          </select>
        </div>
        
        {/* Options */}
        <div className="space-y-2 mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.includeMetadata}
              onChange={(e) => setOptions({
                ...options,
                includeMetadata: e.target.checked
              })}
              className="mr-2"
            />
            Include metadata (timestamps, user info)
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.includeSources}
              onChange={(e) => setOptions({
                ...options,
                includeSources: e.target.checked
              })}
              className="mr-2"
            />
            Include source references
          </label>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 5. Multi-Language Support

### Overview
Comprehensive internationalization (i18n) support for interface localization and content translation capabilities.

### Features

#### Interface Localization
- Multiple language UI support
- RTL (Right-to-Left) layout support
- Date/time formatting by locale
- Number formatting by locale

#### Content Translation
- Real-time message translation
- Transcript content translation
- Multilingual search capabilities

#### Implementation Structure

```typescript
// src/lib/i18n/types.ts
export type SupportedLanguage = 
  | 'en' // English
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'zh' // Chinese
  | 'ar' // Arabic
  | 'hi' // Hindi
  | 'pt' // Portuguese

export interface Translation {
  [key: string]: string | Translation
}

export interface I18nConfig {
  defaultLanguage: SupportedLanguage
  fallbackLanguage: SupportedLanguage
  supportedLanguages: SupportedLanguage[]
  rtlLanguages: SupportedLanguage[]
}
```

#### Translation System

**Translation Service**: `src/lib/i18n/translation-service.ts`
```typescript
export class TranslationService {
  private translations: Map<SupportedLanguage, Translation> = new Map()
  private currentLanguage: SupportedLanguage = 'en'
  
  async loadTranslations(language: SupportedLanguage): Promise<void> {
    if (this.translations.has(language)) return
    
    try {
      // Load translation files
      const translation = await import(`../translations/${language}.json`)
      this.translations.set(language, translation.default)
    } catch (error) {
      console.warn(`Failed to load translations for ${language}:`, error)
      // Fallback to English
      if (language !== 'en') {
        await this.loadTranslations('en')
      }
    }
  }
  
  setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language
    this.loadTranslations(language)
  }
  
  t(key: string, variables?: Record<string, string | number>): string {
    const translation = this.getNestedTranslation(key, this.currentLanguage)
    
    if (!translation && this.currentLanguage !== 'en') {
      // Fallback to English
      return this.getNestedTranslation(key, 'en') || key
    }
    
    return this.interpolateVariables(translation || key, variables)
  }
  
  async translateText(
    text: string, 
    targetLanguage: SupportedLanguage,
    sourceLanguage?: SupportedLanguage
  ): Promise<string> {
    if (targetLanguage === (sourceLanguage || this.currentLanguage)) {
      return text
    }
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Translate the following text to ${this.getLanguageName(targetLanguage)}. Maintain technical accuracy and context.`
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: Math.max(text.length * 2, 100)
      })
      
      return response.choices[0].message.content || text
    } catch (error) {
      console.error('Translation failed:', error)
      return text
    }
  }
  
  private getNestedTranslation(
    key: string, 
    language: SupportedLanguage
  ): string | undefined {
    const translation = this.translations.get(language)
    if (!translation) return undefined
    
    const keys = key.split('.')
    let current: any = translation
    
    for (const k of keys) {
      current = current?.[k]
    }
    
    return typeof current === 'string' ? current : undefined
  }
}
```

#### Translation Files Structure

**English Translations**: `src/translations/en.json`
```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit"
  },
  "chat": {
    "welcome": {
      "title": "Welcome to FlowMind",
      "subtitle": "Your AI-powered learning assistant",
      "selectCourse": "Select a course to get started"
    },
    "input": {
      "placeholder": "Ask me anything about {{course}}...",
      "send": "Send",
      "uploading": "Uploading..."
    },
    "messages": {
      "thinking": "FlowMind is thinking...",
      "sources": "Sources",
      "timestamp": "Timestamp: {{time}}"
    }
  },
  "dashboard": {
    "title": "Learning Dashboard",
    "stats": {
      "conversations": "Conversations",
      "streak": "Learning Streak",
      "topics": "Topics Explored",
      "time": "Time Spent"
    },
    "progress": {
      "title": "Learning Progress",
      "confidence": "Confidence: {{level}}%",
      "lastStudied": "Last studied {{date}}"
    }
  },
  "export": {
    "title": "Export Conversations",
    "formats": {
      "pdf": "PDF Document",
      "markdown": "Markdown File",
      "json": "JSON Data",
      "studyNotes": "AI Study Notes"
    },
    "options": {
      "includeMetadata": "Include metadata",
      "includeSources": "Include source references"
    }
  },
  "upload": {
    "title": "Upload Transcripts",
    "dropzone": "Drag & drop transcript files, or click to select",
    "supportedFormats": "Supports .vtt, .srt, .txt files (max {{size}}MB each)",
    "processing": "Processing files...",
    "success": "Files uploaded successfully",
    "error": "Upload failed: {{error}}"
  }
}
```

#### React Hook for Translations

**useTranslation Hook**: `src/hooks/useTranslation.ts`
```typescript
'use client'

import { useContext, useEffect } from 'react'
import { I18nContext } from '@/contexts/I18nContext'

export function useTranslation() {
  const context = useContext(I18nContext)
  
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider')
  }
  
  const { translationService, currentLanguage, setLanguage } = context
  
  useEffect(() => {
    translationService.loadTranslations(currentLanguage)
  }, [currentLanguage, translationService])
  
  return {
    t: translationService.t.bind(translationService),
    currentLanguage,
    setLanguage,
    translateText: translationService.translateText.bind(translationService),
    isRTL: ['ar', 'he', 'fa'].includes(currentLanguage)
  }
}
```

#### Language Selector Component

**Language Selector**: `src/components/i18n/LanguageSelector.tsx`
```typescript
'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { SupportedLanguage } from '@/lib/i18n/types'

const languages: Record<SupportedLanguage, { name: string; flag: string }> = {
  'en': { name: 'English', flag: '🇺🇸' },
  'es': { name: 'Español', flag: '🇪🇸' },
  'fr': { name: 'Français', flag: '🇫🇷' },
  'de': { name: 'Deutsch', flag: '🇩🇪' },
  'ja': { name: '日本語', flag: '🇯🇵' },
  'ko': { name: '한국어', flag: '🇰🇷' },
  'zh': { name: '中文', flag: '🇨🇳' },
  'ar': { name: 'العربية', flag: '🇸🇦' },
  'hi': { name: 'हिन्दी', flag: '🇮🇳' },
  'pt': { name: 'Português', flag: '🇧🇷' }
}

export default function LanguageSelector() {
  const { currentLanguage, setLanguage, isRTL } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  
  const currentLangInfo = languages[currentLanguage]
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <span className="text-lg">{currentLangInfo.flag}</span>
        <span className="text-sm font-medium">{currentLangInfo.name}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          {Object.entries(languages).map(([code, info]) => (
            <button
              key={code}
              onClick={() => {
                setLanguage(code as SupportedLanguage)
                setIsOpen(false)
              }}
              className={`
                w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50
                ${code === currentLanguage ? 'bg-purple-50 text-purple-700' : ''}
              `}
            >
              <span className="text-lg">{info.flag}</span>
              <span className="text-sm font-medium">{info.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

#### Message Translation Component

**Message Translator**: `src/components/chat/MessageTranslator.tsx`
```typescript
'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Message } from '@/types/types'

interface MessageTranslatorProps {
  message: Message
}

export default function MessageTranslator({ message }: MessageTranslatorProps) {
  const { translateText, currentLanguage, t } = useTranslation()
  const [translatedContent, setTranslatedContent] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)
  
  const handleTranslate = async () => {
    if (translatedContent && !showOriginal) {
      setShowOriginal(true)
      return
    }
    
    if (translatedContent && showOriginal) {
      setShowOriginal(false)
      return
    }
    
    setIsTranslating(true)
    
    try {
      const translated = await translateText(message.content, currentLanguage)
      setTranslatedContent(translated)
    } catch (error) {
      console.error('Translation failed:', error)
    } finally {
      setIsTranslating(false)
    }
  }
  
  const displayContent = (translatedContent && !showOriginal) 
    ? translatedContent 
    : message.content
  
  const buttonText = translatedContent
    ? (showOriginal ? t('common.translate') : t('common.original'))
    : t('common.translate')
  
  return (
    <div className="space-y-2">
      <div className="prose max-w-none">
        {displayContent}
      </div>
      
      <button
        onClick={handleTranslate}
        disabled={isTranslating}
        className="text-sm text-purple-600 hover:text-purple-800 disabled:opacity-50"
      >
        {isTranslating ? t('common.loading') : buttonText}
      </button>
    </div>
  )
}
```

---

## Database Migrations

Add these tables to support the new features:

```sql
-- Learning Progress Tracking
CREATE TABLE user_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  learning_streak INTEGER DEFAULT 0,
  last_active_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE topic_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  course_type TEXT,
  questions_asked INTEGER DEFAULT 0,
  confidence INTEGER DEFAULT 0,
  last_studied TIMESTAMP,
  related_concepts TEXT[], -- JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File Storage
CREATE TABLE file_storage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  purpose TEXT, -- 'export', 'upload', 'temp'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Search Index (for full-text search)
CREATE TABLE search_index (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'message', 'transcript', 'source'
  metadata JSONB,
  user_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_content ON search_index USING gin(to_tsvector('english', content));
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_topic_progress_user_id ON topic_progress(user_id);
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
```

---

## Environment Variables

Add these to your `.env.local`:

```env
# File Storage
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=52428800  # 50MB in bytes

# Export Settings
EXPORT_DIR=./exports
EXPORT_EXPIRY_DAYS=7

# Translation API (optional - uses OpenAI by default)
GOOGLE_TRANSLATE_API_KEY=your-google-translate-key

# PDF Generation
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium  # For Docker/Linux deployments
```

This documentation provides a comprehensive foundation for implementing these five key features in FlowMind. Each feature includes detailed technical specifications, code examples, and implementation guidelines.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create comprehensive documentation for 5 selected FlowMind features", "status": "completed", "activeForm": "Created comprehensive documentation for 5 selected FlowMind features"}]