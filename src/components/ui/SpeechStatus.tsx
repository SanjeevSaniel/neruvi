'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Mic } from 'lucide-react'

interface SpeechStatusProps {
  isListening: boolean
  error: string | null
  hasSupport: boolean
  showError: boolean
  position?: 'top' | 'bottom'
  className?: string
}

export default function SpeechStatus({
  isListening,
  error,
  hasSupport,
  showError,
  position = 'top',
  className = ''
}: SpeechStatusProps) {
  const positionClasses = {
    top: '-top-12',
    bottom: '-bottom-12'
  }

  return (
    <div className={`absolute ${positionClasses[position]} left-0 right-0 flex justify-center ${className}`}>
      <AnimatePresence>
        {/* Recording Status */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === 'top' ? 10 : -10 }}
            className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 shadow-lg"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-white rounded-full"
            />
            <span>Recording...</span>
          </motion.div>
        )}
        
        {/* Error Message */}
        {showError && (error || !hasSupport) && !isListening && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === 'top' ? 10 : -10 }}
            className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 max-w-sm shadow-lg"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              {!hasSupport 
                ? 'Speech recognition not supported in this browser' 
                : error
              }
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}