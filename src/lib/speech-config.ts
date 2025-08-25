export interface SpeechConfig {
  continuous: boolean
  interimResults: boolean
  language: string
  maxAlternatives: number
  autoStop: boolean
  autoStopTimeout: number // milliseconds
}

export const DEFAULT_SPEECH_CONFIG: SpeechConfig = {
  continuous: false,
  interimResults: true,
  language: 'en-US',
  maxAlternatives: 3, // Increased for better accuracy
  autoStop: true,
  autoStopTimeout: 15000 // Reduced to 15 seconds for better UX
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-MX', name: 'Spanish (Mexico)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'it-IT', name: 'Italian (Italy)' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
  { code: 'hi-IN', name: 'Hindi (India)' }
] as const

export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGES[number]['code']

// Browser compatibility check
export const checkSpeechRecognitionSupport = (): {
  supported: boolean
  browser: string
  recommendations: string[]
} => {
  const userAgent = navigator.userAgent
  const hasWebkitSpeechRecognition = 'webkitSpeechRecognition' in window
  const hasSpeechRecognition = 'SpeechRecognition' in window
  
  let browser = 'Unknown'
  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Edge')) browser = 'Edge'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Opera')) browser = 'Opera'
  
  const supported = hasWebkitSpeechRecognition || hasSpeechRecognition
  
  const recommendations = []
  if (!supported) {
    recommendations.push('Use Chrome or Edge for best speech recognition support')
    recommendations.push('Make sure your browser is up to date')
    recommendations.push('Check if microphone permissions are enabled')
  }
  
  if (browser === 'Firefox') {
    recommendations.push('Firefox has limited speech recognition support')
    recommendations.push('Consider using Chrome or Edge instead')
  }
  
  return {
    supported,
    browser,
    recommendations
  }
}