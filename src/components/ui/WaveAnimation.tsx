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
  sm: { width: 24, height: 12, amplitude: 3, frequency: 2 },
  md: { width: 30, height: 14, amplitude: 4, frequency: 2.5 },
  lg: { width: 36, height: 16, amplitude: 5, frequency: 3 }
}

export default function WaveAnimation({ 
  isActive, 
  className = '', 
  size = 'md',
  color = 'currentColor' 
}: WaveAnimationProps) {
  const config = sizeConfig[size]
  const centerY = config.height / 2
  const points = 50
  
  // Generate sine wave path
  const generateSineWave = (phase = 0, amplitude = config.amplitude) => {
    const pathData = Array.from({ length: points }, (_, i) => {
      const x = (i / (points - 1)) * config.width
      const y = centerY + Math.sin((i / points) * Math.PI * config.frequency + phase) * amplitude
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
    return pathData
  }
  
  return (
    <motion.div 
      className={`flex items-center justify-center ${className}`} 
      style={{ width: config.width, height: config.height }}
      initial={{ opacity: 0, scale: 0.8, x: -10 }}
      animate={isActive ? { 
        opacity: 1, 
        scale: 1, 
        x: 0 
      } : { 
        opacity: 0, 
        scale: 0.8, 
        x: -10 
      }}
      transition={{ 
        duration: 0.4, 
        ease: "easeOut",
        opacity: { duration: 0.3 },
        scale: { duration: 0.4, ease: "backOut" },
        x: { duration: 0.3 }
      }}
    >
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        className="overflow-visible"
      >
        {/* Primary sine wave */}
        <motion.path
          d={generateSineWave()}
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={isActive ? {
            d: [
              generateSineWave(0, config.amplitude * 0.6),
              generateSineWave(Math.PI * 0.5, config.amplitude * 1.2),
              generateSineWave(Math.PI, config.amplitude * 0.8),
              generateSineWave(Math.PI * 1.5, config.amplitude * 1.4),
              generateSineWave(Math.PI * 2, config.amplitude * 0.6)
            ],
            opacity: [0.8, 1, 0.9, 1, 0.8],
            pathLength: 1
          } : {
            d: generateSineWave(0, 0),
            opacity: 0,
            pathLength: 0
          }}
          transition={isActive ? {
            d: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            pathLength: { duration: 0.6, ease: "easeOut", delay: 0.2 }
          } : {
            opacity: { duration: 0.3, ease: "easeIn" },
            pathLength: { duration: 0.4, ease: "easeIn" }
          }}
        />
        
        {/* Secondary wave for depth */}
        <motion.path
          d={generateSineWave(Math.PI * 0.25)}
          stroke={color}
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={isActive ? {
            d: [
              generateSineWave(Math.PI * 0.25, config.amplitude * 0.4),
              generateSineWave(Math.PI * 0.75, config.amplitude * 0.9),
              generateSineWave(Math.PI * 1.25, config.amplitude * 0.6),
              generateSineWave(Math.PI * 1.75, config.amplitude * 1.1),
              generateSineWave(Math.PI * 2.25, config.amplitude * 0.4)
            ],
            opacity: [0.4, 0.6, 0.5, 0.6, 0.4]
          } : {
            d: generateSineWave(Math.PI * 0.25, 0),
            opacity: 0
          }}
          transition={isActive ? {
            d: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 },
            opacity: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }
          } : {
            opacity: { duration: 0.4, ease: "easeIn", delay: 0.1 }
          }}
        />
        
        {/* Tertiary wave for more complexity */}
        <motion.path
          d={generateSineWave(Math.PI * 0.5)}
          stroke={color}
          strokeWidth="0.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={isActive ? {
            d: [
              generateSineWave(Math.PI * 0.5, config.amplitude * 0.3),
              generateSineWave(Math.PI, config.amplitude * 0.7),
              generateSineWave(Math.PI * 1.5, config.amplitude * 0.5),
              generateSineWave(Math.PI * 2, config.amplitude * 0.9),
              generateSineWave(Math.PI * 2.5, config.amplitude * 0.3)
            ],
            opacity: [0.2, 0.4, 0.3, 0.4, 0.2]
          } : {
            d: generateSineWave(Math.PI * 0.5, 0),
            opacity: 0
          }}
          transition={isActive ? {
            d: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
            opacity: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 }
          } : {
            opacity: { duration: 0.5, ease: "easeIn", delay: 0.2 }
          }}
        />
        
        {/* Subtle glowing effect */}
        {isActive && (
          <motion.path
            d={generateSineWave()}
            stroke={color}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="blur(1px)"
            initial={{ opacity: 0 }}
            animate={{
              d: [
                generateSineWave(0, config.amplitude * 0.6),
                generateSineWave(Math.PI * 0.5, config.amplitude * 1.2),
                generateSineWave(Math.PI, config.amplitude * 0.8),
                generateSineWave(Math.PI * 1.5, config.amplitude * 1.4),
                generateSineWave(Math.PI * 2, config.amplitude * 0.6)
              ],
              opacity: [0.05, 0.15, 0.1, 0.15, 0.05]
            }}
            transition={{
              d: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              opacity: { 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 0.5
              }
            }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
          />
        )}
      </svg>
    </motion.div>
  )
}