'use client';

import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ChevronRight, Code2 } from 'lucide-react';
import { useState } from 'react';
import { SiNodedotjs, SiPython } from 'react-icons/si';

export type CourseType = 'nodejs' | 'python';

const courseOptions = [
  {
    id: 'nodejs' as CourseType,
    name: 'Node.js',
    description: 'Backend development, Express.js, APIs, async programming',
    icon: SiNodedotjs,
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    selectedColor: 'border-green-500 bg-green-100',
    textColor: '#459071',
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
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    selectedColor: 'border-blue-500 bg-blue-100',
    textColor: '#459071',
    topics: [
      'Functions',
      'Classes',
      'Data Types',
      'Django/Flask',
      'NumPy',
      'Machine Learning',
    ],
  },
];

export default function SimpleCourseSelector() {
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState<CourseType | null>(null);
  const [hoveredCourse, setHoveredCourse] = useState<CourseType | null>(null);

  const handleCourseSelect = (courseId: CourseType) => {
    setSelectedCourse(courseId);
  };

  const handleStartLearning = () => {
    if (selectedCourse) {
      router.push(`/suggestions/${selectedCourse}`);
    }
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

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
      <motion.div
        variants={containerVariants}
        initial='hidden'
        animate='visible'
        className='px-6 py-8 min-h-screen flex flex-col justify-center'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='text-center mb-8'>
          <div className='flex items-center justify-center mb-4'>
            <div className='p-3 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 shadow-lg'>
              <Code2 className='w-8 h-8 text-white' />
            </div>
          </div>
          <h1 className='text-3xl font-bold mb-3 text-gray-800'>
            Choose Your Learning Path
          </h1>
          <p className='max-w-lg mx-auto text-gray-600 text-lg'>
            Select a programming course to start your interactive learning
            journey
          </p>
        </motion.div>

        {/* Course Options Grid */}
        <motion.div
          className='grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8'
          variants={containerVariants}>
          {courseOptions.map((course) => {
            const isSelected = selectedCourse === course.id;
            const isHovered = hoveredCourse === course.id;

            return (
              <motion.div
                key={course.id}
                onMouseEnter={() => setHoveredCourse(course.id)}
                onMouseLeave={() => setHoveredCourse(null)}
                onClick={() => handleCourseSelect(course.id)}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative p-8 rounded-3xl cursor-pointer
                  bg-white backdrop-blur-sm
                  ${
                    isSelected
                      ? `border-2 ${
                          course.selectedColor.split(' ')[0]
                        } shadow-xl ring-4 ${course.selectedColor
                          .split(' ')[0]
                          .replace('border', 'ring')}/20`
                      : 'border-2 border-slate-200 hover:border-slate-300'
                  }
                  shadow-lg transition-all duration-300 ease-out
                `}>
                {/* Gradient overlay for selected state */}
                {isSelected && (
                  <div
                    className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${course.gradient} opacity-5`}
                  />
                )}

                {/* Selection indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className='absolute -top-3 -right-3 p-2 bg-white rounded-full shadow-lg'>
                      <CheckCircle className='w-8 h-8 text-green-500' />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Course content */}
                <div className='relative z-10'>
                  {/* Icon and title */}
                  <div className='flex items-center space-x-4 mb-4'>
                    <div
                      className={`
                        p-4 rounded-2xl bg-gradient-to-r ${course.gradient}
                        shadow-lg transform transition-transform duration-200
                        ${isHovered ? 'scale-110 rotate-3' : ''}
                      `}>
                      <course.icon className='w-10 h-10 text-white' />
                    </div>
                    <div>
                      <h3 className='text-2xl font-bold text-gray-800'>
                        {course.name}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className='text-gray-600 mb-6 text-lg leading-relaxed'>
                    {course.description}
                  </p>

                  {/* Topics */}
                  <div className='space-y-3'>
                    <h4 className='text-sm font-semibold text-gray-500 uppercase tracking-wider'>
                      What you&#39;ll learn
                    </h4>
                    <div className='grid grid-cols-2 gap-2'>
                      {course.topics.map((topic) => (
                        <div
                          key={topic}
                          className='flex items-center space-x-2 text-gray-700'>
                          <div className='w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500'></div>
                          <span className='text-sm font-medium'>{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Start Button */}
        <AnimatePresence>
          {selectedCourse && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className='text-center'>
              <motion.button
                onClick={handleStartLearning}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 10px 25px rgba(139, 92, 246, 0.2)',
                }}
                whileTap={{ scale: 0.95 }}
                className='px-12 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-3 mx-auto'>
                <span>
                  Start Learning{' '}
                  {selectedCourse === 'nodejs' ? 'Node.js' : 'Python'}
                </span>
                <ChevronRight className='w-6 h-6' />
              </motion.button>
              <p className='mt-3 text-gray-500 text-sm'>
                Click to see learning suggestions and start your journey
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
