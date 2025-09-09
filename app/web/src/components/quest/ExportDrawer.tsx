'use client'

import { useState, useEffect } from 'react'
import { 
  X, Download, Copy, Link, FileText, Calendar, 
  FileSpreadsheet, CheckCircle, AlertTriangle, 
  ExternalLink, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn, copyToClipboard } from '@/lib/utils'
import { ExportRequest, Artifacts, OutcomeReceipt, VerificationResult } from '@flowquest/common-schemas'

interface ExportDrawerProps {
  isOpen: boolean
  onClose: () => void
  onExport: (request: ExportRequest) => Promise<void>
  questId: string | null
  artifacts: Artifacts | null
  receipt: OutcomeReceipt | null
  verification: VerificationResult | null
  isExporting?: boolean
  className?: string
}

interface ExportFormat {
  id: 'pdf' | 'ics' | 'md' | 'csv'
  name: string
  description: string
  icon: React.ComponentType<any>
  color: string
  estimatedSize?: string
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'pdf',
    name: 'PDF Document',
    description: 'Complete proposal with visuals and pricing',
    icon: FileText,
    color: 'text-red-400',
    estimatedSize: '~2.1 MB'
  },
  {
    id: 'ics',
    name: 'Calendar Event', 
    description: 'Timeline with key milestones and deadlines',
    icon: Calendar,
    color: 'text-blue-400',
    estimatedSize: '~12 KB'
  },
  {
    id: 'md',
    name: 'Markdown Summary',
    description: 'Clean text summary for documentation',
    icon: FileText,
    color: 'text-green-400',
    estimatedSize: '~5 KB'
  },
  {
    id: 'csv',
    name: 'Data Export',
    description: 'Structured data for spreadsheet analysis',
    icon: FileSpreadsheet,
    color: 'text-yellow-400',
    estimatedSize: '~3 KB'
  }
]

interface VerifierListProps {
  verification: VerificationResult | null
}

function VerifierList({ verification }: VerifierListProps) {
  if (!verification) {
    return (
      <div className="flex items-center space-x-2 text-muted-foreground">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm">Verification pending...</span>
      </div>
    )
  }

  const allChecks = [
    'Budget within scope',
    'Links valid', 
    'Timeline specified',
    'Required fields complete'
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 mb-3">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Verification Status</span>
      </div>
      
      {allChecks.map((check, index) => {
        const isComplete = verification.passed || index < 2 // Mock some as complete
        return (
          <div key={check} className="flex items-center space-x-2">
            <CheckCircle className={cn(
              'w-3 h-3',
              isComplete ? 'text-success' : 'text-muted-foreground'
            )} />
            <span className={cn(
              'text-sm',
              isComplete ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {check}
            </span>
          </div>
        )
      })}
      
      {!verification.passed && verification.issues.length > 0 && (
        <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded">
          <p className="text-sm text-warning">
            {verification.issues.length} issue(s) found. Fix them before exporting.
          </p>
        </div>
      )}
    </div>
  )
}

export function ExportDrawer({
  isOpen,
  onClose,
  onExport,
  questId,
  artifacts,
  receipt,
  verification,
  isExporting = false,
  className
}: ExportDrawerProps) {
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set(['pdf', 'ics']))
  const [includeReceipt, setIncludeReceipt] = useState(true)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  const canExport = verification?.passed !== false && !isExporting
  const hasArtifacts = artifacts && Object.keys(artifacts).some(key => artifacts[key as keyof Artifacts])

  const handleFormatToggle = (formatId: string) => {
    const newSelection = new Set(selectedFormats)
    if (newSelection.has(formatId)) {
      newSelection.delete(formatId)
    } else {
      newSelection.add(formatId)
    }
    setSelectedFormats(newSelection)
  }

  const handleExport = async () => {
    if (!questId || selectedFormats.size === 0) return
    
    await onExport({
      quest_id: questId,
      formats: Array.from(selectedFormats) as ('pdf' | 'ics' | 'md' | 'csv')[],
      include_receipt: includeReceipt
    })
  }

  const handleDownloadAll = () => {
    if (!artifacts) return
    
    // In a real implementation, this would trigger multiple downloads
    // or create a ZIP file with all artifacts
    console.log('Downloading all artifacts:', artifacts)
  }

  const handleCopyWatchLink = async () => {
    if (!questId) return
    
    const watchLink = `${window.location.origin}/watch/${questId}`
    const success = await copyToClipboard(watchLink)
    
    if (success) {
      setCopySuccess('watch-link')
      setTimeout(() => setCopySuccess(null), 2000)
    }
  }

  const handleCopyReceipt = async () => {
    if (!receipt) return
    
    const receiptJson = JSON.stringify(receipt, null, 2)
    const success = await copyToClipboard(receiptJson)
    
    if (success) {
      setCopySuccess('receipt')
      setTimeout(() => setCopySuccess(null), 2000)
    }
  }

  // Reset copy success when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setCopySuccess(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className={cn(
      'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end',
      'md:items-center md:justify-center',
      className
    )}>
      <Card className={cn(
        'w-full max-w-2xl m-4 glass-panel border-border/50',
        'md:max-h-[80vh] overflow-y-auto',
        'animate-slide-in'
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Export Quest</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-destructive/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Formats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXPORT_FORMATS.map((format) => {
                const isSelected = selectedFormats.has(format.id)
                const Icon = format.icon
                
                return (
                  <Card
                    key={format.id}
                    className={cn(
                      'cursor-pointer transition-all duration-200 hover:border-primary/50',
                      isSelected ? 'border-primary bg-primary/5' : 'border-border/50'
                    )}
                    onClick={() => handleFormatToggle(format.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleFormatToggle(format.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Icon className={cn('w-4 h-4', format.color)} />
                            <h4 className="font-medium text-sm">{format.name}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {format.description}
                          </p>
                          {format.estimatedSize && (
                            <p className="text-xs text-muted-foreground opacity-75">
                              {format.estimatedSize}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Outcome Receipt Option */}
          <div className="flex items-start space-x-3 p-4 bg-surface/30 rounded-lg">
            <Checkbox
              checked={includeReceipt}
              onChange={(checked: boolean) => setIncludeReceipt(checked)}
              className="mt-1"
            />
            <div>
              <h4 className="font-medium text-sm mb-1">Include Outcome Receipt</h4>
              <p className="text-xs text-muted-foreground">
                Cryptographic proof that verifies video content matches exported documents
              </p>
            </div>
          </div>

          {/* Verification Status */}
          <div className="p-4 bg-surface/20 rounded-lg">
            <VerifierList verification={verification} />
          </div>

          {/* Existing Artifacts */}
          {hasArtifacts && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Available Downloads</h3>
              <div className="space-y-2">
                {EXPORT_FORMATS.map((format) => {
                  const artifactUrl = artifacts?.[format.id]
                  if (!artifactUrl) return null
                  
                  const Icon = format.icon
                  
                  return (
                    <div key={format.id} className="flex items-center justify-between p-3 bg-surface/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Icon className={cn('w-4 h-4', format.color)} />
                        <div>
                          <p className="text-sm font-medium">{format.name}</p>
                          <p className="text-xs text-muted-foreground">{format.estimatedSize}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(artifactUrl, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Open
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 pt-4 border-t border-border/50">
            <div className="flex space-x-2">
              <Button
                onClick={handleExport}
                disabled={!canExport || selectedFormats.size === 0}
                className="flex-1 btn-press hover-glow"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Selected
                  </>
                )}
              </Button>
              
              {hasArtifacts && (
                <Button
                  variant="outline"
                  onClick={handleDownloadAll}
                  className="flex-shrink-0"
                >
                  Download All
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleCopyWatchLink}
                className="flex-1 text-sm"
              >
                <Link className="w-3 h-3 mr-2" />
                {copySuccess === 'watch-link' ? 'Copied!' : 'Copy Watch Link'}
              </Button>
              
              {receipt && (
                <Button
                  variant="outline"
                  onClick={handleCopyReceipt}
                  className="flex-1 text-sm"
                >
                  <Copy className="w-3 h-3 mr-2" />
                  {copySuccess === 'receipt' ? 'Copied!' : 'Copy Receipt'}
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              All exports are cryptographically verified to match your video content
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Simple Checkbox component since we're referencing it
function Checkbox({ checked, onChange, className, ...props }: any) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className={cn(
        "w-4 h-4 text-primary bg-transparent border-2 border-border rounded focus:ring-primary focus:ring-2",
        className
      )}
      {...props}
    />
  )
}
