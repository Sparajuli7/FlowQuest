import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { 
  ShotGraph, 
  Checkpoint, 
  StepValue, 
  VerificationResult, 
  Artifacts,
  OutcomeReceipt 
} from '@flowquest/common-schemas'

export interface QuestStore {
  // Current quest data
  questId: string | null
  templateKey: string | null
  shotGraph: ShotGraph | null
  checkpoints: Checkpoint[]
  previewUrl: string | null
  
  // Current state
  status: 'idle' | 'generating' | 'preview' | 'rendering' | 'ready' | 'exporting' | 'completed'
  currentStep: string | null
  stepValues: Record<string, StepValue>
  
  // Verification
  verification: VerificationResult | null
  
  // Export data
  artifacts: Artifacts | null
  receipt: OutcomeReceipt | null
  
  // UI state
  isStepPanelOpen: boolean
  isExportDrawerOpen: boolean
  
  // Actions
  setQuest: (questId: string, templateKey: string, checkpoints: Checkpoint[], previewUrl: string) => void
  setShotGraph: (shotGraph: ShotGraph) => void
  setStatus: (status: QuestStore['status']) => void
  setCurrentStep: (stepId: string | null) => void
  updateStepValue: (stepId: string, value: StepValue) => void
  setVerification: (verification: VerificationResult) => void
  setArtifacts: (artifacts: Artifacts) => void
  setReceipt: (receipt: OutcomeReceipt) => void
  setStepPanelOpen: (open: boolean) => void
  setExportDrawerOpen: (open: boolean) => void
  reset: () => void
}

const initialState = {
  questId: null,
  templateKey: null,
  shotGraph: null,
  checkpoints: [],
  previewUrl: null,
  status: 'idle' as const,
  currentStep: null,
  stepValues: {},
  verification: null,
  artifacts: null,
  receipt: null,
  isStepPanelOpen: false,
  isExportDrawerOpen: false,
}

export const useQuestStore = create<QuestStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setQuest: (questId, templateKey, checkpoints, previewUrl) => {
          set({
            questId,
            templateKey,
            checkpoints,
            previewUrl,
            status: 'preview',
            // Initialize step values from checkpoints
            stepValues: checkpoints.reduce((acc, checkpoint) => {
              if (checkpoint.type === 'number') {
                acc[checkpoint.id] = checkpoint.min || 0
              } else if (checkpoint.type === 'currency') {
                acc[checkpoint.id] = checkpoint.min || 10000
              } else if (checkpoint.type === 'select' && checkpoint.options?.length) {
                acc[checkpoint.id] = checkpoint.options[0]
              } else {
                acc[checkpoint.id] = ''
              }
              return acc
            }, {} as Record<string, StepValue>)
          }, false, 'setQuest')
        },

        setShotGraph: (shotGraph) => {
          set({ shotGraph }, false, 'setShotGraph')
        },

        setStatus: (status) => {
          set({ status }, false, 'setStatus')
        },

        setCurrentStep: (stepId) => {
          set({ 
            currentStep: stepId,
            isStepPanelOpen: stepId !== null 
          }, false, 'setCurrentStep')
        },

        updateStepValue: (stepId, value) => {
          set((state) => ({
            stepValues: {
              ...state.stepValues,
              [stepId]: value
            }
          }), false, 'updateStepValue')
        },

        setVerification: (verification) => {
          set({ verification }, false, 'setVerification')
        },

        setArtifacts: (artifacts) => {
          set({ artifacts }, false, 'setArtifacts')
        },

        setReceipt: (receipt) => {
          set({ receipt }, false, 'setReceipt')
        },

        setStepPanelOpen: (open) => {
          set({ isStepPanelOpen: open }, false, 'setStepPanelOpen')
        },

        setExportDrawerOpen: (open) => {
          set({ isExportDrawerOpen: open }, false, 'setExportDrawerOpen')
        },

        reset: () => {
          set(initialState, false, 'reset')
        },
      }),
      {
        name: 'flowquest-store',
        partialize: (state) => ({
          questId: state.questId,
          templateKey: state.templateKey,
          stepValues: state.stepValues,
          verification: state.verification,
        }),
      }
    ),
    {
      name: 'quest-store',
    }
  )
)
