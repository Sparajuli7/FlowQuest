'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Share2, Zap, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { CheckpointBar } from '@/components/quest/CheckpointBar'
import { StepPanel } from '@/components/quest/StepPanel'
import { ExportDrawer } from '@/components/quest/ExportDrawer'
import { useQuestStore } from '@/stores/quest'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface DeltaBadgeProps {
  status: 'idle' | 'rendering' | 'complete'
  renderTime?: number
  className?: string
}

function DeltaBadge({ status, renderTime, className }: DeltaBadgeProps) {
  const getBadgeContent = () => {
    switch (status) {
      case 'rendering':
        return (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border-2 border-warning border-t-transparent rounded-full animate-spin" />
            <span>Re-rendering...</span>
          </div>
        )
      case 'complete':
        return (
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>Updated{renderTime ? ` in ${renderTime / 1000}s` : ''}</span>
          </div>
        )
      default:
        return null
    }
  }

  if (status === 'idle') return null

  return (
    <div className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
      'glass-panel-light border border-border/30',
      status === 'rendering' && 'border-warning/30 text-warning',
      status === 'complete' && 'border-success/30 text-success',
      'animate-fade-in',
      className
    )}>
      {getBadgeContent()}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const getStatusColor = () => {
    switch (status) {
      case 'preview': return 'border-primary/30 text-primary bg-primary/10'
      case 'rendering': return 'border-warning/30 text-warning bg-warning/10'
      case 'ready': return 'border-success/30 text-success bg-success/10'
      case 'exporting': return 'border-accent/30 text-accent bg-accent/10'
      default: return 'border-muted/30 text-muted-foreground bg-muted/10'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'preview': return 'Preview'
      case 'rendering': return 'Delta Rendering...'
      case 'ready': return 'Ready'
      case 'exporting': return 'Exporting...'
      default: return status
    }
  }

  return (
    <div className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
      getStatusColor()
    )}>
      <div className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse" />
      {getStatusText()}
    </div>
  )
}

export default function QuestWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const questId = params.id as string
  
  // Quest store
  const {
    questId: storeQuestId,
    templateKey,
    checkpoints,
    previewUrl,
    status,
    currentStep,
    stepValues,
    verification,
    artifacts,
    receipt,
    isStepPanelOpen,
    isExportDrawerOpen,
    setQuest,
    setCurrentStep,
    updateStepValue,
    setStatus,
    setVerification,
    setArtifacts,
    setReceipt,
    setStepPanelOpen,
    setExportDrawerOpen
  } = useQuestStore()

  // Local state
  const [deltaStatus, setDeltaStatus] = useState<'idle' | 'rendering' | 'complete'>('idle')
  const [lastRenderTime, setLastRenderTime] = useState<number>()
  const [renderStatus, setRenderStatus] = useState<Record<string, 'idle' | 'rendering' | 'complete'>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize quest if not loaded or different quest
  useEffect(() => {
    if (questId && storeQuestId !== questId) {
      initializeQuest()
    }
  }, [questId, storeQuestId])

  const initializeQuest = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // For demonstration, we'll mock the quest data
      // In production, this would fetch from the API
      const mockCheckpoints = [
        { id: 'budget', label: 'Budget', type: 'currency' as const, required: true },
        { id: 'scope', label: 'Project Scope', type: 'text' as const, required: true },
        { id: 'timeline', label: 'Timeline', type: 'select' as const, required: true, options: ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4'] }
      ]
      
      const mockPreviewUrl = `https://cdn.flowquest.dev/preview/${questId}/master.m3u8`
      
      setQuest(questId, 'sales_quote_v1', mockCheckpoints, mockPreviewUrl)
    } catch (err) {
      console.error('Failed to initialize quest:', err)
      setError('Failed to load quest. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle checkpoint clicks
  const handleCheckpointClick = (checkpointId: string) => {
    setCurrentStep(checkpointId === currentStep ? null : checkpointId)
  }

  // Handle step value updates
  const handleStepApply = async (stepId: string, value: any) => {
    if (!questId) return

    setDeltaStatus('rendering')
    setRenderStatus(prev => ({ ...prev, [stepId]: 'rendering' }))
    setStatus('rendering')

    try {
      // Call the backend to trigger delta rendering
      const response = await api.answerStep({
        quest_id: questId,
        step_id: stepId,
        value: value
      })

      // Update local state
      updateStepValue(stepId, value)
      setRenderStatus(prev => ({ ...prev, [stepId]: 'complete' }))
      setDeltaStatus('complete')
      setLastRenderTime(response.render_time_ms)
      
      // Show success toast
      setTimeout(() => {
        setDeltaStatus('idle')
        setRenderStatus(prev => ({ ...prev, [stepId]: 'idle' }))
      }, 3000)

      // Close step panel
      setCurrentStep(null)
      setStatus('ready')

    } catch (error) {
      console.error('Failed to apply step:', error)
      setDeltaStatus('idle')
      setRenderStatus(prev => ({ ...prev, [stepId]: 'idle' }))
      setStatus('ready')
    }
  }

  // Handle verification
  const handleVerification = async () => {
    if (!questId) return

    try {
      const result = await api.verifyQuest({ quest_id: questId })
      setVerification(result)
    } catch (error) {
      console.error('Verification failed:', error)
    }
  }

  // Handle export
  const handleExport = async (request: any) => {
    if (!questId) return

    try {
      setStatus('exporting')
      const result = await api.exportQuest(request)
      setArtifacts(result.artifacts)
      
      if (result.receipt) {
        setReceipt(result.receipt)
      }
      
      setStatus('ready')
    } catch (error) {
      console.error('Export failed:', error)
      setStatus('ready')
    }
  }

  // Handle video time updates
  const handleVideoTimeUpdate = (currentTime: number, duration: number) => {
    // Could trigger checkpoint highlights based on video time
  }

  // Handle video status changes
  const handleVideoStatusChange = (videoStatus: string) => {
    // Could update UI based on video playback status
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Loading quest...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-error mb-4 mx-auto" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Quest</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    )
  }

  const currentCheckpoint = checkpoints.find(cp => cp.id === currentStep)

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg to-surface/20">
      {/* Header */}
      <header className="border-b border-border/50 glass-panel-light">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Templates</span>
              </Link>
              
              <div className="w-px h-6 bg-border" />
              
              <div>
                <h1 className="text-xl font-semibold">Sales Quote Builder</h1>
                <p className="text-sm text-muted-foreground">Quest ID: {questId}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <StatusPill status={status} />
              <DeltaBadge status={deltaStatus} renderTime={lastRenderTime} />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportDrawerOpen(true)}
                className="hover-glow"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video + Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="glass-panel overflow-hidden">
              <CardContent className="p-0">
                <VideoPlayer
                  src={previewUrl || ''}
                  poster="/thumbnails/sales-quote.jpg"
                  onTimeUpdate={handleVideoTimeUpdate}
                  onStatusChange={handleVideoStatusChange}
                  enableCaptions={true}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Checkpoint Bar */}
            <Card className="glass-panel">
              <CardContent className="p-6">
                <CheckpointBar
                  checkpoints={checkpoints}
                  currentStep={currentStep}
                  stepValues={stepValues}
                  onCheckpointClick={handleCheckpointClick}
                  renderStatus={renderStatus}
                />
              </CardContent>
            </Card>

            {/* Quest Progress */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="glass-panel-light">
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">~45s</div>
                  <div className="text-sm text-muted-foreground">Total Duration</div>
                </CardContent>
              </Card>
              
              <Card className="glass-panel-light">
                <CardContent className="p-4 text-center">
                  <Zap className="w-8 h-8 text-accent mx-auto mb-2" />
                  <div className="text-2xl font-bold">{Object.keys(stepValues).length}/{checkpoints.length}</div>
                  <div className="text-sm text-muted-foreground">Steps Complete</div>
                </CardContent>
              </Card>
              
              <Card className="glass-panel-light">
                <CardContent className="p-4 text-center">
                  <CheckCircle className={cn(
                    "w-8 h-8 mx-auto mb-2",
                    verification?.passed ? "text-success" : "text-muted-foreground"
                  )} />
                  <div className="text-2xl font-bold">
                    {verification?.passed ? 'Ready' : 'Pending'}
                  </div>
                  <div className="text-sm text-muted-foreground">Verification</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Step Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {currentStep && currentCheckpoint ? (
                <StepPanel
                  checkpoint={currentCheckpoint}
                  currentValue={stepValues[currentStep]}
                  isOpen={isStepPanelOpen}
                  onClose={() => setCurrentStep(null)}
                  onApply={(value) => handleStepApply(currentStep, value)}
                  isApplying={renderStatus[currentStep] === 'rendering'}
                  stepNumber={checkpoints.findIndex(cp => cp.id === currentStep) + 1}
                  totalSteps={checkpoints.length}
                  estimatedTime="45s"
                />
              ) : (
                <Card className="glass-panel">
                  <CardContent className="p-6 text-center">
                    <div className="text-muted-foreground mb-4">
                      <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <h3 className="font-medium">Select a Checkpoint</h3>
                      <p className="text-sm">Click on any checkpoint above to edit values</p>
                    </div>
                    
                    <div className="space-y-2 text-left">
                      <h4 className="font-medium text-sm">Quick Actions:</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleVerification}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify Quest
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setExportDrawerOpen(true)}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Export Proof Pack
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Export Drawer */}
      <ExportDrawer
        isOpen={isExportDrawerOpen}
        onClose={() => setExportDrawerOpen(false)}
        onExport={handleExport}
        questId={questId}
        artifacts={artifacts}
        receipt={receipt}
        verification={verification}
        isExporting={status === 'exporting'}
      />
    </div>
  )
}
