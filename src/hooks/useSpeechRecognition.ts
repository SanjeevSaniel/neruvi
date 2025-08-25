'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { SpeechConfig, DEFAULT_SPEECH_CONFIG, checkSpeechRecognitionSupport } from '@/lib/speech-config'

interface SpeechRecognitionOptions extends Partial<SpeechConfig> {}

interface BrowserSupport {
  supported: boolean
  browser: string
  recommendations: string[]
}

interface UseSpeechRecognitionReturn {
  transcript: string
  finalTranscript: string
  interimTranscript: string
  isListening: boolean
  hasRecognitionSupport: boolean
  browserSupport: BrowserSupport
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  error: string | null
  config: SpeechConfig
}

// Extend the Window interface to include webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export const useSpeechRecognition = (
  options: SpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn => {
  const config: SpeechConfig = {
    ...DEFAULT_SPEECH_CONFIG,
    ...options
  }

  const [transcript, setTranscript] = useState<string>('')
  const [finalTranscript, setFinalTranscript] = useState<string>('')
  const [interimTranscript, setInterimTranscript] = useState<string>('')
  const [isListening, setIsListening] = useState<boolean>(false)
  const [hasRecognitionSupport, setHasRecognitionSupport] = useState<boolean>(false)
  const [browserSupport, setBrowserSupport] = useState<BrowserSupport>({
    supported: false,
    browser: 'Unknown',
    recommendations: []
  })
  const [error, setError] = useState<string | null>(null)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check for browser support
  useEffect(() => {
    const support = checkSpeechRecognitionSupport()
    setBrowserSupport(support)
    setHasRecognitionSupport(support.supported)
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognition && support.supported) {
      recognitionRef.current = new SpeechRecognition()
      
      const recognition = recognitionRef.current
      recognition.continuous = config.continuous
      recognition.interimResults = config.interimResults
      recognition.lang = config.language
      recognition.maxAlternatives = config.maxAlternatives

      // Handle results with better accuracy
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentInterim = ''
        let currentFinal = ''
        
        // Process all results to separate interim and final
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i]
          const transcriptPart = result[0].transcript.trim()
          
          if (result.isFinal && transcriptPart) {
            currentFinal += (currentFinal ? ' ' : '') + transcriptPart
          } else if (!result.isFinal && transcriptPart) {
            currentInterim += (currentInterim ? ' ' : '') + transcriptPart
          }
        }
        
        // Update states
        if (currentFinal) {
          setFinalTranscript(prev => {
            const newFinal = prev + (prev ? ' ' : '') + currentFinal
            return newFinal
          })
        }
        
        setInterimTranscript(currentInterim)
        
        // Update combined transcript for display
        setTranscript(prev => {
          // Get current final transcript state
          const currentFinalState = finalTranscript + (currentFinal ? (finalTranscript ? ' ' : '') + currentFinal : '')
          const combined = currentFinalState + (currentInterim ? (currentFinalState ? ' ' : '') + currentInterim : '')
          return combined.trim()
        })
      }

      // Handle errors
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMessage = ''
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please enable microphone permissions.'
            toast.error(errorMessage)
            break
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking again.'
            toast.error(errorMessage, {
              duration: 2000,
              position: 'top-center'
            })
            break
          case 'network':
            errorMessage = 'Network error. Please check your internet connection.'
            toast.error(errorMessage)
            break
          case 'audio-capture':
            errorMessage = 'No microphone found. Please connect a microphone.'
            toast.error(errorMessage)
            break
          default:
            errorMessage = `Speech recognition error: ${event.error}`
            toast.error(errorMessage)
        }
        
        setError(errorMessage)
        setIsListening(false)
      }

      // Handle start
      recognition.onstart = () => {
        setIsListening(true)
        setError(null)
        
        // Clear previous transcripts when starting fresh
        setFinalTranscript('')
        setInterimTranscript('')
        setTranscript('')
        
        // Set auto-stop timeout if enabled
        if (config.autoStop && config.autoStopTimeout > 0) {
          timeoutRef.current = setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current.stop()
            }
          }, config.autoStopTimeout)
        }
      }

      // Handle end
      recognition.onend = () => {
        setIsListening(false)
        
        // Clear interim transcript when done
        setInterimTranscript('')
        
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }

    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [config.continuous, config.interimResults, config.language, config.maxAlternatives, config.autoStop, config.autoStopTimeout])

  const startListening = useCallback(() => {
    if (recognitionRef.current && hasRecognitionSupport && !isListening) {
      setError(null)
      setFinalTranscript('')
      setInterimTranscript('')
      setTranscript('')
      
      try {
        recognitionRef.current.start()
      } catch (error) {
        const errorMessage = 'Failed to start speech recognition'
        toast.error(errorMessage)
        setError(errorMessage)
      }
    }
  }, [hasRecognitionSupport, isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setFinalTranscript('')
    setInterimTranscript('')
  }, [])

  return {
    transcript,
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
  }
}