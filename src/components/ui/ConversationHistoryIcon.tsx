'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface ConversationHistoryIconProps {
  className?: string
  size?: number
}

export default function ConversationHistoryIcon({ 
  className = 'w-4 h-4', 
  size = 16 
}: ConversationHistoryIconProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    // Static version for SSR
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Static conversation threads - more visible */}
        <rect
          x="3"
          y="4"
          width="14"
          height="2"
          rx="1"
          fill="currentColor"
          opacity="0.6"
        />
        <rect
          x="3"
          y="8"
          width="11"
          height="2"
          rx="1"
          fill="currentColor"
          opacity="0.7"
        />
        <rect
          x="3"
          y="12"
          width="13"
          height="2"
          rx="1"
          fill="currentColor"
          opacity="0.8"
        />
        <rect
          x="3"
          y="16"
          width="16"
          height="2"
          rx="1"
          fill="currentColor"
          opacity="1"
        />
        
        {/* Static conversation indicators */}
        <circle
          cx="20"
          cy="5"
          r="1.5"
          fill="currentColor"
          opacity="0.6"
        />
        <circle
          cx="18"
          cy="9"
          r="1.5"
          fill="currentColor"
          opacity="0.7"
        />
        <circle
          cx="19"
          cy="13"
          r="1.5"
          fill="currentColor"
          opacity="0.8"
        />
        <circle
          cx="21"
          cy="17"
          r="1.5"
          fill="currentColor"
          opacity="1"
        />
      </svg>
    )
  }

  // Client-side animated version with higher opacity
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={{ opacity: 1 }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
    >
      {/* Conversation threads with higher visibility */}
      <motion.rect
        x="3"
        y="4"
        width="14"
        height="2"
        rx="1"
        fill="currentColor"
        opacity="0.6"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />
      
      <motion.rect
        x="3"
        y="8"
        width="11"
        height="2"
        rx="1"
        fill="currentColor"
        opacity="0.7"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      
      <motion.rect
        x="3"
        y="12"
        width="13"
        height="2"
        rx="1"
        fill="currentColor"
        opacity="0.8"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      
      {/* Active/current conversation - fully visible */}
      <motion.rect
        x="3"
        y="16"
        width="16"
        height="2"
        rx="1"
        fill="currentColor"
        opacity="1"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      />
      
      {/* Conversation indicators with better visibility */}
      <motion.circle
        cx="20"
        cy="5"
        r="1.5"
        fill="currentColor"
        opacity="0.6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      />
      
      <motion.circle
        cx="18"
        cy="9"
        r="1.5"
        fill="currentColor"
        opacity="0.7"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      />
      
      <motion.circle
        cx="19"
        cy="13"
        r="1.5"
        fill="currentColor"
        opacity="0.8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
      
      {/* Active conversation indicator */}
      <motion.circle
        cx="21"
        cy="17"
        r="1.5"
        fill="currentColor"
        opacity="1"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      />
    </motion.svg>
  )
}