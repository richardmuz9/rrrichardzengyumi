import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { apiService } from '../services/api'
import { directApiService } from '../services/directApi'

export const ChatPanel = () => {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { 
    messages, 
    mode, 
    provider, 
    model, 
    isLoading,
    addMessage, 
    setLoading 
  } = useStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message to the store
    const newUserMessage = {
      content: userMessage,
      role: 'user' as const
    }
    addMessage(newUserMessage)

    setLoading(true)

    try {
      // Prepare conversation history for API
      const conversationMessages = [
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: userMessage
        }
      ]

      let response
      try {
        // Try backend first
        response = await apiService.chat({
          messages: conversationMessages,
          mode,
          provider,
          model
        })
      } catch (backendError) {
        console.log('Backend unavailable, using direct API:', backendError)
        
        // Fallback to direct API calls
        if (provider === 'openai') {
          throw new Error('OpenAI direct API not available. Please use Qwen or OpenRouter.')
        }
        
        response = await directApiService.chat({
          messages: conversationMessages,
          mode,
          provider: provider as 'openrouter' | 'qwen',
          model
        })
      }

      // Add assistant response
      addMessage({
        content: response.response,
        role: 'assistant',
        provider: response.provider,
        model: response.model
      })
    } catch (error) {
      console.error('Chat error:', error)
      addMessage({
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'} 😅\n\nTip: Try using Qwen or OpenRouter if the backend is unavailable! 🚀`,
        role: 'assistant'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-purple-100 p-4 bg-gradient-to-r from-purple-50 to-pink-50">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          {mode === 'agent' ? '🤖' : '💬'} 
          <span>{mode === 'agent' ? 'Agent Mode' : 'Assistant Mode'}</span>
        </h2>
        <p className="text-sm text-gray-600 flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Using {provider} - {model}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-6xl mb-4 animate-bounce">🌸</div>
            <h3 className="text-xl font-medium mb-2 text-purple-700">Hi! I'm Yumi! ✨</h3>
            <p className="text-sm bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 max-w-md mx-auto">
              {mode === 'agent' 
                ? "I'll help you build your website step by step! Let's start by understanding what you want to create! 🎨"
                : "I'm here to help you with code and technical questions! What would you like to build today? 💻"
              }
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white border border-purple-100 text-gray-800 shadow-md'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.provider && message.model && (
                <div className="text-xs opacity-70 mt-2 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-current rounded-full"></span>
                  {message.provider} • {message.model}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-purple-100 rounded-2xl px-4 py-3 shadow-md">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                </div>
                <span className="text-gray-600">Yumi is thinking... 💭</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-purple-100 p-4 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex space-x-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... ✨"
            className="flex-1 px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none bg-white/80 backdrop-blur-sm"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
          >
            <span>Send</span>
            <span className="text-lg">🚀</span>
          </button>
        </div>
      </div>
    </div>
  )
} 