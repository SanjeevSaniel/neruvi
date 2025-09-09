// components/chat/SourcePanel.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { SiNodedotjs, SiPython } from 'react-icons/si';
import { SourceTimestamp } from './types';

interface SourcePanelProps {
  sources: SourceTimestamp[];
}

export default function SourcePanel({ sources }: SourcePanelProps) {
  console.log('🔍 SourcePanel - Received sources:', {
    sources,
    sourcesLength: sources?.length || 0,
    sourcesData: sources?.map(s => ({
      course: s.course,
      section: s.section,
      timestamp: s.timestamp,
      relevance: s.relevance,
      videoId: s.videoId
    }))
  });

  // Filter sources to show the most relevant single reference
  // Sources from API are already sorted by score (highest first)
  const filteredSources = sources
    .filter(source => {
      // Show sources with relevance percentage >= 35% or sources without percentage
      const relevanceMatch = source.relevance.match(/(\d+)%?/);
      if (relevanceMatch) {
        const percentage = parseInt(relevanceMatch[1]);
        return percentage >= 35; // Consistent threshold for quality sources
      }
      // Keep sources without percentage (assume they're relevant)
      return true;
    })
    .sort((a, b) => {
      // Sort by relevance score, highest first, with tie-breakers for deterministic results
      const aMatch = a.relevance.match(/(\d+)%?/);
      const bMatch = b.relevance.match(/(\d+)%?/);
      const aScore = aMatch ? parseInt(aMatch[1]) : 100; // Default high score for non-percentage
      const bScore = bMatch ? parseInt(bMatch[1]) : 100; // Default high score for non-percentage
      
      if (bScore !== aScore) {
        return bScore - aScore; // Higher score first
      }
      
      // If scores are equal, prefer earlier timestamps (more foundational content)
      const aTime = a.timestamp.split(':').map(Number);
      const bTime = b.timestamp.split(':').map(Number);
      const aSeconds = (aTime[0] || 0) * 60 + (aTime[1] || 0);
      const bSeconds = (bTime[0] || 0) * 60 + (bTime[1] || 0);
      return aSeconds - bSeconds;
    })
    .slice(0, 1); // Take only the single best match

  console.log('🔍 SourcePanel - After filtering:', {
    filteredSources,
    filteredLength: filteredSources.length,
    shouldRender: filteredSources.length > 0
  });

  // If no high-quality sources, don't render the panel
  if (filteredSources.length === 0) {
    console.log('⚠️ SourcePanel - No sources to display, returning null');
    return null;
  }

  // Get dynamic title based on filtered source count - now always singular since we show max 1
  const getSourceTitle = (count: number): string => {
    return 'Source Reference:';
  };

  // Group filtered sources by course first, then sort by timestamp within each course
  const groupedSources = filteredSources.reduce((acc, source) => {
    const courseKey = source.course.toLowerCase();
    if (!acc[courseKey]) {
      acc[courseKey] = [];
    }
    acc[courseKey].push(source);
    return acc;
  }, {} as Record<string, SourceTimestamp[]>);

  // Sort sources within each course by timestamp
  Object.keys(groupedSources).forEach((courseKey) => {
    groupedSources[courseKey].sort((a, b) => {
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
  });

  // Check if we have sources from multiple courses
  const hasMultipleCourses = Object.keys(groupedSources).length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.15 }}
      className='mt-2 bg-slate-100 border border-slate-300 rounded-lg p-3'>
      <div className='flex items-center space-x-2 mb-2'>
        <Clock className='w-4 h-4' style={{color: '#459071'}} />
        <span className='text-sm font-medium' style={{color: '#459071'}}>
          {getSourceTitle(filteredSources.length)}
        </span>
      </div>

      <div className='space-y-3'>
        {Object.entries(groupedSources).map(([courseKey, courseSources]) => (
          <div
            key={courseKey}
            className='space-y-2'>
            {hasMultipleCourses && (
              <CourseHeader
                course={courseKey}
                count={courseSources.length}
              />
            )}
            <div className='space-y-1'>
              {courseSources.map((source, idx) => (
                <SourceItem
                  key={`${source.course}-${source.timestamp}-${idx}`}
                  source={source}
                  showCourse={!hasMultipleCourses}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

const CourseHeader = ({ course, count }: { course: string; count: number }) => {
  const getCourseInfo = (courseKey: string) => {
    switch (courseKey.toLowerCase()) {
      case 'nodejs':
      case 'node.js':
        return {
          name: 'Node.js',
          icon: SiNodedotjs,
          color: '#4ea674',
          bg: 'bg-green-50',
          border: 'border-green-200',
        };
      case 'python':
        return {
          name: 'Python',
          icon: SiPython,
          color: '#459071',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
        };
      default:
        return {
          name: courseKey.charAt(0).toUpperCase() + courseKey.slice(1),
          icon: Clock,
          color: '#459071',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
        };
    }
  };

  const courseInfo = getCourseInfo(course);
  const Icon = courseInfo.icon;

  return (
    <div
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${courseInfo.bg} ${courseInfo.border} border`}>
      <Icon className={`w-4 h-4`} style={{color: courseInfo.color}} />
      <span className={`text-sm font-semibold`} style={{color: courseInfo.color}}>
        {courseInfo.name}
      </span>
      <span className='text-xs' style={{color: '#6b7280'}}>
        ({count} reference{count !== 1 ? 's' : ''})
      </span>
    </div>
  );
};

const SourceItem = ({
  source,
  showCourse = false,
}: {
  source: SourceTimestamp;
  showCourse?: boolean;
}) => {
  console.log('🔍 SourceItem rendering:', {
    course: source.course,
    section: source.section,
    timestamp: source.timestamp,
    relevance: source.relevance,
    videoId: source.videoId,
    showCourse
  });

  // Check if relevance is a reason text or percentage
  const isPercentage = /^\d+\.?\d*$/.test(source.relevance);

  // Removed relevance text labels for cleaner display

  const getRelevanceColor = (relevance: string): string => {
    if (!isPercentage) return '#459071';
    const percentage = parseFloat(relevance);
    if (percentage >= 80) return '#4ea674';
    if (percentage >= 60) return '#459071';
    if (percentage >= 40) return '#5fad81';
    if (percentage >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRelevanceDot = (relevance: string): string => {
    if (!isPercentage) return 'bg-slate-400';
    const percentage = parseFloat(relevance);
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleTimestampClick = () => {
    // Create a placeholder URL for the video with timestamp
    const videoUrl = `https://example.com/video/${
      source.videoId
    }?t=${source.timestamp.replace(':', 'm')}s`;
    console.log(`Would navigate to: ${videoUrl}`);
  };

  const getCourseIcon = (course: string) => {
    switch (course.toLowerCase()) {
      case 'nodejs':
      case 'node.js':
        return { icon: SiNodedotjs, color: '#4ea674' };
      case 'python':
        return { icon: SiPython, color: '#459071' };
      default:
        return { icon: Clock, color: '#459071' };
    }
  };

  const courseIcon = getCourseIcon(source.course);

  return (
    <motion.div
      className='flex items-center justify-between text-xs bg-white rounded-md px-2 py-1 hover:bg-slate-50 transition-colors border border-slate-200'
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}>
      <div className='flex items-center space-x-2'>
        {showCourse && (
          <>
            {React.createElement(courseIcon.icon, {
              className: `w-3 h-3`,
              style: { color: courseIcon.color },
            })}
            <span style={{color: '#90c9a8'}}>•</span>
          </>
        )}
        <span className='font-medium' style={{color: '#1f2937'}}>{source.section}</span>
        <span className='text-slate-400'>•</span>
        <button
          onClick={handleTimestampClick}
          className='font-mono px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer hover:shadow-md border font-semibold'
          style={{
            color: '#2d6b3d', 
            backgroundColor: '#e8f5e8',
            borderColor: '#4ea674'
          }}
          title={`Jump to ${source.timestamp} in ${source.course}`}>
          <Clock className='w-3 h-3 inline mr-1' />
          {source.timestamp}
        </button>
      </div>
      <div className='flex items-center'>
        <div
          className={`w-2 h-2 rounded-full ${getRelevanceDot(
            source.relevance,
          )}`}
        />
      </div>
    </motion.div>
  );
};
