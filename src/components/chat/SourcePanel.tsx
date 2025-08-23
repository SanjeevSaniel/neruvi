// components/chat/SourcePanel.tsx
import { motion } from 'framer-motion';
import { Clock, ExternalLink } from 'lucide-react';
import { SourceTimestamp } from './types';

interface SourcePanelProps {
  sources: SourceTimestamp[];
}

export default function SourcePanel({ sources }: SourcePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className='mt-2 bg-slate-100 border border-slate-300 rounded-lg p-3'>
      <div className='flex items-center space-x-2 mb-2'>
        <Clock className='w-4 h-4 text-slate-600' />
        <span className='text-sm font-medium text-slate-800'>
          Course material references:
        </span>
      </div>

      <div className='space-y-2'>
        {sources.map((source, idx) => (
          <SourceItem
            key={idx}
            source={source}
          />
        ))}
      </div>
    </motion.div>
  );
}

const SourceItem = ({ source }: { source: SourceTimestamp }) => {
  // Convert relevance percentage to meaningful description
  const getRelevanceDescription = (relevance: string): string => {
    const percentage = parseFloat(relevance);
    if (percentage >= 80) return 'Highly relevant';
    if (percentage >= 60) return 'Very relevant';
    if (percentage >= 40) return 'Moderately relevant';
    if (percentage >= 20) return 'Somewhat relevant';
    return 'Low relevance';
  };

  const getRelevanceColor = (relevance: string): string => {
    const percentage = parseFloat(relevance);
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    if (percentage >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className='flex items-center justify-between text-xs bg-white rounded-md px-2 py-1'>
      <div className='flex items-center space-x-2'>
        <span className='font-medium text-purple-700'>
          {source.course.toUpperCase()}
        </span>
        <span className='text-slate-400'>•</span>
        <span className='text-slate-700'>{source.section}</span>
        <span className='text-slate-400'>•</span>
        <span className='font-mono text-blue-600 bg-blue-100 px-1 rounded'>
          {source.timestamp}
        </span>
      </div>
      <div className='flex items-center space-x-2'>
        <span className={`font-medium ${getRelevanceColor(source.relevance)}`}>
          {getRelevanceDescription(source.relevance)}
        </span>
        <ExternalLink className='w-3 h-3 text-slate-500 hover:text-slate-700 cursor-pointer' />
      </div>
    </div>
  );
};
