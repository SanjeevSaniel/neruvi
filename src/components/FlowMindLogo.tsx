// components/ui/FlowMindLogo.tsx
import { motion } from 'framer-motion';
import Image from 'next/image';

interface FlowMindLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

const FlowMindLogo = ({ size = 50, className = '', animated = true }: FlowMindLogoProps) => {
  return (
    <div className="relative">
      {/* Enhanced background glow */}
      {animated && (
        <motion.div 
          className="absolute inset-0 rounded-2xl blur-md opacity-60"
          style={{
            background: 'linear-gradient(135deg, #4ea674, #459071, #5fad81)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      <motion.div 
        className={`relative w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl ${className}`}
        style={{
          background: 'linear-gradient(135deg, #f0f9f4, #dcfce7, #bbf7d0)',
          border: '2px solid rgba(69, 144, 113, 0.2)',
          boxShadow: '0 8px 32px rgba(69, 144, 113, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        }}
        animate={animated ? {
          scale: [1, 1.08, 1],
          rotateY: [0, 5, 0],
          boxShadow: [
            '0 8px 32px rgba(69, 144, 113, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            '0 12px 40px rgba(78, 166, 116, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            '0 8px 32px rgba(69, 144, 113, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
          ]
        } : {}}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        whileHover={{
          scale: 1.1,
          rotateY: 10,
          boxShadow: '0 15px 45px rgba(78, 166, 116, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        }}
      >
        <Image
          src='/flowmind-logo.svg'
          alt='FlowMind Logo'
          width={size}
          height={size}
          className='drop-shadow-lg relative z-10'
          style={{ filter: 'drop-shadow(0 2px 4px rgba(69, 144, 113, 0.2))' }}
        />
        
        {/* Inner glow effect */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-30"
          style={{
            background: 'radial-gradient(circle at center, rgba(78, 166, 116, 0.3) 0%, transparent 70%)',
          }}
        />
      </motion.div>
      
      {/* Enhanced thinking particles with green theme */}
      {animated && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: i === 0 ? '#4ea674' : i === 1 ? '#459071' : '#5fad81',
                top: i === 0 ? '15%' : i === 1 ? '25%' : '20%',
                right: i === 0 ? '8%' : i === 1 ? '18%' : '13%',
                boxShadow: `0 0 8px rgba(${i === 0 ? '78, 166, 116' : i === 1 ? '69, 144, 113' : '95, 173, 129'}, 0.6)`,
              }}
              animate={{
                scale: [0, 1.2, 0],
                opacity: [0, 0.8, 0],
                y: [0, -12, -24],
                x: [0, (i - 1) * 2, (i - 1) * 4]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.6 + 1.5,
                ease: "easeOut"
              }}
            />
          ))}
          
          {/* Subtle sparkle effects */}
          {[...Array(2)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute w-0.5 h-0.5 rounded-full"
              style={{
                background: '#5fad81',
                top: i === 0 ? '30%' : '70%',
                left: i === 0 ? '20%' : '75%',
                boxShadow: '0 0 4px rgba(95, 173, 129, 0.8)',
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 1.2 + 2,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FlowMindLogo;
