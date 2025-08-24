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
    <motion.div 
      className={`w-10 h-10 bg-gradient-to-br from-white via-violet-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-lg ${className}`}
      animate={animated ? {
        scale: [1, 1.05, 1],
        boxShadow: [
          '0 10px 20px rgba(0, 0, 0, 0.1)',
          '0 15px 30px rgba(139, 92, 246, 0.2)',
          '0 10px 20px rgba(0, 0, 0, 0.1)'
        ]
      } : {}}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Image
        src='/flowmind-logo-2.png'
        alt='FlowMind Logo'
        width={size}
        height={size}
        className='drop-shadow-sm'
      />
      
      {/* Subtle thinking particles around the logo */}
      {animated && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(2)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full"
              style={{
                top: '20%',
                right: i === 0 ? '10%' : '15%',
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 0.6, 0],
                y: [0, -8, -16]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.8 + 1
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default FlowMindLogo;
