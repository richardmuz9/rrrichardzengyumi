import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { apiService } from '../services/api'

export const SettingsPanel = () => {
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  
  const {
    provider,
    model,
    availableModels,
    messages,
    setProvider,
    setModel,
    setAvailableModels,
    clearMessages,
    archiveMessages,
    setCurrentView
  } = useStore()

  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await apiService.getModels()
        setAvailableModels(models)
        setBackendStatus('connected')
      } catch (error) {
        console.error('Failed to load models from backend, using fallback:', error)
        setBackendStatus('disconnected')
        // Fallback models when backend is not available
        const fallbackModels = {
          qwen: [
            'qwen-turbo',
            'qwen-vl-plus',
            'qwen-vl-max'
          ],
          openrouter: [
            'anthropic/claude-3-opus',
            'anthropic/claude-3-sonnet',
            'meta-llama/llama-3-70b-instruct',
            'mistralai/mixtral-8x7b-instruct'
          ],
          openai: [
            'gpt-4',
            'gpt-4-turbo',
            'gpt-3.5-turbo'
          ]
        }
        setAvailableModels(fallbackModels)
      }
    }
    loadModels()
  }, [setAvailableModels])

  const handleProviderChange = (newProvider: 'openai' | 'openrouter' | 'qwen') => {
    setProvider(newProvider)
    // Set default model for the new provider
    const models = availableModels[newProvider]
    if (models && models.length > 0) {
      setModel(models[0])
    }
  }

  const getProviderEmoji = (providerName: string) => {
    switch (providerName) {
      case 'qwen': return '🚀'
      case 'openrouter': return '🌐'
      case 'openai': return '🤖'
      default: return '⚡'
    }
  }

  const getProviderColor = (providerName: string) => {
    switch (providerName) {
      case 'qwen': return 'from-blue-400 to-cyan-400'
      case 'openrouter': return 'from-green-400 to-emerald-400'
      case 'openai': return 'from-purple-400 to-pink-400'
      default: return 'from-gray-400 to-gray-500'
    }
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">⚙️</span>
        AI Settings
      </h3>
      
      {/* Provider Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          AI Provider
        </label>
        <div className="space-y-2">
          {(['qwen', 'openrouter', 'openai'] as const).map((providerOption) => {
            const isDisabled = backendStatus === 'disconnected' && providerOption === 'openai'
            return (
              <button
                key={providerOption}
                onClick={() => !isDisabled && handleProviderChange(providerOption)}
                disabled={isDisabled}
                className={`w-full p-3 rounded-xl border-2 transition-all duration-300 ${
                  isDisabled 
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : provider === providerOption
                      ? `border-purple-300 bg-gradient-to-r ${getProviderColor(providerOption)} text-white shadow-lg transform scale-105`
                      : 'border-gray-200 bg-white hover:border-purple-200 hover:shadow-md'
                }`}
              >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getProviderEmoji(providerOption)}</span>
                <div className="text-left">
                  <div className="font-medium capitalize">
                    {providerOption}
                    {providerOption === 'qwen' && (
                      <span className="ml-2 text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className={`text-xs ${provider === providerOption ? 'text-white/80' : 'text-gray-500'}`}>
                    {providerOption === 'qwen' && 'Fast and cost-effective'}
                    {providerOption === 'openrouter' && 'Multiple models available'}
                    {providerOption === 'openai' && 'Powerful GPT models'}
                  </div>
                </div>
                {isDisabled && (
                  <div className="text-xs text-red-500 mt-1">
                    Requires backend connection
                  </div>
                )}
              </div>
            </button>
            )
          })}
        </div>
      </div>

      {/* Model Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Model
        </label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/80 backdrop-blur-sm"
        >
          {availableModels[provider]?.map((modelName) => (
            <option key={modelName} value={modelName}>
              {modelName}
            </option>
          ))}
        </select>
      </div>

      {/* Provider Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getProviderEmoji(provider)}</span>
          <div className="text-sm text-gray-700">
            {provider === 'qwen' && (
              <div>
                <div className="font-medium text-purple-700 mb-1">Qwen by Alibaba</div>
                <p>Fast, reliable, and cost-effective AI models perfect for website building tasks! 🚀</p>
              </div>
            )}
            {provider === 'openrouter' && (
              <div>
                <div className="font-medium text-green-700 mb-1">OpenRouter</div>
                <p>Access to multiple AI models including Claude, Llama, and more! Choose the best model for your needs. 🌐</p>
              </div>
            )}
            {provider === 'openai' && (
              <div>
                <div className="font-medium text-purple-700 mb-1">OpenAI</div>
                <p>Powerful GPT models with excellent reasoning capabilities. Requires API credits. 🤖</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Management */}
      <div className="mb-6 space-y-3">
        <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
          <span className="text-lg">💬</span>
          Chat Management
        </h4>
        
        {/* Archive Chat Button */}
        <button
          onClick={() => setCurrentView('archive')}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <span className="text-lg">🗄️</span>
          <span>View Archive History</span>
        </button>

        {/* Save Current Chat Button */}
        <button
          onClick={() => {
            archiveMessages()
            // Show success message or toast here
            alert('Chat archived successfully! 🎉')
          }}
          disabled={messages.length === 0}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <span className="text-lg">💾</span>
          <span>Save Current Chat</span>
          {messages.length > 0 && (
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
              {messages.length} messages
            </span>
          )}
        </button>

        {/* Clear Chat Button */}
        <button
          onClick={clearMessages}
          disabled={messages.length === 0}
          className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <span className="text-lg">🧹</span>
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Status indicator */}
      <div className="mt-4 flex flex-col items-center gap-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            backendStatus === 'connected' ? 'bg-green-400 animate-pulse' :
            backendStatus === 'disconnected' ? 'bg-orange-400 animate-pulse' :
            'bg-gray-400 animate-spin'
          }`}></div>
          <span>
            {backendStatus === 'connected' ? `Backend Connected • ${provider}` :
             backendStatus === 'disconnected' ? `Direct API Mode • ${provider}` :
             'Checking connection...'}
          </span>
        </div>
        {backendStatus === 'disconnected' && (
          <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
            Backend unavailable - Using direct API calls
          </div>
        )}
      </div>
    </div>
  )
} 