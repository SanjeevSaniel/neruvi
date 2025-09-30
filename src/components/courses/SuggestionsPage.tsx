'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { CourseType } from './CourseSelectorPage';
import { SiNodedotjs, SiPython } from 'react-icons/si';
import { getCourseColors } from '@/lib/courseColors';
import { useConversationStore } from '@/store/conversationStore';

interface SuggestionsPageProps {
  courseId: CourseType;
}

// Base course data without colors (colors are generated dynamically)
const baseCourseOptions = {
  nodejs: {
    name: 'Node.js',
    icon: SiNodedotjs,
  },
  python: {
    name: 'Python',
    icon: SiPython,
  },
  // Add more courses here - they will automatically get unique colors
};

// Generate course options with dynamic colors from utility
const getCourseOptions = (courseId: CourseType) => ({
  ...baseCourseOptions[courseId],
  ...getCourseColors(courseId),
});

const getSuggestionsForCourse = (courseId: CourseType) => {
  const suggestions = {
    nodejs: [
      { icon: '🚀', text: 'Express.js best practices', category: 'Framework' },
      { icon: '🔒', text: 'JWT authentication setup', category: 'Security' },
      { icon: '📡', text: 'Building REST APIs', category: 'API Design' },
      {
        icon: '🔄',
        text: 'Async/await patterns',
        category: 'Async Programming',
      },
      { icon: '📦', text: 'NPM package management', category: 'Dependencies' },
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
      { icon: '📈', text: 'NumPy and pandas basics', category: 'Data Science' },
      { icon: '🤖', text: 'Machine learning intro', category: 'AI/ML' },
    ],
  };
  return suggestions[courseId];
};

export default function SuggestionsPage({ courseId }: SuggestionsPageProps) {
  const router = useRouter();
  const { createConversation } = useConversationStore();
  const course = getCourseOptions(courseId);
  const suggestions = getSuggestionsForCourse(courseId);

  const handleBackClick = () => {
    router.push('/');
  };

  const handleSuggestionClick = async (suggestion: string) => {
    console.log('🔍 SuggestionsPage - Suggestion clicked:', {
      courseId,
      suggestion,
    });

    try {
      // Create new conversation
      const conversationId = await createConversation(undefined, courseId);
      console.log('✅ Conversation created:', conversationId);

      // Navigate to the conversation page with suggestion as URL parameter
      // This will allow ChatInterface to handle the suggestion and auto-submit it
      router.push(
        `/chat/courses/${courseId}/${conversationId}?suggestion=${encodeURIComponent(
          suggestion,
        )}`,
      );
    } catch (error) {
      console.error('❌ Failed to create conversation:', error);
    }
  };

  const handleStartConversation = async () => {
    console.log('🔍 SuggestionsPage - Start conversation clicked:', {
      courseId,
    });

    try {
      // Create new conversation
      const conversationId = await createConversation(undefined, courseId);
      console.log('✅ Conversation created:', conversationId);

      // Navigate to the conversation page
      router.push(`/chat/courses/${courseId}/${conversationId}`);
    } catch (error) {
      console.error('❌ Failed to create conversation:', error);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
      <div className='px-6 py-8 min-h-screen flex flex-col'>
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-center mb-8'>
          <button
            onClick={handleBackClick}
            className='p-2 rounded-full hover:bg-white/50 transition-colors mr-4'
            title='Back to course selection'>
            <ArrowLeft className='w-6 h-6 text-slate-600' />
          </button>
          <div className='flex items-center space-x-3'>
            <div
              className={`p-3 rounded-xl bg-gradient-to-r ${course.gradient} shadow-lg`}>
              <course.icon className='w-8 h-8 text-white' />
            </div>
            <div>
              <h1 className='text-2xl font-bold text-gray-800'>
                {course.name} Learning
              </h1>
              <p className='text-slate-600'>
                Choose a topic to start your conversation
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className='flex-1 max-w-6xl mx-auto w-full'>
          {/* Section Header */}
          {/* <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 text-slate-700 mb-4">
              <Sparkles className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold">Popular {course.name} Topics</h2>
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-slate-500 mb-6">
              Click any topic below to start learning, or begin your own custom conversation
            </p>
          </motion.div> */}

          {/* Suggestions Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='grid md:grid-cols-5 gap-4 mb-8'>
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.text}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSuggestionClick(suggestion.text)}
                className={`group relative p-5 rounded-xl border-2 ${
                  course.borderColor
                } ${course.bgColor} hover:${course.borderColor.replace(
                  '200',
                  '300',
                )} hover:shadow-md transition-all duration-200 text-left`}>
                {/* Gradient overlay on hover */}
                <div
                  className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 bg-gradient-to-br ${course.gradient} transition-opacity duration-200 pointer-events-none`}
                />

                {/* Content */}
                <div className='relative z-10'>
                  <div className='flex items-center space-x-2 mb-3'>
                    <span className='text-xl'>{suggestion.icon}</span>
                    <span
                      className='text-xs font-semibold uppercase tracking-wider opacity-60'
                      style={{ color: course.textColor }}>
                      {suggestion.category}
                    </span>
                  </div>
                  <p className='text-sm font-medium leading-relaxed text-gray-800 mb-3'>
                    {suggestion.text}
                  </p>

                  {/* Hover indicator */}
                  <div className='flex items-center justify-end'>
                    <ChevronRight
                      className='w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity'
                      style={{ color: course.textColor }}
                    />
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* Start Custom Conversation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className='text-center'>
            <div className='mb-4'>
              <p className='text-slate-600 mb-4'>
                Or start with your own question
              </p>
              <button
                onClick={handleStartConversation}
                className='px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-lg font-semibold rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 mx-auto'>
                <span>Start Custom Conversation</span>
                <ChevronRight className='w-5 h-5' />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}