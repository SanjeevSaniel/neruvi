/**
 * ThreadToggle - Simple icon toggle for threading view
 * 
 * Features:
 * - Simple Route icon as toggle button
 * - Clean header integration
 * - Tooltip for user guidance
 * - Respects role-based permissions
 */

'use client';

import { useState } from 'react';
import { Route } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { getThreadingPermissions, UserRole } from '@/lib/threading/permissions';

interface ThreadToggleProps {
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
  className?: string;
  variant?: 'sidebar' | 'panel' | 'compact';
}

export default function ThreadToggle({ 
  isVisible = false, 
  onToggle,
  className = '',
  variant = 'compact' 
}: ThreadToggleProps) {
  const { user } = useUser();
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Get user role and permissions
  const userRole = (user?.publicMetadata?.role as UserRole) || 'user';
  const permissions = getThreadingPermissions(userRole);
  
  // Don't render if user doesn't have toggle permission
  if (!permissions.canToggleThreadView) {
    return null;
  }

  const handleToggle = () => {
    const newVisibility = !isVisible;
    onToggle?.(newVisibility);
  };

  const getIconSize = () => {
    switch (variant) {
      case 'compact':
        return 'w-4 h-4';
      case 'sidebar':
      case 'panel':
      default:
        return 'w-5 h-5';
    }
  };
  
  const getTooltipContent = () => {
    if (userRole === 'user') {
      return isVisible 
        ? "Hide threading view"
        : "Show threading view";
    } else {
      return isVisible 
        ? "Hide threading panel"
        : "Show threading panel";
    }
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={handleToggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          p-2 rounded-full transition-all duration-200
          ${isVisible 
            ? 'text-white/90 hover:text-white bg-white/10 hover:bg-white/20' 
            : 'text-white/60 hover:text-white/80 hover:bg-white/10'
          }
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={getTooltipContent()}
      >
        <Route className={getIconSize()} />
      </motion.button>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50"
        >
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
          {getTooltipContent()}
        </motion.div>
      )}
    </div>
  );
}

/**
 * Student-specific thread benefits tooltip
 */
export function StudentThreadBenefits() {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm"
    >
      <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
        <Route className="w-4 h-4 mr-2" />
        Threading Benefits for Students
      </h4>
      <ul className="text-blue-700 space-y-1 text-xs">
        <li>• See how conversations branch and evolve</li>
        <li>• Track different solution approaches</li>
        <li>• Understand decision-making patterns</li>
        <li>• Learn from alternative explanations</li>
      </ul>
    </motion.div>
  );
}