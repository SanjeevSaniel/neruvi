'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface ConversationHistoryIconProps {
  className?: string
  size?: number
}

export default function ConversationHistoryIcon({ 
  className = 'w-4 h-4', 
  size = 16 
}: ConversationHistoryIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={{ opacity: 0.8 }}
      whileHover={{ 
        opacity: 1,
        transition: { duration: 0.2 }
      }}
    >
      {/* Multiple chat threads representing conversation history */}
      
      {/* Background conversation threads */}
      <motion.rect
        x="2"
        y="3"
        width="16"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        opacity="0.25"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      />
      
      <motion.rect
        x="2"
        y="7"
        width="12"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        opacity="0.35"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      
      <motion.rect
        x="2"
        y="11"
        width="14"
        height="2.5"
        rx="1.25"
        fill="currentColor"
        opacity="0.45"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      />
      
      {/* Active/current conversation - highlighted */}
      <motion.rect
        x="2"
        y="15"
        width="18"
        height="3"
        rx="1.5"
        fill="currentColor"
        opacity="0.8"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      />
      
      {/* Conversation indicators/dots */}
      <motion.circle
        cx="20"
        cy="4.25"
        r="1"
        fill="currentColor"
        opacity="0.3"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      />
      
      <motion.circle
        cx="18"
        cy="8.25"
        r="1"
        fill="currentColor"
        opacity="0.4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      />
      
      <motion.circle
        cx="19"
        cy="12.25"
        r="1"
        fill="currentColor"
        opacity="0.5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />
      
      {/* Active conversation indicator - pulsing */}
      <motion.circle
        cx="22"
        cy="16.5"
        r="1.5"
        fill="currentColor"
        opacity="0.9"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.9, 0.6, 0.9]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8
        }}
      />
      
      {/* Subtle connecting lines showing conversation flow */}
      <motion.path
        d="M1 1 Q 2 20 23 21"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.15"
        strokeDasharray="1,1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ 
          duration: 2, 
          ease: "easeInOut",
          delay: 1 
        }}
      />
    </motion.svg>
  )
}