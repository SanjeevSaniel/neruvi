'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface WaveAnimationProps {
  isActive: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const sizeConfig = {
  sm: { width: 16, height: 12, barWidth: 2 },
  md: { width: 20, height: 16, barWidth: 2.5 },
  lg: { width: 24, height: 20, barWidth: 3 }
}

export default function WaveAnimation({ 
  isActive, 
  className = '', 
  size = 'md',
  color = 'currentColor' 
}: WaveAnimationProps) {
  const config = sizeConfig[size]
  const bars = 4
  
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ width: config.width, height: config.height }}>
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        className="overflow-visible"
      >
        {Array.from({ length: bars }).map((_, index) => (
          <motion.rect
            key={index}
            x={index * (config.width / bars)}
            y={config.height / 2}
            width={config.barWidth}
            height={2}
            rx={config.barWidth / 2}
            fill={color}
            animate={isActive ? {
              height: [2, config.height * 0.8, config.height * 0.4, config.height, 2],
              y: [config.height / 2, config.height * 0.1, config.height * 0.3, 0, config.height / 2]
            } : {
              height: 2,
              y: config.height / 2
            }}
            transition={isActive ? {
              duration: 1.2,
              repeat: Infinity,
              delay: index * 0.1,
              ease: "easeInOut"
            } : {
              duration: 0.3
            }}
          />
        ))}
      </svg>
    </div>
  )
}