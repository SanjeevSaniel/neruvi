'use client';

import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ChevronRight, Code2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { SiNodedotjs, SiPython } from 'react-icons/si';
import { getCourseColors } from '@/lib/courseColors';
import '../../styles/scrollbar.css';

export type CourseType = 'nodejs' | 'python';

// Base course data without colors (colors are generated dynamically)
const baseCourseData = [
  {
    id: 'nodejs' as CourseType,
    name: 'Node.js',
    description: 'Backend development, Express.js, APIs, async programming',
    icon: SiNodedotjs,
    iconColor: '#339933',
    topics: [
      'Express.js',
      'REST APIs',
      'Async/Await',
      'Middleware',
      'MongoDB',
      'Authentication',
    ],
  },
  {
    id: 'python' as CourseType,
    name: 'Python',
    description: 'Data structures, OOP, web frameworks, data science',
    icon: SiPython,
    iconColor: '#3776ab',
    topics: [
      'Functions',
      'Classes',
      'Data Types',
      'Django/Flask',
      'NumPy',
      'Machine Learning',
    ],
  },
  // Add more courses here - they will automatically get unique colors
];

// Generate course options with dynamic colors
const courseOptions = baseCourseData.map((course) => ({
  ...course,
  ...getCourseColors(course.id),
}));

const getSuggestionsForCourse = (courseId: CourseType) => {
  const suggestions = {
    nodejs: [
      {
        icon: '🚀',
        text: 'Express.js best practices',
        category: 'Framework',
      },
      { icon: '🔒', text: 'JWT authentication setup', category: 'Security' },
      { icon: '📡', text: 'Building REST APIs', category: 'API Design' },
      {
        icon: '🔄',
        text: 'Async/await patterns',
        category: 'Async Programming',
      },
      {
        icon: '📦',
        text: 'NPM package management',
        category: 'Dependencies',
      },
    ],
    python: [
      {
        icon: '🐍',
        text: 'Object-oriented programming',
        category: 'OOP Concepts',
      },
      {
        icon: '📊',
        text: 'Data structures & algorithms',
        category: 'Fundamentals',
      },
      {
        icon: '🌐',
        text: 'Django/Flask web frameworks',
        category: 'Web Development',
      },
      {
        icon: '📈',
        text: 'NumPy and pandas basics',
        category: 'Data Science',
      },
      { icon: '🤖', text: 'Machine learning intro', category: 'AI/ML' },
    ],
  };

  return suggestions[courseId];
};

export default function CourseSelectorPage() {
  const router = useRouter();
  const [hoveredCourse, setHoveredCourse] = useState<CourseType | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseType | null>(null);

  const handleCourseSelect = (courseId: CourseType) => {
    setSelectedCourse(courseId);
  };

  const handleSuggestionClick = (suggestion: string, courseId: CourseType) => {
    // Generate optimized conversation ID for suggestion navigation
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    const conversationId = `${courseId}-${timestamp}-${randomPart}`;

    console.log('🚀 Suggestion clicked - Generated conversation ID:', conversationId);

    // Navigate to the new URL structure with conversation ID and suggestion
    router.push(`/${courseId}/${conversationId}?suggestion=${encodeURIComponent(suggestion)}`);
  };

  const handleCourseNavigation = (courseId: CourseType) => {
    // Generate optimized conversation ID for immediate navigation
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    const conversationId = `${courseId}-${timestamp}-${randomPart}`;

    console.log('🚀 Start Learning clicked - Generated conversation ID:', conversationId);

    // Navigate directly to the new URL structure with conversation ID
    router.push(`/${courseId}/${conversationId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        staggerChildren: 0.05,
      },
    },
  };

  const topicVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
      },
    }),
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50'>
      <motion.div
        variants={containerVariants}
        initial='hidden'
        animate='visible'
        className='h-full w-full overflow-y-auto course-scroll-container'>
        <div
          className='px-6 py-8 min-h-full flex flex-col justify-center'
          style={{ minHeight: 'calc(100vh - 64px)' }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='text-center mb-6'>
            <div className='flex items-center justify-center mb-3'>
              <div className='p-2 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 shadow-lg'>
                <Code2 className='w-6 h-6 text-white' />
              </div>
            </div>
            <h2 className='text-2xl font-bold mb-2 text-gray-800'>
              Choose Your Learning Path
            </h2>
            <p className='max-w-md mx-auto text-gray-600'>
              Select which course content you&apos;d like me to help you with
              today
            </p>
          </motion.div>

          {/* Course Options Grid */}
          <motion.div
            className='grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-6'
            variants={containerVariants}>
            {courseOptions.map((course) => {
              const isSelected = selectedCourse === course.id;
              const isHovered = hoveredCourse === course.id;

              return (
                <div
                  key={course.id}
                  onMouseEnter={() => setHoveredCourse(course.id)}
                  onMouseLeave={() => setHoveredCourse(null)}
                  onClick={() => handleCourseSelect(course.id)}
                  className={`
                    relative p-6 rounded-2xl cursor-pointer
                    ${course.bgColor} backdrop-blur-sm
                    ${
                      isSelected
                        ? `border-2 ${
                            course.selectedColor.split(' ')[0]
                          } shadow-lg ring-2 ${course.selectedColor
                            .split(' ')[0]
                            .replace('border', 'ring')}/20`
                        : `border-2 ${course.borderColor} ${course.hoverColor}`
                    }
                    shadow-lg transition-all duration-200 ease-out hover:shadow-xl
                  `}>
                  {/* Modern gradient overlay for selected state */}
                  {isSelected && (
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${course.gradient} opacity-5 pointer-events-none`}
                    />
                  )}

                  {/* Subtle hover highlight */}
                  <AnimatePresence>
                    {isHovered && !isSelected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${course.gradient} opacity-5 pointer-events-none`}
                      />
                    )}
                  </AnimatePresence>

                  {/* Selection indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className='absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-lg'>
                        <CheckCircle className='w-6 h-6 text-green-500' />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Course icon and gradient */}
                  <div className='relative z-20 flex items-start justify-between mb-4'>
                    <div className='flex items-center space-x-3'>
                      <div
                        className={`
                        p-3 rounded-xl bg-gradient-to-r ${course.gradient}
                        shadow-lg transform transition-transform duration-200
                        ${isHovered ? 'scale-105' : ''}
                      `}>
                        <course.icon
                          className='w-7 h-7 text-white'
                          style={{ color: 'white' }}
                        />
                      </div>
                      <div>
                        <h3
                          className='text-lg font-bold relative z-10'
                          style={{ color: course.textColor }}>
                          {course.name}
                        </h3>
                      </div>
                    </div>
                    <ChevronRight
                      className={`
                      w-5 h-5 transition-all duration-200 relative z-10
                      ${isHovered ? 'translate-x-0.5' : ''}
                    `}
                      style={{
                        color: isSelected ? course.textColor : '#94a3b8',
                      }}
                    />
                  </div>

                  {/* Description */}
                  <p className='text-sm mb-4 opacity-80 relative z-20 text-gray-600'>
                    {course.description}
                  </p>

                  {/* Topics */}
                  <div className='relative z-20 space-y-2'>
                    <h4
                      className='text-xs font-semibold uppercase tracking-wider opacity-60'
                      style={{ color: course.textColor }}>
                      Key Topics
                    </h4>
                    <div className='flex flex-wrap gap-1'>
                      <AnimatePresence>
                        {course.topics.map((topic, topicIndex) => (
                          <motion.span
                            key={topic}
                            custom={topicIndex}
                            variants={topicVariants}
                            initial='hidden'
                            animate='visible'
                            className={`
                              text-xs px-2 py-1 rounded-full relative z-10
                              ${
                                isSelected ? 'bg-white/50' : 'bg-white/80'
                              } font-medium transition-colors duration-200`}
                            style={{ color: course.textColor }}>
                            {topic}
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Course-Specific Suggestions */}
          <AnimatePresence>
            {selectedCourse && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ delay: 0.2, duration: 0.25, ease: 'easeOut' }}
                className='max-w-5xl mx-auto'>
                {/* Section Header */}
                <div className='text-center mb-6'>
                  <div className='flex items-center justify-center space-x-2 text-slate-700 mb-3'>
                    <Sparkles className='w-5 h-5 text-purple-500' />
                    <h3 className='text-xl font-bold'>
                      Popular{' '}
                      {selectedCourse === 'nodejs' ? 'Node.js' : 'Python'}{' '}
                      Topics
                    </h3>
                    <Sparkles className='w-5 h-5 text-purple-500' />
                  </div>
                  <p className='text-slate-500 text-sm mb-4'>
                    Click any topic to get started, or navigate to start your
                    own conversation
                  </p>
                  <button
                    onClick={() => handleCourseNavigation(selectedCourse)}
                    className='px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105'>
                    Start Learning{' '}
                    {selectedCourse === 'nodejs' ? 'Node.js' : 'Python'}
                  </button>
                </div>

                {/* Suggestions Grid */}
                <div className='grid md:grid-cols-5 gap-3 mb-6'>
                  {getSuggestionsForCourse(selectedCourse).map(
                    (suggestion, index) => {
                      const selectedCourseOption = courseOptions.find(
                        (c) => c.id === selectedCourse,
                      );

                      return (
                        <motion.button
                          key={suggestion.text}
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            delay: 0.3 + index * 0.05,
                            duration: 0.15,
                          }}
                          whileHover={{
                            scale: 1.02,
                            y: -2,
                            transition: { duration: 0.1 },
                          }}
                          whileTap={{
                            scale: 0.98,
                            transition: { duration: 0.05 },
                          }}
                          onClick={() => {
                            handleSuggestionClick(
                              suggestion.text,
                              selectedCourse,
                            );
                          }}
                          title={`Click to start chatting about: ${suggestion.text}`}
                          className={`
                          group relative p-4 rounded-xl border-2 cursor-pointer
                          ${selectedCourseOption?.borderColor} ${
                            selectedCourseOption?.bgColor
                          }
                          hover:${selectedCourseOption?.borderColor
                            .replace('border-', 'border-')
                            .replace('200', '300')} 
                          hover:shadow-md transition-all duration-200
                          text-left overflow-hidden
                        `}>
                          {/* Gradient overlay on hover */}
                          <div
                            className={`
                          absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 
                          bg-gradient-to-br ${selectedCourseOption?.gradient} 
                          transition-opacity duration-200 pointer-events-none
                        `}
                          />

                          {/* Content */}
                          <div className='relative z-10'>
                            <div className='flex items-center space-x-2 mb-2'>
                              <span className='text-lg'>{suggestion.icon}</span>
                              <span
                                className='text-xs font-semibold uppercase tracking-wider opacity-60'
                                style={{
                                  color: selectedCourseOption?.textColor,
                                }}>
                                {suggestion.category}
                              </span>
                            </div>
                            <p className='text-sm font-medium leading-relaxed text-gray-800'>
                              {suggestion.text}
                            </p>
                          </div>

                          {/* Hover indicator */}
                          <div
                            className={`
                          absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 
                          transition-opacity duration-200
                        `}>
                            <ChevronRight
                              className='w-4 h-4'
                              style={{
                                color: selectedCourseOption?.textColor,
                              }}
                            />
                          </div>
                        </motion.button>
                      );
                    },
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
