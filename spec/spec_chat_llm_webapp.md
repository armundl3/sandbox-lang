# spec_chat_llm_webapp.md — Web App Version (FastAPI + React + Ollama)

Building on the CLI chat app from `spec_chat_llm_workflow.md`, this specification extends it into a ChatGPT-like web application for local deployment.

---

## 1) Goal

Transform the existing CLI chat app into a **local web application** with a modern React frontend and FastAPI backend, maintaining the same chain-of-thought suppression and streaming capabilities while adding a ChatGPT-like interface.

---

## 2) Requirements

### Functional
- **Chat Interface**: Clean, responsive chat UI similar to ChatGPT
- **Real-time Streaming**: Server-sent events for token streaming
- **Chat History**: Persistent conversation history with sidebar navigation
- **Message Management**: Copy message buttons, message timestamps
- **Theme Support**: Dark/light mode toggle with persistence
- **Single User**: No authentication required for local usage

### Non-Functional
- **Local Deployment**: Runs entirely on localhost
- **Performance**: Fast initial load, smooth streaming experience
- **Responsive Design**: Works on desktop and tablet sizes
- **Accessibility**: Keyboard navigation, screen reader friendly

---

## 3) Technology Stack

### Backend: FastAPI + Python
- **FastAPI**: Async web framework for API endpoints
- **Server-Sent Events**: Real-time streaming without WebSocket complexity
- **SQLite**: Local conversation persistence
- **Existing Dependencies**: Reuse LangChain + Ollama integration

### Frontend: React + TypeScript
- **React 18**: Modern component-based UI
- **TypeScript**: Type safety and better DX
- **Tailwind CSS**: Rapid styling, consistent design system
- **Lucide React**: Clean, consistent icons
- **React Query**: Server state management and caching

### Development Tools
- **Vite**: Fast development server and build tool
- **Concurrent**: Run frontend + backend simultaneously
- **UV**: Continue using for Python dependency management

---

## 4) Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Local Development                        │
│                                                                 │
│  ┌─────────────────┐    HTTP/SSE    ┌──────────────────────┐   │
│  │   React App     │ ◄─────────────► │   FastAPI Server     │   │
│  │  (Port :3000)   │                 │   (Port :8000)       │   │
│  └─────────────────┘                 └──────────────────────┘   │
│           │                                    │                │
│           │                                    │ HTTP :11434    │
│           ▼                                    ▼                │
│  ┌─────────────────┐                 ┌──────────────────────┐   │
│  │   Local Storage │                 │   Ollama Server      │   │
│  │   (UI State)    │                 │   + Local Models     │   │
│  └─────────────────┘                 └──────────────────────┘   │
│                                                │                │
│                                                ▼                │
│                                       ┌──────────────────────┐   │
│                                       │   SQLite Database    │   │
│                                       │   (Chat History)     │   │
│                                       └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5) Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── models.py            # Pydantic models, SQLAlchemy schemas
│   │   ├── database.py          # SQLite connection and setup
│   │   ├── chat_service.py      # Chat logic (reuse from chat.py)
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── chat.py          # Chat endpoints
│   │       └── conversations.py # History management
│   ├── requirements.txt         # Additional web dependencies
│   └── alembic/                 # Database migrations (optional)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   └── Message.tsx
│   │   │   ├── Sidebar/
│   │   │   │   ├── ConversationSidebar.tsx
│   │   │   │   └── ConversationItem.tsx
│   │   │   └── UI/
│   │   │       ├── ThemeToggle.tsx
│   │   │       ├── CopyButton.tsx
│   │   │       └── LoadingSpinner.tsx
│   │   ├── hooks/
│   │   │   ├── useChat.ts       # Chat functionality
│   │   │   ├── useConversations.ts
│   │   │   └── useTheme.ts
│   │   ├── services/
│   │   │   └── api.ts           # API client
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript definitions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── index.html
│
├── chat.py                      # Original CLI app (keep for reference)
├── config.yaml                  # Shared configuration
├── pyproject.toml               # Updated with web dependencies
├── package.json                 # Root package.json for scripts
└── README_webapp.md             # Web app setup instructions
```

---

## 6) Backend Implementation

### FastAPI Application (`backend/app/main.py`)

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
import asyncio

from .database import init_db
from .routes import chat, conversations

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="Local LLM Chat",
    description="ChatGPT-like interface for local Ollama models",
    version="0.1.0",
    lifespan=lifespan
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(chat.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
```

### Database Models (`backend/app/models.py`)

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

Base = declarative_base()

# SQLAlchemy Models
class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, nullable=False, index=True)
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

# Pydantic Models
class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
```

### Chat Service (`backend/app/chat_service.py`)

```python
import asyncio
from typing import AsyncGenerator
from langchain.chat_models import init_chat_model
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from .models import Message, Conversation
from .database import get_db
import yaml
from pathlib import Path

class ChatService:
    def __init__(self):
        self.model = None
        self.config = self._load_config()
        self._initialize_model()
    
    def _load_config(self):
        # Reuse config loading from original chat.py
        config_path = Path("config.yaml")
        if config_path.exists():
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        return {}
    
    def _initialize_model(self):
        self.model = init_chat_model(
            self.config.get("model_name", "gemma3n-clean"),
            model_provider="ollama",
            base_url=self.config.get("base_url", "http://localhost:11434"),
            streaming=True,
            temperature=self.config.get("temperature", 0.7),
        )
    
    async def stream_chat_response(
        self, 
        message: str, 
        conversation_id: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """Stream chat response with conversation context"""
        
        # Build message history
        messages = [SystemMessage(content=self.config.get("system_prompt", "..."))]
        
        if conversation_id:
            # Load conversation history
            db = next(get_db())
            history = db.query(Message).filter(
                Message.conversation_id == conversation_id
            ).order_by(Message.created_at.desc()).limit(8).all()
            
            for msg in reversed(history):
                if msg.role == "user":
                    messages.append(HumanMessage(content=msg.content))
                else:
                    messages.append(AIMessage(content=msg.content))
        
        # Add current user message
        messages.append(HumanMessage(content=message))
        
        # Stream response
        accumulated_response = ""
        async for chunk in self.model.astream(messages):
            content = getattr(chunk, "content", "") or ""
            if content and not content.strip().startswith(("<think>", "</think>")):
                accumulated_response += content
                yield f"data: {content}\n\n"
        
        # Save to database
        if conversation_id:
            self._save_messages(conversation_id, message, accumulated_response)
        
        yield "data: [DONE]\n\n"
    
    def _save_messages(self, conversation_id: int, user_message: str, assistant_message: str):
        """Save messages to database"""
        db = next(get_db())
        
        # Save user message
        user_msg = Message(
            conversation_id=conversation_id,
            role="user", 
            content=user_message
        )
        db.add(user_msg)
        
        # Save assistant message
        assistant_msg = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_message
        )
        db.add(assistant_msg)
        
        db.commit()

# Global instance
chat_service = ChatService()
```

---

## 7) Frontend Implementation

### Main Chat Interface (`frontend/src/components/Chat/ChatInterface.tsx`)

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChat } from '../../hooks/useChat';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface ChatInterfaceProps {
  conversationId: number | null;
  onNewConversation: (id: number) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  onNewConversation
}) => {
  const { messages, sendMessage, isLoading } = useChat(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const newConversationId = await sendMessage(content);
    if (!conversationId && newConversationId) {
      onNewConversation(newConversationId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Start a conversation</h2>
              <p>Type a message below to begin chatting with your local AI model</p>
            </div>
          </div>
        ) : (
          <>
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <MessageInput 
          onSendMessage={handleSendMessage}
          disabled={isLoading}
        />
        {isLoading && (
          <div className="flex items-center justify-center mt-2">
            <LoadingSpinner />
            <span className="ml-2 text-sm text-gray-500">AI is thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
};
```

### Custom Hook for Chat Logic (`frontend/src/hooks/useChat.ts`)

```typescript
import { useState, useCallback } from 'react';
import { Message } from '../types';
import { apiClient } from '../services/api';

export const useChat = (conversationId: number | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string): Promise<number | null> => {
    setIsLoading(true);
    
    // Add user message immediately
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Stream response
      const response = await apiClient.streamChat({
        message: content,
        conversation_id: conversationId
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let newConversationId = conversationId;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            if (data.trim()) {
              setMessages(prev => {
                const updated = [...prev];
                const lastMessage = updated[updated.length - 1];
                if (lastMessage.role === 'assistant') {
                  lastMessage.content += data;
                }
                return updated;
              });
            }
          }
        }
      }

      return newConversationId;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  return { messages, sendMessage, isLoading };
};
```

---

## 8) Development Setup

### Root Package.json Scripts
```json
{
  "name": "local-llm-chat",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && uvicorn app.main:app --reload --port 8000",
    "dev:frontend": "cd frontend && npm run dev",
    "setup": "npm run setup:backend && npm run setup:frontend",
    "setup:backend": "cd backend && uv sync",
    "setup:frontend": "cd frontend && npm install",
    "build": "cd frontend && npm run build"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

### Quick Start Commands
```bash
# One-time setup
npm run setup                    # Install all dependencies
./setup.sh                       # Ensure Ollama models are ready

# Development
npm run dev                      # Start both frontend and backend
# Frontend: http://localhost:3000
# Backend: http://localhost:8000

# Individual services
npm run dev:frontend             # Just React app
npm run dev:backend              # Just FastAPI server
```

---

## 9) UI/UX Features

### Chat History Sidebar
- **Conversation List**: Chronological list with titles and timestamps
- **Auto-titling**: Generate conversation titles from first message
- **Search**: Filter conversations by content
- **Delete**: Remove conversations with confirmation

### Message Features
- **Copy Button**: One-click copy to clipboard for each message
- **Timestamps**: Show relative times (e.g., "2 minutes ago")
- **Markdown Support**: Render code blocks, links, formatting
- **Message Actions**: Copy, regenerate (future), edit (future)

### Theme Support
- **Dark/Light Toggle**: Persistent preference in localStorage
- **System Preference**: Detect and respect OS theme
- **Smooth Transitions**: CSS transitions for theme switching

### Responsive Design
- **Desktop First**: Optimized for desktop chat experience
- **Tablet Support**: Collapsible sidebar, touch-friendly
- **Mobile Considerations**: Stack layout, simplified navigation

---

## 10) Configuration Integration

### Shared Config Approach
- **Reuse config.yaml**: Backend reads same config as CLI app
- **Environment Variables**: Support same overrides as CLI
- **Runtime Config**: Expose select config to frontend via API

### Example Extended Config
```yaml
# Existing CLI config
model_name: "gemma3n-clean"
model_provider: "ollama"
base_url: "http://localhost:11434"
streaming: true
temperature: 0.7
system_prompt: |
  You are a concise assistant. Reply briefly and helpfully.
  Do NOT include chain-of-thought, reasoning steps, or <think> blocks.
  Only provide final answers directly.

# New web app config
web:
  frontend_url: "http://localhost:3000"
  backend_port: 8000
  cors_origins: ["http://localhost:3000"]
  
database:
  url: "sqlite:///./chat_history.db"
  
ui:
  default_theme: "system"  # "light", "dark", or "system"
  conversations_per_page: 50
  max_message_length: 4000
```

---

## 11) Deployment Considerations

### Local Development
- **Single Command Start**: `npm run dev` starts everything
- **Hot Reloading**: Both frontend and backend update on changes
- **Database**: SQLite file in project directory
- **Port Management**: Clear separation (3000, 8000, 11434)

### Production Build
- **Static Frontend**: Build React app to static files
- **Backend Serving**: FastAPI can serve static files
- **Single Port**: Optional unified deployment on one port
- **Environment**: Production config overrides

---

## 12) Testing Strategy

### Backend Testing
- **Unit Tests**: Chat service logic, database operations
- **Integration Tests**: API endpoints, SSE streaming
- **Configuration Tests**: Config loading, environment overrides

### Frontend Testing
- **Component Tests**: Individual UI components
- **Hook Tests**: Custom React hooks logic
- **E2E Tests**: Full chat flow, conversation management
- **Accessibility Tests**: Keyboard navigation, screen readers

### Manual Testing
- **Streaming**: Verify smooth token streaming
- **History**: Conversation persistence and loading
- **Theme**: Dark/light mode switching
- **Responsive**: Different screen sizes

---

## 13) Migration from CLI

### Preserving CLI Functionality
- **Keep chat.py**: Original CLI app remains functional
- **Shared Logic**: Extract common chat service logic
- **Config Compatibility**: Same configuration works for both

### Development Workflow
1. **Start with CLI**: Use existing chat.py for model testing
2. **Add Backend**: Build FastAPI wrapper around chat logic
3. **Build Frontend**: Create React interface
4. **Integrate**: Connect frontend to streaming backend
5. **Polish**: Add history, theming, UX improvements

---

## 14) Acceptance Criteria

- [ ] **Web Interface**: Clean, responsive chat UI at http://localhost:3000
- [ ] **Real-time Streaming**: Messages stream token-by-token like ChatGPT
- [ ] **Conversation History**: Persistent chat history with sidebar navigation
- [ ] **Theme Support**: Working dark/light mode toggle with persistence
- [ ] **Message Management**: Copy buttons work, timestamps display correctly
- [ ] **Model Integration**: Uses same Ollama models as CLI version
- [ ] **Chain-of-thought Suppression**: No `<think>` blocks in web responses
- [ ] **Development Experience**: Single command setup and dev server start
- [ ] **Performance**: Fast initial load, smooth streaming, responsive UI
- [ ] **Error Handling**: Graceful handling of Ollama connection issues

---

## 15) Future Enhancements

### Phase 2 Features
- **Message Editing**: Edit and resend messages
- **Response Regeneration**: Retry last assistant response
- **Export Conversations**: Download as markdown or text
- **Model Switching**: Change models without restart

### Advanced Features
- **Multi-user Support**: Authentication and user isolation
- **Cloud Deployment**: Docker containers, cloud hosting
- **Plugin System**: Extensible functionality
- **Mobile App**: React Native or PWA version

---

This specification provides a complete roadmap for transforming the CLI chat app into a modern web application while maintaining all the core functionality and extending it with a professional chat interface.