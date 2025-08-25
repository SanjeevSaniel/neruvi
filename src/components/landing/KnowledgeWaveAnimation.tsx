'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, Code2, Database, Lightbulb, BookOpen, Zap } from 'lucide-react'

interface KnowledgeWaveAnimationProps {
  className?: string
}

export default function KnowledgeWaveAnimation({ className = '' }: KnowledgeWaveAnimationProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fixed positions to avoid hydration issues
  const knowledgeIcons = [Brain, Code2, Database, Lightbulb, BookOpen, Zap]
  const particles = Array.from({ length: 12 }, (_, i) => {
    const Icon = knowledgeIcons[i % knowledgeIcons.length]
    // Use deterministic positioning based on index
    return {
      id: i,
      Icon,
      x: (i * 23 + 15) % 100, // Deterministic x position
      y: (i * 17 + 20) % 100, // Deterministic y position
      delay: (i * 0.5) % 4, // Deterministic delay
      duration: 8 + (i % 4), // Deterministic duration
    }
  })

  if (!isClient) {
    // Static version for SSR - no animations
    return <div className={`absolute inset-0 overflow-hidden ${className}`} />
  }

  // Generate wave paths for knowledge flow
  const generateKnowledgeWave = (amplitude: number, frequency: number, phase: number = 0) => {
    const points = 60
    const pathData = Array.from({ length: points }, (_, i) => {
      const x = (i / (points - 1)) * 100
      const y = 50 + Math.sin((i / points) * Math.PI * frequency + phase) * amplitude
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
    return pathData
  }

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Primary Knowledge Wave */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Main flowing wave representing data/knowledge stream */}
        <motion.path
          d={generateKnowledgeWave(8, 3)}
          stroke="url(#knowledgeGradient1)"
          strokeWidth="0.3"
          fill="none"
          strokeLinecap="round"
          opacity={0.6}
          animate={{
            d: [
              generateKnowledgeWave(8, 3, 0),
              generateKnowledgeWave(12, 3, Math.PI * 0.5),
              generateKnowledgeWave(6, 3, Math.PI),
              generateKnowledgeWave(10, 3, Math.PI * 1.5),
              generateKnowledgeWave(8, 3, Math.PI * 2)
            ]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Secondary AI processing wave */}
        <motion.path
          d={generateKnowledgeWave(5, 4, Math.PI * 0.3)}
          stroke="url(#knowledgeGradient2)"
          strokeWidth="0.2"
          fill="none"
          strokeLinecap="round"
          opacity={0.4}
          animate={{
            d: [
              generateKnowledgeWave(5, 4, Math.PI * 0.3),
              generateKnowledgeWave(8, 4, Math.PI * 0.8),
              generateKnowledgeWave(4, 4, Math.PI * 1.3),
              generateKnowledgeWave(7, 4, Math.PI * 1.8),
              generateKnowledgeWave(5, 4, Math.PI * 2.3)
            ]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />

        {/* Tertiary learning wave */}
        <motion.path
          d={generateKnowledgeWave(3, 5, Math.PI * 0.7)}
          stroke="url(#knowledgeGradient3)"
          strokeWidth="0.15"
          fill="none"
          strokeLinecap="round"
          opacity={0.3}
          animate={{
            d: [
              generateKnowledgeWave(3, 5, Math.PI * 0.7),
              generateKnowledgeWave(6, 5, Math.PI * 1.2),
              generateKnowledgeWave(2, 5, Math.PI * 1.7),
              generateKnowledgeWave(5, 5, Math.PI * 2.2),
              generateKnowledgeWave(3, 5, Math.PI * 2.7)
            ]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
        />

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="knowledgeGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="knowledgeGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#EC4899" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="knowledgeGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating Knowledge Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-4 h-4 text-blue-400/30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, (particle.id % 2 === 0 ? 10 : -10), 0], // Deterministic movement
            rotate: [0, 360],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        >
          <particle.Icon className="w-full h-full" />
        </motion.div>
      ))}

      {/* Pulsing Knowledge Nodes */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`node-${i}`}
          className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
          style={{
            left: `${15 + i * 15}%`,
            top: `${30 + (i % 2) * 40}%`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        />
      ))}

      {/* Data Flow Lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {/* Connecting lines between knowledge nodes */}
        <motion.path
          d="M 15 30 Q 50 10 85 30 Q 50 90 15 70"
          stroke="rgba(59, 130, 246, 0.1)"
          strokeWidth="0.1"
          fill="none"
          strokeDasharray="2,2"
          animate={{
            strokeDashoffset: [0, -4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        <motion.path
          d="M 30 70 Q 70 50 85 70 Q 70 30 30 30"
          stroke="rgba(139, 92, 246, 0.1)"
          strokeWidth="0.1"
          fill="none"
          strokeDasharray="3,3"
          animate={{
            strokeDashoffset: [0, -6],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
            delay: 2,
          }}
        />
      </svg>

      {/* AI Processing Indicators */}
      <div className="absolute top-4 right-4 flex space-x-2">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`ai-${i}`}
            className="w-1 h-1 bg-purple-400/40 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Learning Progress Arc */}
      <svg className="absolute bottom-4 left-4 w-16 h-16" viewBox="0 0 32 32">
        <motion.circle
          cx="16"
          cy="16"
          r="12"
          fill="none"
          stroke="rgba(16, 185, 129, 0.2)"
          strokeWidth="0.5"
          strokeDasharray="75.4"
          strokeLinecap="round"
          animate={{
            strokeDashoffset: [75.4, 0, 75.4],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
    </div>
  )
}