// Direct API calls as fallback when backend is not available
import { ChatMessage } from './api'

const OPENROUTER_API_KEY = "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"
const QWEN_API_KEY = "sk-e0192f5eb74b43a19dfd0968871f642a"

export interface DirectChatRequest {
  messages: ChatMessage[]
  mode: 'agent' | 'assistant'
  provider: 'openrouter' | 'qwen'
  model: string
}

export const directApiService = {
  async chat(request: DirectChatRequest) {
    const { messages, mode, provider, model } = request

    const systemPrompt = mode === 'agent' 
      ? `You are Yumi, a helpful website building assistant with a cute anime-style personality. Guide users through creating their website step by step. Ask one question at a time and provide clear, actionable guidance. Focus on:
        1. Understanding their website purpose and goals
        2. Choosing appropriate design style and colors (suggest cute, modern themes)
        3. Planning website structure and pages
        4. Selecting content and features
        5. Recommending integrations and functionality
        
        Be friendly, encouraging, and break down complex tasks into simple steps. Use emojis occasionally to make the conversation more engaging! 🌟`
      : `You are Yumi, a technical assistant that helps users build websites through natural language commands. You have a cute anime-style personality but are also highly skilled technically. You can:
        1. Generate HTML, CSS, and JavaScript code
        2. Create React components
        3. Modify existing code based on user requests
        4. Provide code explanations and best practices
        5. Help with responsive design and modern web standards
        
        Always provide clean, modern, and functional code. Include comments when helpful and suggest cute, anime-inspired design elements when appropriate! ✨`

    const conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ]

    if (provider === 'qwen') {
      return await this.callQwen(conversationMessages, model)
    } else if (provider === 'openrouter') {
      return await this.callOpenRouter(conversationMessages, model)
    }
    
    throw new Error('Unsupported provider')
  },

  async callQwen(messages: any[], model: string) {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || 'qwen-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`Qwen API error: ${response.statusText}`)
    }

    const result = await response.json()
    return {
      response: result.choices[0].message.content,
      provider: 'qwen',
      model: model || 'qwen-turbo'
    }
  },

  async callOpenRouter(messages: any[], model: string) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Website Builder by Yumi',
      },
      body: JSON.stringify({
        model: model || 'anthropic/claude-3-sonnet',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const result = await response.json()
    return {
      response: result.choices[0].message.content,
      provider: 'openrouter',
      model: model || 'anthropic/claude-3-sonnet'
    }
  }
} 