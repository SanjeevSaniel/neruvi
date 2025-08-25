'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import SpeechRecognitionButton from '@/components/ui/SpeechRecognitionButton'
import SpeechStatus from '@/components/ui/SpeechStatus'
import WaveAnimation from '@/components/ui/WaveAnimation'
import { SUPPORTED_LANGUAGES, SpeechConfig } from '@/lib/speech-config'
import { Settings, Info, CheckCircle, XCircle } from 'lucide-react'

export default function SpeechToTextDemo() {
  const [inputValue, setInputValue] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showSpeechError, setShowSpeechError] = useState(false)
  const [speechConfig, setSpeechConfig] = useState<Partial<SpeechConfig>>({
    language: 'en-US',
    continuous: false,
    interimResults: true,
    autoStop: true,
    autoStopTimeout: 30000
  })

  const {
    finalTranscript,
    interimTranscript,
    isListening,
    hasRecognitionSupport,
    browserSupport,
    startListening,
    stopListening,
    resetTranscript,
    error,
    config
  } = useSpeechRecognition(speechConfig)

  // Handle final transcript updates
  React.useEffect(() => {
    if (finalTranscript && finalTranscript.trim() && !isListening) {
      setInputValue(prev => prev + (prev ? ' ' : '') + finalTranscript.trim())
      resetTranscript()
    }
  }, [finalTranscript, isListening, resetTranscript])

  // Handle errors
  React.useEffect(() => {
    if (error) {
      setShowSpeechError(true)
      const timer = setTimeout(() => setShowSpeechError(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleMicClick = () => {
    if (!hasRecognitionSupport) {
      setShowSpeechError(true)
      setTimeout(() => setShowSpeechError(false), 3000)
      return
    }

    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const clearInput = () => {
    setInputValue('')
    resetTranscript()
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          Speech-to-Text Demo
        </h2>
        <p className="text-purple-600">
          Complete speech recognition implementation with modular components
        </p>
      </div>

      {/* Browser Support Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg border ${
          hasRecognitionSupport 
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}
      >
        <div className="flex items-center space-x-2 mb-2">
          {hasRecognitionSupport ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="font-semibold">
            Browser Support: {browserSupport.browser}
          </span>
        </div>
        
        {browserSupport.recommendations.length > 0 && (
          <div className="text-sm">
            <p className="font-medium mb-1">Recommendations:</p>
            <ul className="list-disc list-inside space-y-1">
              {browserSupport.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>

      {/* Settings Panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg border border-purple-200 p-4"
      >
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center space-x-2 text-purple-700 hover:text-purple-900 font-medium"
        >
          <Settings className="w-4 h-4" />
          <span>Speech Recognition Settings</span>
        </button>
        
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 space-y-4"
          >
            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={speechConfig.language}
                onChange={(e) => setSpeechConfig(prev => ({
                  ...prev,
                  language: e.target.value
                }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Configuration Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={speechConfig.continuous}
                  onChange={(e) => setSpeechConfig(prev => ({
                    ...prev,
                    continuous: e.target.checked
                  }))}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm">Continuous Recording</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={speechConfig.interimResults}
                  onChange={(e) => setSpeechConfig(prev => ({
                    ...prev,
                    interimResults: e.target.checked
                  }))}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm">Show Interim Results</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={speechConfig.autoStop}
                  onChange={(e) => setSpeechConfig(prev => ({
                    ...prev,
                    autoStop: e.target.checked
                  }))}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm">Auto Stop</span>
              </label>

              {speechConfig.autoStop && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto Stop Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={(speechConfig.autoStopTimeout || 30000) / 1000}
                    onChange={(e) => setSpeechConfig(prev => ({
                      ...prev,
                      autoStopTimeout: parseInt(e.target.value) * 1000
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Main Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="bg-white rounded-xl border-2 border-purple-200 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Speech Input
            </label>
            <div className="flex items-center space-x-2">
              <SpeechRecognitionButton
                isListening={isListening}
                isDisabled={false}
                hasSupport={hasRecognitionSupport}
                onClick={handleMicClick}
                size="sm"
                variant="default"
              />
              
              {/* Wave Animation during recording */}
              {isListening && (
                <WaveAnimation 
                  isActive={isListening} 
                  size="sm" 
                  color="rgb(147 51 234)"
                />
              )}
              
              <button
                onClick={clearInput}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          
          <textarea
            value={inputValue + (isListening && interimTranscript ? (inputValue ? ' ' : '') + interimTranscript : '')}
            onChange={(e) => {
              if (!isListening) {
                setInputValue(e.target.value)
              }
            }}
            placeholder={isListening 
              ? (interimTranscript ? "Processing speech..." : "Listening... Speak now!") 
              : "Type here or click the microphone to speak..."
            }
            rows={6}
            className={`w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
              isListening ? 'bg-purple-50 border-purple-300' : 'bg-white'
            }`}
          />          
          
          {/* Real-time Speech Feedback */}
          {isListening && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-blue-800">Listening...</span>
              </div>
              {interimTranscript && (
                <div className="mt-1 text-blue-700">
                  <span className="font-medium">Current: </span>
                  <span className="italic">{interimTranscript}</span>
                </div>
              )}
            </div>
          )}
          
        </div>

        {/* Speech Status */}
        <SpeechStatus
          isListening={isListening}
          error={error}
          hasSupport={hasRecognitionSupport}
          showError={showSpeechError}
          position="top"
        />
      </motion.div>

      {/* Configuration Display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-50 rounded-lg p-4"
      >
        <div className="flex items-center space-x-2 mb-2">
          <Info className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">Current Configuration</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Language:</span>
            <span className="ml-1 font-medium">{config.language}</span>
          </div>
          <div>
            <span className="text-gray-600">Continuous:</span>
            <span className="ml-1 font-medium">{config.continuous ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <span className="text-gray-600">Interim Results:</span>
            <span className="ml-1 font-medium">{config.interimResults ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <span className="text-gray-600">Auto Stop:</span>
            <span className="ml-1 font-medium">
              {config.autoStop ? `${config.autoStopTimeout / 1000}s` : 'No'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Usage Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <h3 className="font-semibold text-blue-800 mb-2">How to use:</h3>
        <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
          <li>Click the microphone button to start/stop recording</li>
          <li>Speak clearly into your microphone</li>
          <li>Text will appear in real-time (if interim results enabled)</li>
          <li>Adjust settings above to customize behavior</li>
          <li>Speech will auto-stop after timeout (if enabled)</li>
        </ul>
      </motion.div>
    </div>
  )
}