'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface StopIconProps {
  className?: string
  size?: number
}

export default function StopIcon({ className = '', size = 16 }: StopIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.rect
        x={6}
        y={6}
        width={12}
        height={12}
        rx={2}
        fill="currentColor"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.svg>
  )
}