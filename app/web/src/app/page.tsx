'use client'

import Link from 'next/link'
import { ArrowRight, Play, Video, FileText, Calendar, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const templates = [
  {
    id: 'sales_quote_v1',
    title: 'Sales Quote Explainer',
    description: 'Turn proposals into compelling video presentations',
    duration: '45-60s',
    thumbnail: '/thumbnails/sales-quote.jpg',
    category: 'Sales'
  },
  {
    id: 'project_overview_v1', 
    title: 'Project Overview',
    description: 'Visualize project timelines and deliverables',
    duration: '30-45s',
    thumbnail: '/thumbnails/project-overview.jpg',
    category: 'Success'
  },
  {
    id: 'support_walkthrough_v1',
    title: 'Support Walkthrough', 
    description: 'Step-by-step feature explanations',
    duration: '60-90s',
    thumbnail: '/thumbnails/support-walkthrough.jpg',
    category: 'Support'
  }
]

const features = [
  {
    icon: Video,
    title: 'Video Preview',
    description: 'See your content as an interactive video first'
  },
  {
    icon: FileText,
    title: 'Form-like Editing',
    description: 'Change values like filling out a form'
  },
  {
    icon: Download,
    title: 'Export Everything',
    description: 'PDF, Calendar, Markdown - always in sync'
  }
]

export default function TemplatesPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-2 flex items-center justify-center">
              <Play className="w-4 h-4 text-bg" />
            </div>
            <span className="text-h3 font-bold">FlowQuest</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/templates" className="text-body hover:text-primary transition-colors">
              Templates
            </Link>
            <Link href="/docs" className="text-body hover:text-primary transition-colors">
              Docs
            </Link>
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-h1 mb-6 max-w-4xl mx-auto">
          Play the shortest path to done.
        </h1>
        <p className="text-h3 text-muted-foreground mb-12 max-w-2xl mx-auto font-normal">
          A video you can edit like a form—and files that always match what you see.
        </p>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="glass-panel border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-6 text-center">
                <feature.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="text-body font-semibold mb-2">{feature.title}</h3>
                <p className="text-caption text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Templates Grid */}
      <section className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-h2">Choose a template</h2>
          <div className="flex gap-2">
            {['All', 'Sales', 'Success', 'Support', 'Learn', 'Travel'].map((filter) => (
              <Button 
                key={filter} 
                variant={filter === 'All' ? 'default' : 'outline'}
                size="sm"
                className="text-caption"
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="glass-panel hover-glow group cursor-pointer overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-surface to-card relative">
                {/* Placeholder thumbnail */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-16 h-16 text-primary/50 group-hover:text-primary transition-colors" />
                </div>
                {/* Category badge */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                  {template.category}
                </div>
                {/* Duration badge */}
                <div className="absolute top-3 right-3 px-2 py-1 bg-bg/60 backdrop-blur text-xs rounded">
                  ~{template.duration}
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-body font-semibold mb-2">{template.title}</h3>
                <p className="text-caption text-muted-foreground mb-4">{template.description}</p>
                <Link href={`/quest/${template.id}/new`}>
                  <Button className="w-full group btn-press">
                    Start
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 mt-16 border-t border-border/50">
        <div className="flex items-center justify-between text-caption text-muted-foreground">
          <p>&copy; 2024 FlowQuest. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
