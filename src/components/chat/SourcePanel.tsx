// components/chat/SourcePanel.tsx
import { motion } from 'framer-motion';
import { Clock, ExternalLink } from 'lucide-react';
import { SourceTimestamp } from './types';

interface SourcePanelProps {
  sources: SourceTimestamp[];
}

export default function SourcePanel({ sources }: SourcePanelProps) {
  // Sort sources by timestamp chronologically
  const sortedSources = [...sources].sort((a, b) => {
    // Convert timestamp (MM:SS) to seconds for comparison
    const timeToSeconds = (timestamp: string) => {
      const parts = timestamp.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        return minutes * 60 + seconds;
      }
      return 0;
    };
    
    return timeToSeconds(a.timestamp) - timeToSeconds(b.timestamp);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className='mt-2 bg-slate-100 border border-slate-300 rounded-lg p-3'>
      <div className='flex items-center space-x-2 mb-2'>
        <Clock className='w-4 h-4 text-slate-600' />
        <span className='text-sm font-medium text-slate-800'>
          Exact reference:
        </span>
      </div>

      <div className='space-y-2'>
        {sortedSources.map((source, idx) => (
          <SourceItem
            key={`${source.course}-${source.timestamp}-${idx}`}
            source={source}
          />
        ))}
      </div>
    </motion.div>
  );
}

const SourceItem = ({ source }: { source: SourceTimestamp }) => {
  // Check if relevance is a reason text or percentage
  const isPercentage = /^\d+\.?\d*$/.test(source.relevance);

  const getDynamicRelevanceMessage = (score: number): string => {
    if (score >= 85) return 'Exact match';
    if (score >= 75) return 'Highly relevant';
    if (score >= 60) return 'Good match';
    if (score >= 45) return 'Related content';
    if (score >= 30) return 'Supplementary';
    return 'Background info';
  };
  
  const getRelevanceColor = (relevance: string): string => {
    if (!isPercentage) return 'text-blue-600'; // Default color for text reasons
    const percentage = parseFloat(relevance);
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    if (percentage >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRelevanceDot = (relevance: string): string => {
    if (!isPercentage) return 'bg-blue-500'; // Default dot for text reasons
    const percentage = parseFloat(relevance);
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleTimestampClick = () => {
    // Create a placeholder URL for the video with timestamp
    const videoUrl = `https://example.com/video/${source.videoId}?t=${source.timestamp.replace(':', 'm')}s`;
    console.log(`Would navigate to: ${videoUrl}`);
  };

  return (
    <motion.div 
      className="flex items-center justify-between text-xs bg-white rounded-md px-2 py-1 hover:bg-slate-50 transition-colors border border-slate-200"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className='flex items-center space-x-2'>
        <span className='text-slate-700 font-medium'>{source.section}</span>
        <span className='text-slate-400'>•</span>
        <button
          onClick={handleTimestampClick}
          className='font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded hover:bg-blue-200 hover:text-blue-700 transition-colors cursor-pointer'
          title={`Jump to ${source.timestamp}`}
        >
          <Clock className='w-3 h-3 inline mr-1' />
          {source.timestamp}
        </button>
      </div>
      <div className='flex items-center space-x-2'>
        <span className={`font-medium text-xs ${getRelevanceColor(source.relevance)}`}>
          {isPercentage ? getDynamicRelevanceMessage(parseFloat(source.relevance)) : source.relevance}
        </span>
        <div className='flex items-center space-x-1'>
          <div className={`w-2 h-2 rounded-full ${getRelevanceDot(source.relevance)}`} />
        </div>
      </div>
    </motion.div>
  );
};
