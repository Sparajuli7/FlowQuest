'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, Building, Users, Globe, DollarSign } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const TEMPLATE_INFO = {
  sales_quote_v1: {
    name: 'Sales Quote Explainer',
    description: 'Transform sales proposals into compelling video presentations',
    estimatedDuration: '45-60s',
    category: 'Sales'
  }
} as const

interface FormData {
  company: string
  budget: number
  seats: number
  region: string
  timeline: string
}

const initialFormData: FormData = {
  company: '',
  budget: 15000,
  seats: 25,
  region: 'NA',
  timeline: '2024-Q2'
}

export default function NewQuestPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string
  
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  
  const templateInfo = TEMPLATE_INFO[templateId as keyof typeof TEMPLATE_INFO]

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}
    
    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required'
    }
    
    if (formData.budget < 1000) {
      newErrors.budget = 'Budget must be at least $1,000'
    } else if (formData.budget > 1000000) {
      newErrors.budget = 'Budget must not exceed $1,000,000'
    }
    
    if (formData.seats < 1) {
      newErrors.seats = 'Number of seats must be at least 1'
    } else if (formData.seats > 10000) {
      newErrors.seats = 'Number of seats must not exceed 10,000'
    }
    
    if (!formData.region) {
      newErrors.region = 'Region is required'
    }
    
    if (!formData.timeline) {
      newErrors.timeline = 'Timeline is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGenerate = async () => {
    if (!validateForm()) {
      return
    }
    
    setIsGenerating(true)
    
    try {
      const response = await api.generateQuest({
        template_key: templateId,
        inputs: {
          company: formData.company,
          budget: formData.budget,
          seats: formData.seats,
          region: formData.region,
          timeline: formData.timeline
        }
      })
      
      // Redirect to the quest workspace
      router.push(`/quest/${response.quest_id}`)
      
    } catch (error) {
      console.error('Failed to generate quest:', error)
      // TODO: Show error toast
    } finally {
      setIsGenerating(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!templateInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Template Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested template could not be found.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg to-surface/20">
      {/* Header */}
      <header className="border-b border-border/50 glass-panel-light">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Templates</span>
            </Link>
            
            <div className="w-px h-6 bg-border" />
            
            <div>
              <h1 className="text-xl font-semibold">{templateInfo.name}</h1>
              <p className="text-sm text-muted-foreground">{templateInfo.description}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Template Info */}
          <Card className="glass-panel mb-8">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary-2 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-h2">{templateInfo.name}</h2>
                  <p className="text-muted-foreground">{templateInfo.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <span>Duration: ~{templateInfo.estimatedDuration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>Category: {templateInfo.category}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Form */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <p className="text-muted-foreground">
                Provide your project information to generate a customized video presentation.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span>Company Name</span>
                  <span className="text-error">*</span>
                </Label>
                <Input
                  placeholder="Acme Corporation"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className={cn(errors.company && 'border-error')}
                />
                {errors.company && (
                  <p className="text-error text-sm">{errors.company}</p>
                )}
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Project Budget</span>
                  <span className="text-error">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="15000"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', parseInt(e.target.value) || 0)}
                    className={cn('pl-9', errors.budget && 'border-error')}
                    min="1000"
                    max="1000000"
                    step="1000"
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Current: {formatCurrency(formData.budget)}</span>
                  <span>Range: $1K - $1M</span>
                </div>
                {errors.budget && (
                  <p className="text-error text-sm">{errors.budget}</p>
                )}
              </div>

              {/* Number of Seats */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Number of Seats/Users</span>
                  <span className="text-error">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="25"
                  value={formData.seats}
                  onChange={(e) => handleInputChange('seats', parseInt(e.target.value) || 0)}
                  className={cn(errors.seats && 'border-error')}
                  min="1"
                  max="10000"
                />
                {errors.seats && (
                  <p className="text-error text-sm">{errors.seats}</p>
                )}
              </div>

              {/* Region */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Region</span>
                  <span className="text-error">*</span>
                </Label>
                <Select 
                  value={formData.region} 
                  onValueChange={(value) => handleInputChange('region', value)}
                >
                  <SelectTrigger className={cn(errors.region && 'border-error')}>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NA">North America</SelectItem>
                    <SelectItem value="EU">Europe</SelectItem>
                    <SelectItem value="APAC">Asia-Pacific</SelectItem>
                    <SelectItem value="LATAM">Latin America</SelectItem>
                    <SelectItem value="MEA">Middle East & Africa</SelectItem>
                  </SelectContent>
                </Select>
                {errors.region && (
                  <p className="text-error text-sm">{errors.region}</p>
                )}
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <Label>Implementation Timeline</Label>
                <Select 
                  value={formData.timeline} 
                  onValueChange={(value) => handleInputChange('timeline', value)}
                >
                  <SelectTrigger className={cn(errors.timeline && 'border-error')}>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-Q1">2024 Q1</SelectItem>
                    <SelectItem value="2024-Q2">2024 Q2</SelectItem>
                    <SelectItem value="2024-Q3">2024 Q3</SelectItem>
                    <SelectItem value="2024-Q4">2024 Q4</SelectItem>
                    <SelectItem value="2025-Q1">2025 Q1</SelectItem>
                  </SelectContent>
                </Select>
                {errors.timeline && (
                  <p className="text-error text-sm">{errors.timeline}</p>
                )}
              </div>

              {/* Generate Button */}
              <div className="pt-6 border-t border-border/50">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full h-12 text-lg btn-press hover-glow"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                      Generating Video Preview...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Generate Quest
                    </>
                  )}
                </Button>
                
                <p className="text-center text-sm text-muted-foreground mt-3">
                  Your personalized video will be ready in ~3 seconds
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

// Simplified Select components for this page
function Select({ children, value, onValueChange }: any) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </select>
  )
}

function SelectTrigger({ children, className }: any) {
  return <div className={className}>{children}</div>
}

function SelectValue({ placeholder }: any) {
  return <span className="text-muted-foreground">{placeholder}</span>
}

function SelectContent({ children }: any) {
  return <>{children}</>
}

function SelectItem({ value, children }: any) {
  return <option value={value}>{children}</option>
}

function Input({ className, ...props }: any) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function Label({ className, ...props }: any) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
}
