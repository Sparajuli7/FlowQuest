'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Checkpoint } from '@flowquest/common-schemas'

interface CheckpointBarProps {
  checkpoints: Checkpoint[]
  currentStep: string | null
  stepValues: Record<string, any>
  onCheckpointClick: (checkpointId: string) => void
  renderStatus: Record<string, 'idle' | 'rendering' | 'complete'>
  className?: string
}

interface CheckpointDotProps {
  checkpoint: Checkpoint
  isActive: boolean
  isCurrent: boolean
  status: 'idle' | 'rendering' | 'complete'
  value: any
  onClick: () => void
}

function CheckpointDot({ 
  checkpoint, 
  isActive, 
  isCurrent,
  status, 
  value, 
  onClick 
}: CheckpointDotProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const getStatusStyle = () => {
    switch (status) {
      case 'rendering':
        return 'animate-pulse-glow border-warning bg-warning/20'
      case 'complete':
        return 'border-success bg-success/20'
      case 'idle':
      default:
        if (isCurrent) {
          return 'border-primary-2 bg-primary-2/30 shadow-glow'
        } else if (isActive) {
          return 'border-primary bg-primary/20'
        }
        return 'border-surface bg-surface/50'
    }
  }
  
  const formatValue = (val: any): string => {
    if (val === null || val === undefined || val === '') {
      return 'Not set'
    }
    
    switch (checkpoint.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0
        }).format(val)
      case 'date':
        return val.toString()
      case 'multiselect':
        return Array.isArray(val) ? `${val.length} selected` : val
      default:
        return val.toString().substring(0, 20) + (val.toString().length > 20 ? '...' : '')
    }
  }

  return (
    <div className="relative">
      {/* Checkpoint Dot */}
      <button
        className={cn(
          'relative w-4 h-4 rounded-full border-2 transition-all duration-300',
          'hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary-2 focus:ring-offset-2 focus:ring-offset-bg',
          'btn-press',
          getStatusStyle()
        )}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`${checkpoint.label} checkpoint`}
        role="button"
        tabIndex={0}
      >
        {/* Inner dot for active states */}
        {(isCurrent || status === 'complete') && (
          <div className={cn(
            'absolute inset-1 rounded-full transition-all duration-200',
            status === 'complete' ? 'bg-success' : 'bg-primary-2'
          )} />
        )}
        
        {/* Rendering spinner */}
        {status === 'rendering' && (
          <div className="absolute inset-0 border-2 border-warning border-t-transparent rounded-full animate-spin" />
        )}
      </button>

      {/* Hover/Active Tooltip */}
      {(isHovered || isCurrent) && (
        <div className={cn(
          'absolute bottom-full mb-2 left-1/2 -translate-x-1/2',
          'glass-panel px-3 py-2 rounded-lg text-sm whitespace-nowrap z-10',
          'animate-fade-in pointer-events-none',
          'max-w-48'
        )}>
          <div className="text-white font-medium">{checkpoint.label}</div>
          <div className="text-muted-foreground text-xs">
            {formatValue(value)}
          </div>
          
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-card" />
        </div>
      )}
    </div>
  )
}

export function CheckpointBar({
  checkpoints,
  currentStep,
  stepValues,
  onCheckpointClick,
  renderStatus,
  className
}: CheckpointBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  
  const handleKeyDown = (event: React.KeyboardEvent, checkpointId: string, index: number) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        onCheckpointClick(checkpointId)
        break
      case 'ArrowLeft':
        event.preventDefault()
        if (index > 0) {
          onCheckpointClick(checkpoints[index - 1].id)
        }
        break
      case 'ArrowRight':
        event.preventDefault()
        if (index < checkpoints.length - 1) {
          onCheckpointClick(checkpoints[index + 1].id)
        }
        break
    }
  }

  if (checkpoints.length === 0) {
    return null
  }

  return (
    <div className={cn('w-full', className)} role="tablist" aria-label="Quest checkpoints">
      {/* Progress Line */}
      <div className="relative">
        {/* Background line */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          <div className="w-full h-0.5 bg-surface/30" />
        </div>
        
        {/* Active progress line */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          <div 
            className="h-0.5 bg-gradient-to-r from-primary to-primary-2 transition-all duration-500"
            style={{
              width: `${(checkpoints.findIndex(cp => cp.id === currentStep) + 1) / checkpoints.length * 100}%`
            }}
          />
        </div>

        {/* Checkpoints */}
        <div 
          ref={barRef}
          className="relative flex justify-between items-center py-4"
        >
          {checkpoints.map((checkpoint, index) => {
            const isActive = stepValues[checkpoint.id] !== undefined && stepValues[checkpoint.id] !== ''
            const isCurrent = checkpoint.id === currentStep
            const status = renderStatus[checkpoint.id] || 'idle'
            
            return (
              <div 
                key={checkpoint.id} 
                className="relative"
                onKeyDown={(e) => handleKeyDown(e, checkpoint.id, index)}
              >
                <CheckpointDot
                  checkpoint={checkpoint}
                  isActive={isActive}
                  isCurrent={isCurrent}
                  status={status}
                  value={stepValues[checkpoint.id]}
                  onClick={() => onCheckpointClick(checkpoint.id)}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile Labels (shown below on small screens) */}
      <div className="flex justify-between mt-2 md:hidden">
        {checkpoints.map((checkpoint) => (
          <button
            key={checkpoint.id}
            className={cn(
              'text-xs px-2 py-1 rounded transition-colors',
              checkpoint.id === currentStep 
                ? 'text-primary-2 bg-primary/10' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => onCheckpointClick(checkpoint.id)}
          >
            {checkpoint.label}
          </button>
        ))}
      </div>
    </div>
  )
}
