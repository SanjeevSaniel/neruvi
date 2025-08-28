/**
 * ThreadToggle - Student-friendly toggle for threading view
 * 
 * Features:
 * - Hidden toggle in sidebar/panel for students
 * - Simple on/off switch for thread visualization
 * - Educational tooltips about threading benefits
 * - Respects role-based permissions
 */

'use client';

import { useState } from 'react';
import { MessageSquarePlus, Eye, EyeOff } from 'lucide-react';
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
  variant = 'sidebar' 
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

  const getVariantStyles = () => {
    switch (variant) {
      case 'sidebar':
        return {
          container: 'flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors',
          button: 'p-2 rounded-lg transition-all duration-200',
          text: 'text-sm font-medium text-gray-700',
          icon: 'w-4 h-4',
        };
      case 'panel':
        return {
          container: 'flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm',
          button: 'p-2 rounded-lg transition-all duration-200',
          text: 'text-sm font-medium text-gray-700',
          icon: 'w-4 h-4',
        };
      case 'compact':
        return {
          container: 'flex items-center gap-2',
          button: 'p-1.5 rounded-md transition-all duration-200',
          text: 'text-xs font-medium text-gray-600',
          icon: 'w-3.5 h-3.5',
        };
      default:
        return {
          container: 'flex items-center gap-2',
          button: 'p-2 rounded-lg transition-all duration-200',
          text: 'text-sm font-medium text-gray-700',
          icon: 'w-4 h-4',
        };
    }
  };

  const styles = getVariantStyles();
  
  const getTooltipContent = () => {
    if (userRole === 'user') {
      return isVisible 
        ? "Hide conversation threads - return to simple chat view"
        : "Show threading features - visualize conversation flow";
    } else {
      return isVisible 
        ? "Hide threading panel"
        : "Show threading management";
    }
  };

  const getButtonColor = () => {
    if (isVisible) {
      return userRole === 'user' 
        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
        : 'bg-green-100 text-green-600 hover:bg-green-200';
    } else {
      return 'bg-gray-100 text-gray-500 hover:bg-gray-200';
    }
  };

  const getLabel = () => {
    switch (userRole) {
      case 'user':
        return 'Thread View';
      case 'moderator':
        return 'Thread Management';
      case 'admin':
        return 'Threading Controls';
      default:
        return 'Threads';
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className="flex items-center gap-2">
        <MessageSquarePlus className={`${styles.icon} text-gray-400`} />
        <span className={styles.text}>
          {getLabel()}
        </span>
      </div>
      
      <div className="relative">
        <motion.button
          onClick={handleToggle}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`${styles.button} ${getButtonColor()}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={getTooltipContent()}
        >
          {isVisible ? (
            <Eye className={styles.icon} />
          ) : (
            <EyeOff className={styles.icon} />
          )}
        </motion.button>

        {/* Educational tooltip for students */}
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full right-0 mb-2 p-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 max-w-xs"
          >
            {getTooltipContent()}
            <div className="absolute top-full right-4 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/**
 * Student-specific thread benefits tooltip
 */
export function StudentThreadBenefits() {
  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
      <h4 className="font-semibold text-blue-800 mb-2">💡 Thread View Benefits:</h4>
      <ul className="text-blue-700 space-y-1 text-xs">
        <li>• See how your conversation flows and develops</li>
        <li>• Navigate between different topics easily</li>
        <li>• Track your learning progress visually</li>
        <li>• Return to earlier discussion points</li>
      </ul>
    </div>
  );
}