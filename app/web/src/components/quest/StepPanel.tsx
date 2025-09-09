'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, DollarSign, Calendar, Type, List, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Checkpoint, StepValue } from '@flowquest/common-schemas'

interface StepPanelProps {
  checkpoint: Checkpoint | null
  currentValue: StepValue
  isOpen: boolean
  onClose: () => void
  onApply: (value: StepValue) => void
  onUndo?: () => void
  isApplying?: boolean
  stepNumber?: number
  totalSteps?: number
  estimatedTime?: string
  className?: string
}

interface FormFieldProps {
  checkpoint: Checkpoint
  value: StepValue
  onChange: (value: StepValue) => void
  error?: string
}

function FormField({ checkpoint, value, onChange, error }: FormFieldProps) {
  const getFieldIcon = () => {
    switch (checkpoint.type) {
      case 'currency': return <DollarSign className="w-4 h-4" />
      case 'date': return <Calendar className="w-4 h-4" />
      case 'url': return <Link className="w-4 h-4" />
      case 'multiselect': return <List className="w-4 h-4" />
      default: return <Type className="w-4 h-4" />
    }
  }

  const renderField = () => {
    switch (checkpoint.type) {
      case 'currency':
        return (
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              value={value as number || ''}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              placeholder="0"
              min={checkpoint.min}
              max={checkpoint.max}
              className="pl-9"
            />
          </div>
        )

      case 'number':
        return (
          <Input
            type="number"
            value={value as number || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder="0"
            min={checkpoint.min}
            max={checkpoint.max}
          />
        )

      case 'select':
        return (
          <Select value={value as string || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={checkpoint.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {checkpoint.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {checkpoint.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, option])
                    } else {
                      onChange(selectedValues.filter(v => v !== option))
                    }
                  }}
                />
                <Label htmlFor={option} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )

      case 'date':
        return (
          <Select value={value as string || ''} onValueChange={onChange}>
            <SelectTrigger>
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
        )

      case 'url':
        return (
          <div className="relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="url"
              value={value as string || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://example.com"
              className="pl-9"
            />
          </div>
        )

      case 'text':
      default:
        if (checkpoint.placeholder?.includes('scope') || checkpoint.placeholder?.includes('description')) {
          return (
            <Textarea
              value={value as string || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={checkpoint.placeholder}
              rows={3}
              className="resize-none"
            />
          )
        }
        
        return (
          <Input
            type="text"
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={checkpoint.placeholder}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center space-x-2 text-sm font-medium">
        {getFieldIcon()}
        <span>{checkpoint.label}</span>
        {checkpoint.required && <span className="text-error">*</span>}
      </Label>
      
      {renderField()}
      
      {error && (
        <p className="text-error text-sm flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </p>
      )}
      
      {checkpoint.help && (
        <p className="text-muted-foreground text-xs">
          {checkpoint.help}
        </p>
      )}
    </div>
  )
}

export function StepPanel({
  checkpoint,
  currentValue,
  isOpen,
  onClose,
  onApply,
  onUndo,
  isApplying = false,
  stepNumber,
  totalSteps,
  estimatedTime,
  className
}: StepPanelProps) {
  const [localValue, setLocalValue] = useState<StepValue>(currentValue)
  const [error, setError] = useState<string>('')
  const [hasChanges, setHasChanges] = useState(false)

  // Update local value when current value changes
  useEffect(() => {
    setLocalValue(currentValue)
    setHasChanges(false)
    setError('')
  }, [currentValue, checkpoint?.id])

  // Track changes
  useEffect(() => {
    setHasChanges(JSON.stringify(localValue) !== JSON.stringify(currentValue))
  }, [localValue, currentValue])

  const validateValue = (value: StepValue): string => {
    if (!checkpoint) return ''
    
    if (checkpoint.required && (value === null || value === undefined || value === '')) {
      return 'This field is required'
    }
    
    if (checkpoint.type === 'currency' || checkpoint.type === 'number') {
      const num = value as number
      if (checkpoint.min !== undefined && num < checkpoint.min) {
        return `Value must be at least ${checkpoint.min}`
      }
      if (checkpoint.max !== undefined && num > checkpoint.max) {
        return `Value must not exceed ${checkpoint.max}`
      }
    }
    
    if (checkpoint.type === 'url' && value) {
      try {
        new URL(value as string)
      } catch {
        return 'Please enter a valid URL'
      }
    }
    
    if (checkpoint.type === 'multiselect' && Array.isArray(value) && value.length === 0 && checkpoint.required) {
      return 'Please select at least one option'
    }
    
    return ''
  }

  const handleApply = () => {
    const validationError = validateValue(localValue)
    if (validationError) {
      setError(validationError)
      return
    }
    
    setError('')
    onApply(localValue)
  }

  const handleValueChange = (value: StepValue) => {
    setLocalValue(value)
    setError('') // Clear error on value change
  }

  const formatValue = (val: StepValue): string => {
    if (val === null || val === undefined || val === '') return ''
    
    switch (checkpoint?.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0
        }).format(val as number)
      case 'multiselect':
        return Array.isArray(val) ? val.join(', ') : val.toString()
      default:
        return val.toString()
    }
  }

  if (!checkpoint || !isOpen) {
    return null
  }

  return (
    <div className={cn(
      'fixed inset-y-0 right-0 w-96 z-50 transform transition-transform duration-300',
      'md:relative md:inset-auto md:w-full md:transform-none md:transition-none',
      isOpen ? 'translate-x-0' : 'translate-x-full',
      className
    )}>
      <Card className="h-full glass-panel border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {stepNumber && totalSteps ? `Step ${stepNumber} of ${totalSteps}` : 'Edit Step'}
                </CardTitle>
                {estimatedTime && (
                  <p className="text-caption text-muted-foreground">
                    ~{estimatedTime} left
                  </p>
                )}
              </div>
            </div>
            
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
          {/* Current Value Display */}
          {currentValue && (
            <div className="p-3 bg-surface/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Current value</p>
              <p className="text-sm font-medium">{formatValue(currentValue)}</p>
            </div>
          )}

          {/* Form Field */}
          <FormField
            checkpoint={checkpoint}
            value={localValue}
            onChange={handleValueChange}
            error={error}
          />

          {/* Helper Text */}
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              We'll update just this moment in the video. Your exports will match automatically.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4 border-t border-border/50">
            <Button
              onClick={handleApply}
              disabled={!hasChanges || isApplying}
              className="flex-1 btn-press hover-glow"
            >
              {isApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Applying...
                </>
              ) : (
                'Apply'
              )}
            </Button>
            
            {onUndo && hasChanges && (
              <Button
                variant="outline"
                onClick={() => {
                  setLocalValue(currentValue)
                  onUndo()
                }}
              >
                Undo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Export additional UI components that we're using
function Checkbox({ checked, onCheckedChange, id, ...props }: any) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="w-4 h-4 text-primary bg-transparent border-2 border-border rounded focus:ring-primary focus:ring-2"
      {...props}
    />
  )
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

function SelectTrigger({ children }: any) {
  return <div>{children}</div>
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

function Textarea({ className, ...props }: any) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
