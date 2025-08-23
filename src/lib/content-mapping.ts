export interface CourseSection {
  id: string
  name: string
  topics: string[]
  description: string
}

export const NODEJS_SECTIONS: Record<string, CourseSection> = {
  '01-fundamentals': {
    id: '01-fundamentals',
    name: 'Node.js Fundamentals',
    topics: ['node.js', 'modules', 'npm', 'architecture', 'http', 'express'],
    description: 'Core Node.js concepts, modules, HTTP, and Express basics'
  },
  '02-authentication': {
    id: '02-authentication', 
    name: 'Authentication & Security',
    topics: ['authentication', 'authorization', 'sessions', 'jwt', 'security', 'middleware'],
    description: 'User authentication, authorization, sessions, and security'
  },
  '03-system-design': {
    id: '03-system-design',
    name: 'System Design',
    topics: ['scaling', 'microservices', 'monolith', 'api-gateway', 'async', 'queues'],
    description: 'System design, scaling, microservices, and architecture patterns'
  }
}

export const PYTHON_SECTIONS: Record<string, CourseSection> = {
  '01-introduction': {
    id: '01-introduction',
    name: 'Python Introduction',
    topics: ['python', 'programming', 'syntax', 'environment', 'pep8'],
    description: 'Python basics, programming concepts, and setup'
  },
  '02-data-types': {
    id: '02-data-types',
    name: 'Data Types & Structures',
    topics: ['strings', 'numbers', 'lists', 'tuples', 'sets', 'dictionaries', 'mutable', 'immutable'],
    description: 'Python data types, collections, and data structures'
  },
  '03-control-flow': {
    id: '03-control-flow',
    name: 'Control Flow & Projects',
    topics: ['conditionals', 'if-else', 'projects', 'logic', 'decision-making'],
    description: 'Control flow statements and practical projects'
  },
  '04-loops': {
    id: '04-loops',
    name: 'Loops & Iteration',
    topics: ['for-loops', 'while-loops', 'enumerate', 'zip', 'iteration', 'break', 'continue'],
    description: 'Looping constructs and iteration patterns'
  },
  '05-functions': {
    id: '05-functions',
    name: 'Functions & Scope',
    topics: ['functions', 'scope', 'arguments', 'return', 'lambda', 'modules', 'imports'],
    description: 'Function definition, scope, arguments, and modules'
  },
  '06-comprehensions': {
    id: '06-comprehensions',
    name: 'Comprehensions',
    topics: ['list-comprehension', 'dict-comprehension', 'set-comprehension', 'generators'],
    description: 'List, dictionary, set comprehensions and generators'
  },
  '07-advanced-concepts': {
    id: '07-advanced-concepts',
    name: 'Advanced Concepts',
    topics: ['generators', 'decorators', 'yield', 'advanced-python'],
    description: 'Advanced Python concepts: generators, decorators, and yield'
  },
  '08-oop': {
    id: '08-oop',
    name: 'Object-Oriented Programming',
    topics: ['classes', 'objects', 'inheritance', 'methods', 'static-methods', 'properties'],
    description: 'Object-oriented programming concepts and patterns'
  },
  '09-error-handling': {
    id: '09-error-handling',
    name: 'Error Handling',
    topics: ['exceptions', 'try-except', 'error-handling', 'debugging', 'file-handling'],
    description: 'Exception handling, debugging, and file operations'
  },
  '10-environments': {
    id: '10-environments',
    name: 'Virtual Environments',
    topics: ['virtual-environment', 'venv', 'package-management', 'isolation'],
    description: 'Virtual environments and package management'
  }
}

export function getSectionInfo(course: 'nodejs' | 'python', sectionId: string): CourseSection | null {
  const sections = course === 'nodejs' ? NODEJS_SECTIONS : PYTHON_SECTIONS
  return sections[sectionId] || null
}