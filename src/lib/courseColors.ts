// Dynamic color system for course cards
// This system automatically generates subtle, professional colors for any number of courses

export type CourseColorPalette = {
  name: string;
  gradient: string;
  border: string;
  bg: string;
  textColor: string;
};

export type CourseColors = {
  gradient: string;
  bgColor: string;
  borderColor: string;
  hoverColor: string;
  selectedColor: string;
  textColor: string;
};

// Predefined color palettes - subtle and professional
export const courseColorPalettes: CourseColorPalette[] = [
  {
    name: 'emerald',
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    border: 'emerald',
    bg: 'emerald',
    textColor: '#059669',
  },
  {
    name: 'indigo', 
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    border: 'indigo',
    bg: 'indigo', 
    textColor: '#4338ca',
  },
  {
    name: 'rose',
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    border: 'rose',
    bg: 'rose',
    textColor: '#e11d48',
  },
  {
    name: 'amber',
    gradient: 'from-yellow-500 via-amber-500 to-orange-500', 
    border: 'amber',
    bg: 'amber',
    textColor: '#d97706',
  },
  {
    name: 'violet',
    gradient: 'from-purple-500 via-violet-500 to-fuchsia-500',
    border: 'violet',
    bg: 'violet',
    textColor: '#7c3aed',
  },
  {
    name: 'cyan',
    gradient: 'from-teal-500 via-cyan-500 to-blue-500',
    border: 'cyan', 
    bg: 'cyan',
    textColor: '#0891b2',
  },
  {
    name: 'orange',
    gradient: 'from-red-500 via-orange-500 to-yellow-500',
    border: 'orange',
    bg: 'orange', 
    textColor: '#ea580c',
  },
  {
    name: 'lime',
    gradient: 'from-green-500 via-lime-500 to-yellow-500',
    border: 'lime',
    bg: 'lime',
    textColor: '#65a30d',
  },
];

/**
 * Generate dynamic colors for a course based on index
 * This ensures consistent colors across the application
 */
export const generateCourseColors = (index: number): CourseColors => {
  const palette = courseColorPalettes[index % courseColorPalettes.length];
  return {
    gradient: palette.gradient,
    bgColor: 'bg-slate-50', // Neutral background for all courses
    borderColor: `border-${palette.border}-100`,
    hoverColor: `hover:border-${palette.border}-200`, 
    selectedColor: `border-${palette.border}-300 bg-${palette.bg}-50`,
    textColor: palette.textColor,
  };
};

/**
 * Map course ID to index for consistent coloring
 * Add new course IDs here to maintain color consistency
 */
export const getCourseColorIndex = (courseId: string): number => {
  const courseColorMap: Record<string, number> = {
    'nodejs': 0,
    'python': 1,
    'javascript': 2,
    'react': 3,
    'vue': 4,
    'angular': 5,
    'golang': 6,
    'rust': 7,
    // Add more courses as needed - they will automatically get colors
  };
  
  return courseColorMap[courseId] ?? 0; // Default to first color if not found
};

/**
 * Get colors for a specific course ID
 */
export const getCourseColors = (courseId: string): CourseColors => {
  const index = getCourseColorIndex(courseId);
  return generateCourseColors(index);
};