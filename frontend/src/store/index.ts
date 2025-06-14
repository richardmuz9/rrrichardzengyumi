import { create } from 'zustand'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  provider?: string
  model?: string
}

interface AppState {
  mode: 'agent' | 'assistant'
  messages: Message[]
  previewCode: string
  provider: 'openai' | 'openrouter' | 'qwen'
  model: string
  availableModels: Record<string, string[]>
  isLoading: boolean
  currentView: 'chat' | 'archive'
  setMode: (mode: 'agent' | 'assistant') => void
  setProvider: (provider: 'openai' | 'openrouter' | 'qwen') => void
  setModel: (model: string) => void
  setAvailableModels: (models: Record<string, string[]>) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  clearMessages: () => void
  archiveMessages: () => void
  setCurrentView: (view: 'chat' | 'archive') => void
  setPreviewCode: (code: string) => void
  setLoading: (loading: boolean) => void
}

export const useStore = create<AppState>((set, get) => ({
  mode: 'agent',
  messages: [],
  previewCode: '',
  provider: 'qwen',
  model: 'qwen-turbo',
  availableModels: {},
  isLoading: false,
  currentView: 'chat',
  setMode: (mode) => set({ mode }),
  setProvider: (provider) => set({ provider }),
  setModel: (model) => set({ model }),
  setAvailableModels: (models) => set({ availableModels: models }),
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
        },
      ],
    })),
  clearMessages: () => set({ messages: [] }),
  archiveMessages: () => {
    const state = get()
    const archive = {
      messages: state.messages,
      timestamp: new Date().toISOString(),
      provider: state.provider,
      model: state.model,
      mode: state.mode
    }
    
    // Save to localStorage
    const existingArchives = JSON.parse(localStorage.getItem('yumi-chat-archives') || '[]')
    existingArchives.push(archive)
    localStorage.setItem('yumi-chat-archives', JSON.stringify(existingArchives))
    
    console.log('🗄️ Chat archived successfully!', archive)
    
    // Optionally clear messages after archiving
    // set({ messages: [] })
  },
  setCurrentView: (view) => set({ currentView: view }),
  setPreviewCode: (code) => set({ previewCode: code }),
  setLoading: (loading) => set({ isLoading: loading }),
})) 