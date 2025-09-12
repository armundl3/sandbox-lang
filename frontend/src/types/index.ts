export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface ChatRequest {
  message: string;
  conversation_id?: number;
}

export interface StreamChunk {
  type: 'content' | 'done' | 'error' | 'conversation_id';
  content?: string;
  error?: string;
  conversation_id?: number;
}