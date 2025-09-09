import { 
  GenerateRequest, 
  GenerateResponse, 
  AnswerStepRequest, 
  AnswerStepResponse,
  VerifyRequest,
  VerificationResult,
  ExportRequest,
  ExportResponse,
  ErrorResponse
} from '@flowquest/common-schemas'

const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8000/v1' 
  : '/api'

class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({
        error: 'Unknown error',
        code: 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }))
      
      throw new APIError(
        response.status,
        errorData.code,
        errorData.error,
        errorData.details
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    
    // Network or parsing error
    throw new APIError(0, 'NETWORK_ERROR', error instanceof Error ? error.message : 'Network error')
  }
}

export const api = {
  // Generate a new video quest
  async generateQuest(request: GenerateRequest): Promise<GenerateResponse> {
    return apiRequest<GenerateResponse>('/videoquests/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  // Answer a step and trigger delta rendering
  async answerStep(request: AnswerStepRequest): Promise<AnswerStepResponse> {
    return apiRequest<AnswerStepResponse>('/videoquests/answer-step', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  // Verify quest completeness
  async verifyQuest(request: VerifyRequest): Promise<VerificationResult> {
    return apiRequest<VerificationResult>('/videoquests/verify', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  // Export quest to various formats
  async exportQuest(request: ExportRequest): Promise<ExportResponse> {
    return apiRequest<ExportResponse>('/videoquests/export', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  // Health check
  async healthCheck(): Promise<{ status: string; version: string }> {
    return apiRequest<{ status: string; version: string }>('/health')
  },
}

export { APIError }
export type { GenerateRequest, GenerateResponse, AnswerStepRequest, AnswerStepResponse }
