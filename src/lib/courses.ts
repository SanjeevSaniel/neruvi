/**
 * Course Configuration
 * Central configuration for all available courses
 * Easily scalable - just add new courses to this file
 */

export interface Course {
  id: string
  name: string
  displayName: string
  description: string
  icon: string
  color: string
  enabled: boolean
  sections?: string[]
}

export const COURSES: Record<string, Course> = {
  nodejs: {
    id: 'nodejs',
    name: 'Node.js',
    displayName: 'Node.js',
    description: 'Backend JavaScript runtime and web development',
    icon: '🟢',
    color: '#68a063',
    enabled: true,
    sections: ['fundamentals', 'authentication', 'system-design']
  },
  python: {
    id: 'python',
    name: 'Python',
    displayName: 'Python',
    description: 'General-purpose programming and data science',
    icon: '🐍',
    color: '#3776ab',
    enabled: true,
    sections: [
      'introduction',
      'data-types',
      'control-flow',
      'loops',
      'functions',
      'comprehensions',
      'advanced-concepts',
      'oop',
      'error-handling'
    ]
  },
  // Add more courses here as needed
  // react: {
  //   id: 'react',
  //   name: 'React',
  //   displayName: 'React',
  //   description: 'Modern frontend library for building user interfaces',
  //   icon: '⚛️',
  //   color: '#61dafb',
  //   enabled: false,
  //   sections: []
  // },
}

/**
 * Get all enabled courses
 */
export function getEnabledCourses(): Course[] {
  return Object.values(COURSES).filter(course => course.enabled)
}

/**
 * Get course by ID
 */
export function getCourseById(courseId: string): Course | undefined {
  return COURSES[courseId.toLowerCase()]
}

/**
 * Check if course exists and is enabled
 */
export function isCourseValid(courseId: string): boolean {
  const course = getCourseById(courseId)
  return course !== undefined && course.enabled
}

/**
 * Get all course IDs
 */
export function getAllCourseIds(): string[] {
  return Object.keys(COURSES)
}

/**
 * Get enabled course IDs
 */
export function getEnabledCourseIds(): string[] {
  return getEnabledCourses().map(course => course.id)
}

/**
 * Validate course ID format
 */
export function isValidCourseId(courseId: string): boolean {
  return /^[a-z0-9-]+$/i.test(courseId)
}
