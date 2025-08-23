# FlowMind - Component Reference Guide

## 📱 Component Architecture Overview

FlowMind uses a modular component architecture built with React, TypeScript, and modern UI libraries. Each component is designed for reusability, maintainability, and optimal performance.

---

## 🎛️ Core Components

### 1. ChatInterface.tsx
**Purpose**: Main orchestrator component that manages the entire chat experience

**Key Responsibilities**:
- State management for chat flow
- Course selection logic
- Conversation switching
- Message handling and submission
- Screen transitions (course selection → welcome → chat)

**Props**: None (root component)

**State Variables**:
```typescript
const [input, setInput] = useState('');                    // Current message input
const [isLoading, setIsLoading] = useState(false);        // API request state
const [hasStartedChat, setHasStartedChat] = useState(false); // Chat session state
const [sidebarOpen, setSidebarOpen] = useState(false);    // Sidebar visibility
const [showCourseSelector, setShowCourseSelector] = useState(false); // Course selector visibility
```

**Key Functions**:
```typescript
handleCourseSelect(course: CourseType): void              // Course selection handler
handleSuggestionClick(suggestion: string, course: CourseType): Promise<void> // Suggestion click handler  
handleSubmit(inputText: string): Promise<void>            // Message submission
handleHeaderClick(): void                                 // Header logo click handler
formatTimestamp(seconds: number): string                  // Timestamp formatting utility
```

**Flow Control Logic**:
```typescript
// Screen display logic
const needsCourseSelection = (!currentConversationId || !selectedCourse) && !showCourseSelector;
const shouldShowWelcome = currentConversationId && selectedCourse && !hasStartedChat && !showCourseSelector;
```

---

### 2. CourseSelector.tsx
**Purpose**: Animated course selection interface with actionable suggestion cards

**Props Interface**:
```typescript
interface CourseSelectorProps {
  selectedCourse: CourseType | null;
  onCourseSelect: (course: CourseType) => void;
  onSuggestionClick?: (suggestion: string, course: CourseType) => void;
  isVisible: boolean;
}
```

**Course Configuration**:
```typescript
const courseOptions = [
  {
    id: 'nodejs' as CourseType,
    name: 'Node.js',
    description: 'Backend development, Express.js, APIs, async programming',
    icon: SiNodedotjs,
    iconColor: '#339933',                    // Official Node.js green
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    topics: ['Express.js', 'REST APIs', 'Async/Await', 'Middleware', 'MongoDB']
  },
  // ... Python and Both configurations
];
```

**Animation System**:
```typescript
// GSAP hover animations
const handleMouseEnter = (courseId: CourseType) => {
  gsap.to(card, {
    scale: 1.05, y: -8,
    boxShadow: '0 20px 40px rgba(139, 92, 246, 0.2)',
    duration: 0.3, ease: 'power2.out',
  });
};

// Framer Motion variants
const containerVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { staggerChildren: 0.1 } }
};
```

**Suggestion Cards**:
```typescript
const getSuggestionsForCourse = (courseId: CourseType | null) => {
  const suggestions = {
    nodejs: [
      { icon: '🚀', text: 'Express.js best practices', category: 'Framework' },
      { icon: '🔒', text: 'JWT authentication setup', category: 'Security' },
      // ... more suggestions
    ],
    // ... other course suggestions
  };
  return suggestions[courseId || 'both'];
};
```

---

### 3. WelcomeScreen.tsx
**Purpose**: Course-specific welcome screen with personalized suggestions

**Props Interface**:
```typescript
interface WelcomeScreenProps {
  onSubmit: (text: string) => Promise<void>;
  selectedCourse?: CourseType | null;
}
```

**Dynamic Content Generation**:
```typescript
// Course-specific suggestions
const getSuggestions = (course: CourseType | null): Suggestion[] => {
  const suggestionsByCourse = {
    nodejs: [
      { icon: Code2, text: 'How to create an Express.js server?' },
      { icon: Zap, text: 'Explain async/await in Node.js' },
      // ... more Node.js suggestions
    ],
    python: [
      { icon: Code2, text: 'Python list comprehensions tutorial' },
      { icon: Zap, text: 'Object-oriented programming in Python' },
      // ... more Python suggestions  
    ],
    both: [
      { icon: Code2, text: 'Best practices for error handling' },
      { icon: Zap, text: 'Debugging techniques for developers' },
      // ... general programming suggestions
    ]
  };
  return suggestionsByCourse[course || 'both'];
};
```

**Personalized Welcome Messages**:
```typescript
// Dynamic welcome text based on course
const welcomeTitle = selectedCourse 
  ? `Ready to learn ${selectedCourse === 'nodejs' ? 'Node.js' : selectedCourse === 'python' ? 'Python' : 'Programming'}?`
  : 'Welcome to FlowMind';

const welcomeDescription = selectedCourse
  ? `Let's explore ${selectedCourse === 'nodejs' ? 'Node.js development' : selectedCourse === 'python' ? 'Python programming' : 'programming concepts'} together!`
  : 'Your intelligent programming assistant for Node.js and Python';
```

---

### 4. ConversationSidebar.tsx
**Purpose**: Animated sidebar for conversation history management

**Props Interface**:
```typescript
interface ConversationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Key Features**:
- Conversation list with course indicators
- New conversation creation
- Conversation deletion with hover effects
- Animated slide-in/out transitions

**Course Indicators**:
```typescript
// Visual course badges in conversation list
{conversation.selectedCourse && (
  <span className={`
    text-xs px-2 py-0.5 rounded-full font-medium
    ${conversation.selectedCourse === 'nodejs' ? 'bg-green-100 text-green-700' :
      conversation.selectedCourse === 'python' ? 'bg-blue-100 text-blue-700' :
      'bg-purple-100 text-purple-700'}
  `}>
    {conversation.selectedCourse === 'nodejs' ? 'Node.js' :
     conversation.selectedCourse === 'python' ? 'Python' : 'Both'}
  </span>
)}
```

**Animation Implementation**:
```typescript
// Sidebar slide animation
<motion.div
  initial={{ x: -320 }}
  animate={{ x: 0 }}
  exit={{ x: -320 }}
  transition={{ type: "spring", damping: 30, stiffness: 300 }}
  className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50"
>
```

---

### 5. ChatHeader.tsx
**Purpose**: Interactive header with clickable logo and status indicator

**Props Interface**:
```typescript
interface ChatHeaderProps {
  onOpenSidebar?: () => void;
  onHeaderClick?: () => void;
}
```

**Clickable Logo Implementation**:
```typescript
<motion.button
  onClick={onHeaderClick}
  className='flex justify-center items-center gap-2 p-2 rounded-lg hover:bg-white/10'
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  title='Show course selection'
>
  <FlowMindLogo />
  <div className='text-left'>
    <h1>FlowMind</h1>
    <p>AI Programming Assistant</p>
  </div>
</motion.button>
```

**AI Status Indicator**:
```typescript
const AIStatusIndicator = () => (
  <motion.div className='flex items-center space-x-3 px-4 py-2 rounded-full bg-white/10'>
    <div className='relative'>
      <Brain className='w-5 h-5 text-white' />
      <motion.div
        className='absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400'
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
    <span className='text-white text-sm font-bold'>AI ACTIVE</span>
  </motion.div>
);
```

---

### 6. EnhancedMessageRenderer.tsx
**Purpose**: Advanced message display with syntax highlighting and code formatting

**Key Features**:
- Automatic language detection for code blocks
- Prism.js syntax highlighting with dark theme
- Copy-to-clipboard functionality
- Markdown rendering with custom styles

**Language Detection**:
```typescript
const detectLanguage = (code: string): string => {
  const patterns = {
    javascript: [
      /\b(const|let|var)\s+\w+/,
      /function\s*\(/,
      /require\(|module\.exports/,
      /console\.log/
    ],
    python: [
      /\bdef\s+\w+/,
      /\bimport\s+\w+/,
      /print\(/,
      /if\s+__name__\s*==\s*["']__main__["']/
    ]
  };
  
  // Score each language and return best match
  const scores = Object.entries(patterns).map(([lang, langPatterns]) => ({
    language: lang,
    score: langPatterns.reduce((count, pattern) => count + (pattern.test(code) ? 1 : 0), 0)
  }));
  
  return scores.reduce((best, current) => current.score > best.score ? current : best).language || 'javascript';
};
```

**Code Block Component**:
```typescript
const CodeBlock = ({ children, className, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : detectLanguage(children);
  
  return (
    <div className="relative">
      <pre className={`language-${language}`}>
        <code className={`language-${language}`}>
          {children}
        </code>
      </pre>
      <CopyButton text={children} />
    </div>
  );
};
```

---

### 7. MessagesContainer.tsx
**Purpose**: Scrollable container for chat messages with auto-scroll functionality

**Props Interface**:
```typescript
interface MessagesContainerProps {
  messages: Message[];
  isLoading: boolean;
  ref: React.RefObject<HTMLDivElement>;
}
```

**Auto-Scroll Implementation**:
```typescript
// GSAP smooth scrolling to bottom
const scrollToBottom = () => {
  if (messagesContainerRef.current) {
    gsap.to(messagesContainerRef.current, {
      scrollTop: messagesContainerRef.current.scrollHeight,
      duration: 0.5,
      ease: 'power2.out'
    });
  }
};
```

**Loading States**:
```typescript
// Typing indicator animation
const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center space-x-2"
  >
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-purple-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
    <span>AI is thinking...</span>
  </motion.div>
);
```

---

### 8. ChatInput.tsx
**Purpose**: Advanced message input with multi-line support and smart submission

**Props Interface**:
```typescript
interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string) => Promise<void>;
  isLoading: boolean;
  disabled: boolean;
  placeholder: string;
}
```

**Enhanced Input Features**:
```typescript
// Auto-resize textarea
const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const target = e.target;
  target.style.height = 'auto';
  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  onChange(target.value);
};

// Smart Enter key handling
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!isLoading && value.trim()) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  }
};
```

**Animated Submit Button**:
```typescript
<motion.button
  type='submit'
  disabled={isLoading || !value.trim()}
  whileHover={{ scale: isLoading || !value.trim() ? 1 : 1.05 }}
  whileTap={{ scale: isLoading || !value.trim() ? 1 : 0.95 }}
  className={`ml-4 p-2 rounded-xl transition-all duration-300 ${
    !isLoading && value.trim()
      ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
      : 'bg-purple-200 text-purple-400 cursor-not-allowed opacity-50'
  }`}
>
  <Send className='w-5 h-5' />
</motion.button>
```

---

## 🎨 Animation Components

### Framer Motion Utilities
**Reusable Animation Variants**:
```typescript
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const scaleIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 }
};
```

### GSAP Integration Patterns
**Hover Effect Utilities**:
```typescript
export const createHoverAnimation = (element: HTMLElement) => {
  const timeline = gsap.timeline({ paused: true });
  
  timeline
    .to(element, { scale: 1.05, y: -4, duration: 0.3 })
    .to(element, { boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)' }, 0);
    
  return timeline;
};

// Usage in components
const hoverAnimation = useRef<gsap.core.Timeline>();

useEffect(() => {
  if (elementRef.current) {
    hoverAnimation.current = createHoverAnimation(elementRef.current);
  }
}, []);

const handleMouseEnter = () => hoverAnimation.current?.play();
const handleMouseLeave = () => hoverAnimation.current?.reverse();
```

---

## 🎯 Custom Hooks

### useConversationManagement
```typescript
const useConversationManagement = () => {
  const store = useConversationStore();
  
  const switchToCourse = useCallback((course: CourseType) => {
    const conversationId = store.getOrCreateConversationForCourse(course);
    return store.conversations.find(c => c.id === conversationId);
  }, [store]);
  
  const getCurrentCourseConversation = useCallback((course: CourseType) => {
    return store.getCurrentConversationForCourse(course);
  }, [store]);
  
  return { switchToCourse, getCurrentCourseConversation, ...store };
};
```

### useAnimationSequence
```typescript
const useAnimationSequence = (triggers: boolean[]) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  useEffect(() => {
    const activeIndex = triggers.findIndex(Boolean);
    if (activeIndex !== -1 && activeIndex !== currentStep) {
      setCurrentStep(activeIndex);
    }
  }, [triggers, currentStep]);
  
  return currentStep;
};
```

---

## 🔧 Component Best Practices

### TypeScript Patterns
**Strict Prop Types**:
```typescript
interface ComponentProps {
  required: string;
  optional?: number;
  callback: (value: string) => void;
  children?: React.ReactNode;
}

const Component: React.FC<ComponentProps> = ({ 
  required, 
  optional = 0, 
  callback, 
  children 
}) => {
  // Component implementation
};
```

**Generic Components**:
```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <div>
      {items.map((item, index) => (
        <div key={keyExtractor(item)}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
```

### Performance Optimization
**Memoization Strategies**:
```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return performComplexCalculation(data);
}, [data]);

// Memoize callback functions
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);

// Memoize entire components
const MemoizedComponent = memo(({ data }) => {
  return <div>{data.name}</div>;
});
```

**Lazy Loading**:
```typescript
// Dynamic component imports
const LazyComponent = lazy(() => import('./LazyComponent'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>
```

### Error Handling
**Error Boundaries**:
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ComponentErrorBoundary extends Component<{children: ReactNode}, ErrorBoundaryState> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Component error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

---

## 🎨 Styling Conventions

### Tailwind CSS Patterns
**Consistent Spacing**:
```typescript
const spacingClasses = {
  xs: 'p-2 m-1',
  sm: 'p-3 m-2', 
  md: 'p-4 m-3',
  lg: 'p-6 m-4',
  xl: 'p-8 m-6'
};
```

**Color System**:
```typescript
const courseColors = {
  nodejs: {
    primary: 'bg-green-500',
    light: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200'
  },
  python: {
    primary: 'bg-blue-500',
    light: 'bg-blue-100', 
    text: 'text-blue-700',
    border: 'border-blue-200'
  }
};
```

### Responsive Design
**Breakpoint Utilities**:
```typescript
const ResponsiveGrid = ({ children }) => (
  <div className="
    grid 
    grid-cols-1 
    md:grid-cols-2 
    lg:grid-cols-3 
    xl:grid-cols-4 
    gap-4
  ">
    {children}
  </div>
);
```

---

This component reference provides comprehensive documentation for all FlowMind components, including implementation details, best practices, and usage examples. Each component is designed to be maintainable, reusable, and performant.