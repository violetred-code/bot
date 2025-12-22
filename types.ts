
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type AppPhase = 'waiting' | 'intro' | 'chatting';
export type BotState = 'idle' | 'thinking' | 'speaking';
