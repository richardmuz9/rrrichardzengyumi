const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message?: string // Keep for backward compatibility
  messages?: ChatMessage[] // New messages array support
  mode: 'agent' | 'assistant'
  provider?: 'openai' | 'openrouter' | 'qwen'
  model?: string
}

export interface ChatResponse {
  response: string
  provider: string
  model: string
}

export interface ModelsResponse extends Record<string, string[]> {
  openai: string[]
  openrouter: string[]
  qwen: string[]
}

export const apiService = {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send message')
    }

    return response.json()
  },

  async getModels(): Promise<ModelsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/models`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch models')
    }

    return response.json()
  },

  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/health`)
    
    if (!response.ok) {
      throw new Error('Health check failed')
    }

    return response.json()
  }
} 