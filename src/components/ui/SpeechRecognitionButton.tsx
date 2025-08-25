'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'
import WaveAnimation from './WaveAnimation'
import StopIcon from './StopIcon'

interface SpeechRecognitionButtonProps {
  isListening: boolean
  isDisabled?: boolean
  hasSupport: boolean
  onClick: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'danger' | 'ghost'
  isProcessing?: boolean
}

const sizeClasses = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3'
}

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4'
}

const variantClasses = {
  default: {
    inactive: 'bg-purple-100 hover:bg-purple-200 text-purple-600 hover:text-purple-700',
    active: 'bg-red-500 hover:bg-red-600 text-white animate-pulse',
    disabled: 'bg-gray-200 text-gray-400 cursor-not-allowed'
  },
  danger: {
    inactive: 'bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700',
    active: 'bg-red-500 hover:bg-red-600 text-white animate-pulse',
    disabled: 'bg-gray-200 text-gray-400 cursor-not-allowed'
  },
  ghost: {
    inactive: 'bg-transparent hover:bg-purple-100 text-purple-600 hover:text-purple-700',
    active: 'bg-red-100 hover:bg-red-200 text-red-600 animate-pulse',
    disabled: 'bg-transparent text-gray-400 cursor-not-allowed'
  }
}

export default function SpeechRecognitionButton({
  isListening,
  isDisabled = false,
  hasSupport,
  onClick,
  className = '',
  size = 'md',
  variant = 'default',
  isProcessing = false
}: SpeechRecognitionButtonProps) {
  const getButtonClass = () => {
    const baseClass = `${sizeClasses[size]} rounded-lg transition-all duration-300 ${className}`
    const variantClass = variantClasses[variant]
    
    if (isDisabled || !hasSupport) {
      return `${baseClass} ${variantClass.disabled} opacity-50`
    }
    
    return `${baseClass} ${isListening ? variantClass.active : variantClass.inactive} cursor-pointer`
  }

  const getTooltipText = () => {
    if (!hasSupport) {
      return 'Speech recognition not supported in this browser'
    }
    if (isProcessing) {
      return 'Voice input disabled while AI is responding'
    }
    if (isDisabled) {
      return 'Voice input disabled'
    }
    return isListening ? 'Click to stop recording' : 'Click to start voice input'
  }

  const getBoxShadow = () => {
    if (isDisabled || !hasSupport) return 'none'
    
    return isListening 
      ? '0 10px 20px rgba(239, 68, 68, 0.4)'
      : variant === 'danger'
        ? '0 10px 20px rgba(239, 68, 68, 0.4)'
        : '0 10px 20px rgba(139, 92, 246, 0.4)'
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isDisabled || !hasSupport}
      whileHover={{
        scale: isDisabled || !hasSupport ? 1 : 1.1,
        boxShadow: getBoxShadow(),
      }}
      whileTap={{ scale: isDisabled || !hasSupport ? 1 : 0.9 }}
      className={getButtonClass()}
      title={getTooltipText()}
      aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      aria-pressed={isListening}
    >
      {isListening ? (
        <div className="flex items-center justify-center">
          <StopIcon className="text-white" size={parseInt(iconSizes[size].match(/w-(\d+)/)?.[1] || '4') * 4} />
        </div>
      ) : (
        <Mic className={iconSizes[size]} />
      )}
    </motion.button>
  )
}