'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import ChatInput from '@/components/chat/ChatInput'
import SpeechToTextDemo from '@/components/examples/SpeechToTextDemo'

export default function SpeechTestPage() {
  const [messages, setMessages] = useState<{ text: string; timestamp: Date }[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'demo'>('demo')

  const handleSubmit = useCallback(async (text: string) => {
    setIsLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setMessages(prev => [...prev, { text, timestamp: new Date() }])
    setIsLoading(false)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-purple-200 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">
            Speech-to-Text Implementation
          </h1>
          <p className="text-purple-600 mb-6">
            Complete speech recognition system with modular components
          </p>
          
          {/* Tab Navigation */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setActiveTab('demo')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'demo'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-purple-600 hover:bg-purple-50'
              }`}
            >
              Full Demo
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-purple-600 hover:bg-purple-50'
              }`}
            >
              Chat Integration
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'demo' ? (
            <SpeechToTextDemo />
          ) : (
            <div className="space-y-6">
              {/* Messages Display */}
              <div className="bg-white/80 rounded-xl p-6 min-h-[300px] shadow-lg">
                <h2 className="text-lg font-semibold text-purple-800 mb-4">Chat Messages:</h2>
                
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <p>No messages yet. Try sending a message using voice or text!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400"
                      >
                        <p className="text-purple-900 mb-1">{message.text}</p>
                        <p className="text-xs text-purple-500">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Input with Speech-to-Text */}
              <div className="bg-white/60 rounded-xl p-2 shadow-lg">
                <ChatInput
                  value={inputValue}
                  onChange={setInputValue}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  placeholder="Type a message or click the mic to speak..."
                />
              </div>

              {/* Quick Start Guide */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Quick Start Guide:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700 text-sm">
                  <div>
                    <h4 className="font-medium mb-1">Basic Usage:</h4>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Click microphone icon to start/stop</li>
                      <li>Speak clearly into microphone</li>
                      <li>Text appears automatically</li>
                      <li>Press Enter or Send to submit</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Requirements:</h4>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Chrome or Edge browser (recommended)</li>
                      <li>Microphone permissions enabled</li>
                      <li>Stable internet connection</li>
                      <li>Quiet environment for best results</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}