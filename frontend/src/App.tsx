import { useStore } from './store'
import { ChatPanel } from './components/ChatPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { ArchiveHistory } from './components/ArchiveHistory'

function App() {
  const { mode, setMode, currentView, setCurrentView } = useStore()

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Beautiful anime background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/yumi-tusr.png)',
          filter: 'brightness(0.7) blur(1px)'
        }}
      />
      
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-blue-900/20" />
      
      {/* Floating elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-8 h-8 bg-yellow-300/60 rounded-full animate-bounce"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-pink-300/50 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-4 h-4 bg-blue-300/70 rounded-full animate-bounce delay-300"></div>
        <div className="absolute top-1/3 right-1/4 w-5 h-5 bg-green-300/60 rounded-full animate-pulse delay-500"></div>
        
        {/* Star shapes */}
        <div className="absolute top-16 left-1/3 text-yellow-400 text-2xl opacity-70 animate-pulse">⭐</div>
        <div className="absolute bottom-32 right-1/3 text-yellow-300 text-lg opacity-60 animate-bounce delay-700">⭐</div>
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-4xl">🌸</span>
              Website Builder by Yumi
            </h1>
            <p className="text-gray-600">Build beautiful websites with AI assistance ✨</p>
            <p className="text-sm text-purple-600 font-medium">yumi77965.online</p>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-lg">
            <button
              onClick={() => setMode('agent')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                mode === 'agent'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                  : 'bg-white/70 text-gray-700 hover:bg-white/90 hover:shadow-md'
              }`}
            >
              🤖 Agent Mode
            </button>
            <button
              onClick={() => setMode('assistant')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                mode === 'assistant'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                  : 'bg-white/70 text-gray-700 hover:bg-white/90 hover:shadow-md'
              }`}
            >
              💬 Assistant Mode
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Panel or Archive View */}
          <div className={`${mode === 'assistant' && currentView === 'chat' ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20`}>
            <div className="h-[700px]">
              {currentView === 'chat' ? (
                <ChatPanel />
              ) : (
                <ArchiveHistory onBack={() => setCurrentView('chat')} />
              )}
            </div>
          </div>

          {/* Settings Panel (only visible in chat view) */}
          {currentView === 'chat' && (
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20">
                <SettingsPanel />
              </div>
            
            {/* Preview Panel (only in Assistant Mode) */}
            {mode === 'assistant' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="text-xl">🎨</span>
                  Live Preview
                </h3>
                <div className="h-[400px] border-2 border-dashed border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🌟</div>
                    <p className="text-gray-500">Preview will appear here</p>
                    <p className="text-sm text-purple-600 mt-1">Start chatting to see magic happen!</p>
                  </div>
                </div>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App 