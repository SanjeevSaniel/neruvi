export type CopilotRole = 'user' | 'assistant';

export interface CopilotMessageType {
  id: string;
  role: CopilotRole;
  content: string;
  timestamp?: Date;
}
