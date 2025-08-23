import { motion, AnimatePresence } from 'framer-motion';
import { Code2, FileText, Sparkles, ChevronRight, CheckCircle } from 'lucide-react';
import { SiNodedotjs, SiPython } from 'react-icons/si';
import { FaCode } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import '../../styles/scrollbar.css';

export type CourseType = 'nodejs' | 'python' | 'both';

interface CourseSelectorProps {
  selectedCourse: CourseType | null;
  onCourseSelect: (course: CourseType) => void;
  onSuggestionClick?: (suggestion: string, course: CourseType) => void;
  isVisible: boolean;
}

const courseOptions = [
  {
    id: 'nodejs' as CourseType,
    name: 'Node.js',
    description: 'Backend development, Express.js, APIs, async programming',
    icon: SiNodedotjs,
    iconColor: '#339933', // Official Node.js green
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    hoverColor: 'hover:border-green-400',
    selectedColor: 'border-green-500 bg-green-100',
    textColor: 'text-green-700',
    topics: ['Express.js', 'REST APIs', 'Async/Await', 'Middleware', 'MongoDB', 'Authentication'],
  },
  {
    id: 'python' as CourseType,
    name: 'Python',
    description: 'Data structures, OOP, web frameworks, data science',
    icon: SiPython,
    iconColor: '#3776ab', // Official Python blue
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:border-blue-400',
    selectedColor: 'border-blue-500 bg-blue-100',
    textColor: 'text-blue-700',
    topics: ['Functions', 'Classes', 'Data Types', 'Django/Flask', 'NumPy', 'Machine Learning'],
  },
  {
    id: 'both' as CourseType,
    name: 'Both Courses',
    description: 'Search across both Node.js and Python content',
    icon: FaCode,
    iconColor: '#8B5CF6', // Purple for both
    gradient: 'from-purple-500 via-violet-500 to-indigo-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    hoverColor: 'hover:border-purple-400',
    selectedColor: 'border-purple-500 bg-purple-100',
    textColor: 'text-purple-700',
    topics: ['Full Stack', 'Programming Concepts', 'Best Practices', 'Algorithms', 'Problem Solving'],
  },
];

export default function CourseSelector({ selectedCourse, onCourseSelect, onSuggestionClick, isVisible }: CourseSelectorProps) {
  const [hoveredCourse, setHoveredCourse] = useState<CourseType | null>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleMouseEnter = (courseId: CourseType) => {
    setHoveredCourse(courseId);
    const card = cardRefs.current[courseId];
    if (card) {
      gsap.to(card, {
        scale: 1.05,
        y: -8,
        boxShadow: '0 20px 40px rgba(139, 92, 246, 0.2)',
        duration: 0.3,
        ease: 'power2.out',
      });
      
      // Animate the icon
      const icon = card.querySelector('.course-icon');
      if (icon) {
        gsap.to(icon, {
          scale: 1.1,
          rotation: 5,
          duration: 0.3,
          ease: 'back.out(1.7)',
        });
      }

      // Animate the topics
      const topics = card.querySelectorAll('.topic-tag');
      gsap.fromTo(topics, 
        { scale: 0.9, opacity: 0.7 },
        { 
          scale: 1, 
          opacity: 1, 
          duration: 0.2, 
          stagger: 0.05,
          ease: 'power2.out' 
        }
      );
    }
  };

  const handleMouseLeave = (courseId: CourseType) => {
    setHoveredCourse(null);
    const card = cardRefs.current[courseId];
    if (card) {
      gsap.to(card, {
        scale: 1,
        y: 0,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        duration: 0.3,
        ease: 'power2.out',
      });
      
      // Reset icon
      const icon = card.querySelector('.course-icon');
      if (icon) {
        gsap.to(icon, {
          scale: 1,
          rotation: 0,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: { duration: 0.3, ease: 'easeIn' },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    },
    hover: {
      scale: 1.02,
      y: -2,
      transition: { duration: 0.2, ease: 'easeOut' },
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
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
        ease: 'easeOut',
      },
    }),
  };

  // Course-specific suggestions
  const getSuggestionsForCourse = (courseId: CourseType | null) => {
    const suggestions = {
      nodejs: [
        { icon: '🚀', text: 'Express.js best practices', category: 'Framework' },
        { icon: '🔒', text: 'JWT authentication setup', category: 'Security' },
        { icon: '📡', text: 'Building REST APIs', category: 'API Design' },
        { icon: '🔄', text: 'Async/await patterns', category: 'Async Programming' },
        { icon: '📦', text: 'NPM package management', category: 'Dependencies' },
      ],
      python: [
        { icon: '🐍', text: 'Object-oriented programming', category: 'OOP Concepts' },
        { icon: '📊', text: 'Data structures & algorithms', category: 'Fundamentals' },
        { icon: '🌐', text: 'Django/Flask web frameworks', category: 'Web Development' },
        { icon: '📈', text: 'NumPy and pandas basics', category: 'Data Science' },
        { icon: '🤖', text: 'Machine learning intro', category: 'AI/ML' },
      ],
      both: [
        { icon: '💻', text: 'Full-stack development tips', category: 'Development' },
        { icon: '🏗️', text: 'Software architecture patterns', category: 'Architecture' },
        { icon: '🔧', text: 'Debugging techniques', category: 'Problem Solving' },
        { icon: '📚', text: 'Best coding practices', category: 'Best Practices' },
        { icon: '⚡', text: 'Performance optimization', category: 'Optimization' },
      ],
    };

    return suggestions[courseId || 'both'] || suggestions.both;
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="h-full w-full overflow-y-auto course-scroll-container"
        >
          {/* Content wrapper with padding */}
          <div className="px-6 py-8 min-h-full flex flex-col justify-center"
               style={{ minHeight: 'calc(100vh - 64px)' }} // Subtract header height
          >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6"
          >
            <div className="flex items-center justify-center mb-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 shadow-lg">
                <Code2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Choose Your Learning Path
            </h2>
            <p className="text-slate-600 max-w-md mx-auto">
              Select which course content you'd like me to help you with today
            </p>
          </motion.div>

          {/* Course Options Grid */}
          <motion.div
            className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-6"
            variants={containerVariants}
          >
            {courseOptions.map((course, index) => {
              const isSelected = selectedCourse === course.id;
              const isHovered = hoveredCourse === course.id;

              return (
                <div
                  key={course.id}
                  ref={el => cardRefs.current[course.id] = el}
                  onMouseEnter={() => handleMouseEnter(course.id)}
                  onMouseLeave={() => handleMouseLeave(course.id)}
                  onClick={() => onCourseSelect(course.id)}
                  className={`
                    relative p-6 rounded-2xl cursor-pointer
                    bg-white backdrop-blur-sm
                    ${isSelected 
                      ? `border-2 ${course.selectedColor.split(' ')[0]} shadow-lg ring-2 ${course.selectedColor.split(' ')[0].replace('border', 'ring')}/20` 
                      : 'border border-slate-200'
                    }
                    shadow-lg transition-all duration-200 ease-out
                  `}
                >
                  {/* Modern gradient overlay for selected state */}
                  {isSelected && (
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${course.gradient} opacity-5 pointer-events-none`} />
                  )}
                  
                  {/* Subtle hover highlight */}
                  <AnimatePresence>
                    {isHovered && !isSelected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 pointer-events-none"
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
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-lg"
                      >
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Course icon and gradient */}
                  <div className="relative z-20 flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`
                        p-3 rounded-xl bg-gradient-to-r ${course.gradient}
                        shadow-lg transform transition-transform duration-200
                        ${isHovered ? 'scale-110 rotate-3' : ''}
                      `}>
                        <course.icon 
                          className="w-7 h-7 text-white" 
                          style={{ color: 'white' }}
                        />
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold ${course.textColor} relative z-10`}>
                          {course.name}
                        </h3>
                      </div>
                    </div>
                    <ChevronRight className={`
                      w-5 h-5 transition-all duration-200 relative z-10
                      ${isSelected ? course.textColor : 'text-slate-400'}
                      ${isHovered ? 'translate-x-1' : ''}
                    `} />
                  </div>

                  {/* Description */}
                  <p className={`text-sm mb-4 ${course.textColor} opacity-80 relative z-20`}>
                    {course.description}
                  </p>

                  {/* Topics */}
                  <div className="relative z-20 space-y-2">
                    <h4 className={`text-xs font-semibold uppercase tracking-wider ${course.textColor} opacity-60`}>
                      Key Topics
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      <AnimatePresence>
                        {course.topics.map((topic, topicIndex) => (
                          <motion.span
                            key={topic}
                            custom={topicIndex}
                            variants={topicVariants}
                            initial="hidden"
                            animate={isVisible ? "visible" : "hidden"}
                            className={`
                              text-xs px-2 py-1 rounded-full relative z-10
                              ${isSelected 
                                ? `bg-white/50 ${course.textColor}` 
                                : `bg-white/80 ${course.textColor}`
                              }
                              font-medium transition-colors duration-200
                            `}
                          >
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
                transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
                className="max-w-5xl mx-auto"
              >
                {/* Section Header */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-2 text-slate-700 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <h3 className="text-xl font-bold">
                      Popular {selectedCourse === 'both' ? 'Programming' : selectedCourse === 'nodejs' ? 'Node.js' : 'Python'} Topics
                    </h3>
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-slate-500 text-sm">
                    Click any topic to get started, or ask your own question
                  </p>
                </div>

                {/* Suggestions Grid */}
                <div className="grid md:grid-cols-5 gap-3 mb-6">
                  {getSuggestionsForCourse(selectedCourse).map((suggestion, index) => {
                    const selectedCourseOption = courseOptions.find(c => c.id === selectedCourse);
                    
                    return (
                      <motion.button
                        key={suggestion.text}
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          delay: 0.5 + (index * 0.1), 
                          duration: 0.3,
                          type: 'spring',
                          stiffness: 300,
                          damping: 25
                        }}
                        whileHover={{ 
                          scale: 1.05, 
                          y: -4,
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (onSuggestionClick && selectedCourse) {
                            onSuggestionClick(suggestion.text, selectedCourse);
                          }
                        }}
                        title={`Click to start chatting about: ${suggestion.text}`}
                        className={`
                          group relative p-4 rounded-xl border-2 cursor-pointer
                          ${selectedCourseOption?.borderColor} ${selectedCourseOption?.bgColor}
                          hover:${selectedCourseOption?.selectedColor.split(' ')[0]} 
                          hover:shadow-lg transition-all duration-200
                          text-left overflow-hidden
                          hover:border-opacity-100 hover:shadow-xl
                        `}
                      >
                        {/* Gradient overlay on hover */}
                        <div className={`
                          absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 
                          bg-gradient-to-br ${selectedCourseOption?.gradient} 
                          transition-opacity duration-200 pointer-events-none
                        `} />
                        
                        {/* Content */}
                        <div className="relative z-10">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">{suggestion.icon}</span>
                            <span className={`text-xs font-semibold uppercase tracking-wider ${selectedCourseOption?.textColor} opacity-60`}>
                              {suggestion.category}
                            </span>
                          </div>
                          <p className={`text-sm font-medium ${selectedCourseOption?.textColor} leading-relaxed`}>
                            {suggestion.text}
                          </p>
                        </div>

                        {/* Hover indicator */}
                        <div className={`
                          absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 
                          transition-opacity duration-200
                        `}>
                          <ChevronRight className={`w-4 h-4 ${selectedCourseOption?.textColor}`} />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Removed unnecessary "chat below" message as there's no input box below */}
              </motion.div>
            )}
          </AnimatePresence>
          </div> {/* Close content wrapper */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}