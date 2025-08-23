// components/chat/types.ts
export interface SourceTimestamp {
  course: string;
  section: string;
  videoId: string;
  timestamp: string;
  relevance: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  sources?: SourceTimestamp[];
}

export interface Suggestion {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}

export type HealthStatus =
  | 'excellent'
  | 'good'
  | 'processing'
  | 'warning'
  | 'error';

export interface HealthConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
  glow: string;
  pulse: boolean;
}
