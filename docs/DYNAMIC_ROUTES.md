# Dynamic Course Routes

## Overview

Neruvi uses **dynamic routes** for courses, making it easy to scale and add new courses without creating new route files for each course.

## Route Structure

```
/courses/[courseId]           → Start a new chat for a course
/courses/[courseId]/[chatId]  → Continue an existing chat
```

### Examples

```
/courses/nodejs               → Start Node.js course
/courses/python               → Start Python course
/courses/react                → Start React course (when added)

/courses/nodejs/nodejs-abc123-xyz456    → Node.js chat session
/courses/python/python-def789-uvw012    → Python chat session
```

## Adding a New Course

To add a new course, simply update the `COURSES` configuration in `src/lib/courses.ts`:

```typescript
export const COURSES: Record<string, Course> = {
  // Existing courses...
  nodejs: { ... },
  python: { ... },

  // Add new course here
  react: {
    id: 'react',
    name: 'React',
    displayName: 'React',
    description: 'Modern frontend library for building user interfaces',
    icon: '⚛️',
    color: '#61dafb',
    enabled: true,  // Set to false to disable
    sections: ['basics', 'hooks', 'routing', 'state-management']
  },
}
```

That's it! The route `/courses/react` will automatically work.

## Course Configuration

### Course Interface

```typescript
interface Course {
  id: string          // Unique course identifier (lowercase, no spaces)
  name: string        // Short name
  displayName: string // Display name shown in UI
  description: string // Course description
  icon: string        // Icon/emoji
  color: string       // Primary color (hex)
  enabled: boolean    // Enable/disable course
  sections?: string[] // Optional: course sections
}
```

### Course ID Requirements

- **Lowercase** letters, numbers, and hyphens only
- **Unique** identifier
- **Meaningful** name (e.g., 'nodejs', 'python', 'react')
- **URL-friendly** (no spaces or special characters)

### Examples

✅ **Good Course IDs:**
- `nodejs`
- `python`
- `react`
- `typescript`
- `data-science`
- `machine-learning`

❌ **Bad Course IDs:**
- `Node.js` (uppercase)
- `data science` (spaces)
- `c++` (special characters)
- `123` (not meaningful)

## Chat ID Format

Chat IDs follow this pattern:
```
{courseId}-{timestamp}-{random}
```

### Examples
```
nodejs-abc123xyz-def456
python-789ghi012-jkl345
react-mno678pqr-stu901
```

This format:
- ✅ Identifies the course
- ✅ Sorts chronologically
- ✅ Ensures uniqueness
- ✅ Is URL-friendly

## Backward Compatibility

The system supports legacy chat ID formats:
- UUID format: `550e8400-e29b-41d4-a716-446655440000`
- Custom format: `conv_1234567890_abc123`
- Old prefix format: `nodejs-*`, `python-*`

## Utility Functions

### `src/lib/courses.ts`

```typescript
// Get all enabled courses
const courses = getEnabledCourses()

// Get course by ID
const course = getCourseById('nodejs')

// Check if course is valid
if (isCourseValid('nodejs')) {
  // Course exists and is enabled
}

// Get all course IDs
const allIds = getAllCourseIds()

// Get enabled course IDs only
const enabledIds = getEnabledCourseIds()

// Validate course ID format
if (isValidCourseId('nodejs')) {
  // Valid format
}
```

## Route Files

### `/courses/[courseId]/page.tsx`
- Redirects to new chat session
- Validates course exists
- Generates unique chat ID

### `/courses/[courseId]/[chatId]/page.tsx`
- Renders chat interface
- Validates course and chat ID
- Supports backward compatibility

## Component Integration

Components automatically work with dynamic routes:

```typescript
// SimpleCourseSelector
handleStartLearning() {
  if (selectedCourse) {
    router.push(`/courses/${selectedCourse}`)  // Works!
  }
}

// ChatInterface
<ChatInterface courseId={courseId} conversationId={chatId} />
```

## Static Site Generation

Dynamic routes support static generation for all enabled courses:

```typescript
export async function generateStaticParams() {
  const courseIds = getEnabledCourseIds()
  return courseIds.map((courseId) => ({ courseId }))
}
```

This pre-renders pages at build time for better performance.

## Migration from Static Routes

### Before (Static Routes)
```
/nodejs                    → src/app/nodejs/page.tsx
/nodejs/[chatId]           → src/app/nodejs/[chatId]/page.tsx
/python                    → src/app/python/page.tsx
/python/[chatId]           → src/app/python/[chatId]/page.tsx
```

❌ **Problems:**
- New course = new route files
- Duplicate code
- Hard to maintain
- Not scalable

### After (Dynamic Routes)
```
/courses/[courseId]           → src/app/courses/[courseId]/page.tsx
/courses/[courseId]/[chatId]  → src/app/courses/[courseId]/[chatId]/page.tsx
```

✅ **Benefits:**
- One route handles all courses
- Add courses by config only
- No code duplication
- Infinitely scalable
- Easy to maintain

## Benefits

### 1. **Scalability**
Add unlimited courses without creating new route files:
```typescript
// Just add to config
COURSES.javascript = { ... }
COURSES.typescript = { ... }
COURSES.rust = { ... }
// Routes automatically work!
```

### 2. **Maintainability**
- Single source of truth
- Update logic in one place
- No duplicate code
- Easier refactoring

### 3. **Flexibility**
- Enable/disable courses with a flag
- A/B test new courses
- Feature flagging support
- Environment-based courses

### 4. **Type Safety**
- TypeScript validation
- Autocomplete support
- Compile-time checks
- Reduced runtime errors

## Future Enhancements

### Course Categories
```typescript
interface Course {
  // ...
  category: 'backend' | 'frontend' | 'data-science'
}
```

### Course Prerequisites
```typescript
interface Course {
  // ...
  prerequisites?: string[]  // ['javascript', 'html']
}
```

### Course Levels
```typescript
interface Course {
  // ...
  level: 'beginner' | 'intermediate' | 'advanced'
}
```

### Course Metadata
```typescript
interface Course {
  // ...
  duration: string      // '10 hours'
  students: number      // 1500
  rating: number        // 4.5
  lastUpdated: Date
}
```

## Summary

Dynamic routes provide:
- ✅ **Infinite scalability** - add courses via config
- ✅ **Better maintainability** - single source of truth
- ✅ **Type safety** - TypeScript validation
- ✅ **Backward compatibility** - supports legacy formats
- ✅ **Performance** - static site generation
- ✅ **Flexibility** - easy enable/disable

**Key Takeaway:** Adding a new course now takes **30 seconds** instead of creating multiple route files and copying code!

---

**Part of Neruvi Documentation** - Scalable AI Learning Platform
