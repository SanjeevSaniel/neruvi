# Speech-to-Text Integration Guide

This guide shows how to easily add or remove speech-to-text functionality from FlowMind components.

## 🚀 Quick Integration

### 1. Add Speech Recognition to Any Input Component

```tsx
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import SpeechRecognitionButton from '@/components/ui/SpeechRecognitionButton'
import SpeechStatus from '@/components/ui/SpeechStatus'

function MyInputComponent() {
  const [inputValue, setInputValue] = useState('')
  const [showSpeechError, setShowSpeechError] = useState(false)
  
  const {
    transcript,
    isListening,
    hasRecognitionSupport,
    startListening,
    stopListening,
    resetTranscript,
    error
  } = useSpeechRecognition({
    language: 'en-US',
    continuous: false,
    interimResults: true
  })

  // Handle transcript updates
  useEffect(() => {
    if (transcript && transcript.trim()) {
      setInputValue(prev => prev + transcript)
      if (!isListening) {
        resetTranscript()
      }
    }
  }, [transcript, isListening, resetTranscript])

  // Handle errors
  useEffect(() => {
    if (error) {
      setShowSpeechError(true)
      setTimeout(() => setShowSpeechError(false), 3000)
    }
  }, [error])

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isListening ? "Listening..." : "Type or speak..."}
          disabled={isListening}
          className={isListening ? "animate-pulse" : ""}
        />
        
        <SpeechRecognitionButton
          isListening={isListening}
          isDisabled={isProcessing} // Disable during AI processing
          hasSupport={hasRecognitionSupport}
          onClick={handleMicClick}
          size="md"
          isProcessing={isProcessing} // Shows processing-specific tooltip
        />
      </div>
      
      <SpeechStatus
        isListening={isListening}
        error={error}
        hasSupport={hasRecognitionSupport}
        showError={showSpeechError}
      />
    </div>
  )
}
```

### 2. Configuration Options

```tsx
// Basic configuration
const speechOptions = {
  language: 'en-US',
  continuous: false,
  interimResults: true,
  autoStop: true,
  autoStopTimeout: 30000
}

// Multi-language support
const languages = [
  'en-US', 'es-ES', 'fr-FR', 'de-DE', 
  'ja-JP', 'zh-CN', 'ar-SA', 'hi-IN'
]
```

## 📦 Component Architecture

### Core Files

```
src/
├── hooks/
│   └── useSpeechRecognition.ts     # Main speech hook
├── components/ui/
│   ├── SpeechRecognitionButton.tsx # Microphone button
│   └── SpeechStatus.tsx            # Status/error display
├── lib/
│   └── speech-config.ts            # Configuration & utils
└── types/
    └── speech.d.ts                 # TypeScript definitions
```

### Component Props

#### `SpeechRecognitionButton`
```tsx
interface SpeechRecognitionButtonProps {
  isListening: boolean
  isDisabled?: boolean
  hasSupport: boolean
  onClick: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'danger' | 'ghost'
}
```

#### `SpeechStatus`
```tsx
interface SpeechStatusProps {
  isListening: boolean
  error: string | null
  hasSupport: boolean
  showError: boolean
  position?: 'top' | 'bottom'
  className?: string
}
```

#### `useSpeechRecognition` Hook
```tsx
interface SpeechRecognitionOptions {
  continuous?: boolean
  interimResults?: boolean
  language?: string
  autoStop?: boolean
  autoStopTimeout?: number
}

// Returns:
{
  transcript: string
  isListening: boolean
  hasRecognitionSupport: boolean
  browserSupport: BrowserSupport
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  error: string | null
  config: SpeechConfig
}
```

## 🔧 Easy Removal

To completely remove speech-to-text functionality:

### 1. Remove Files
```bash
# Delete speech-related files
rm src/hooks/useSpeechRecognition.ts
rm src/components/ui/SpeechRecognitionButton.tsx
rm src/components/ui/SpeechStatus.tsx
rm src/lib/speech-config.ts
rm src/types/speech.d.ts
rm src/components/examples/SpeechToTextDemo.tsx
```

### 2. Clean Up ChatInput Component
```tsx
// Remove these imports
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import SpeechRecognitionButton from '@/components/ui/SpeechRecognitionButton'
import SpeechStatus from '@/components/ui/SpeechStatus'

// Remove speech-related state and effects
const [showSpeechError, setShowSpeechError] = useState(false) // REMOVE
const { transcript, isListening, ... } = useSpeechRecognition(...) // REMOVE

// Remove speech-related useEffect hooks
useEffect(() => { ... }, [transcript, isListening, ...]) // REMOVE
useEffect(() => { ... }, [speechError]) // REMOVE

// Remove microphone button
<SpeechRecognitionButton ... /> // REMOVE

// Remove speech status
<SpeechStatus ... /> // REMOVE

// Clean up textarea props
placeholder={placeholder} // Remove conditional listening text
disabled={disabled} // Remove isListening condition
className="..." // Remove animate-pulse condition
```

### 3. Remove Test Page (Optional)
```bash
rm src/app/speech-test/page.tsx
```

## 🎛️ Feature Toggles

For easier management, you can create a feature toggle system:

### 1. Create Feature Config
```tsx
// src/lib/features.ts
export const FEATURES = {
  SPEECH_TO_TEXT: true, // Set to false to disable
  // Add other features here
} as const

export const isFeatureEnabled = (feature: keyof typeof FEATURES): boolean => {
  return FEATURES[feature] && typeof window !== 'undefined'
}
```

### 2. Conditional Rendering
```tsx
import { isFeatureEnabled } from '@/lib/features'

function ChatInput(props) {
  const speechEnabled = isFeatureEnabled('SPEECH_TO_TEXT')
  
  return (
    <div className="flex">
      <textarea {...textareaProps} />
      
      {speechEnabled && (
        <SpeechRecognitionButton {...speechProps} />
      )}
      
      <button type="submit">Send</button>
    </div>
  )
}
```

## 🌐 Browser Compatibility

### Supported Browsers
- ✅ Chrome/Chromium (Best support)
- ✅ Edge (Good support)
- ⚠️ Safari (Limited support)
- ❌ Firefox (No support)

### Fallback Handling
```tsx
const { browserSupport } = useSpeechRecognition()

if (!browserSupport.supported) {
  // Show message or hide speech features
  return <div>Speech recognition not supported</div>
}
```

## 🔐 Permissions

### Microphone Permission Handling
```tsx
// The hook automatically handles permission requests
// User will see browser permission prompt on first use
// Handle permission errors in the error callback

useEffect(() => {
  if (error === 'not-allowed') {
    // Show instructions to enable microphone
    setShowPermissionHelp(true)
  }
}, [error])
```

## 🚦 Testing

### Test the Implementation
1. Visit `/speech-test` for full demo
2. Test in different browsers
3. Test with/without microphone
4. Test permission scenarios
5. Test error handling

### Manual Testing Checklist
- [ ] Microphone button appears
- [ ] Click starts/stops recording
- [ ] Visual feedback during recording
- [ ] Transcript appears in input
- [ ] Error messages display correctly
- [ ] Works across different browsers
- [ ] Handles permission denial gracefully
- [ ] Auto-stop functionality works
- [ ] Multiple language support

## 📱 Mobile Considerations

### iOS Safari
- Requires user interaction to start
- May have intermittent support
- Test thoroughly on actual devices

### Android Chrome
- Generally good support
- Test with different Android versions
- Consider touch vs. click events

## 🔄 Updates & Maintenance

### Regular Updates
1. Monitor browser API changes
2. Update supported language list
3. Test with new browser versions
4. Update TypeScript definitions as needed

### Performance Monitoring
- Monitor speech recognition accuracy
- Track error rates by browser
- Monitor API usage if using external services

---

## 📚 Additional Resources

- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Browser Compatibility Table](https://caniuse.com/speech-recognition)
- [Speech Recognition Best Practices](https://web.dev/speech-recognition/)

This modular implementation makes it easy to:
- ✅ Add speech functionality to any input
- ✅ Remove completely when not needed
- ✅ Configure for different use cases
- ✅ Handle errors gracefully
- ✅ Support multiple languages
- ✅ Test thoroughly