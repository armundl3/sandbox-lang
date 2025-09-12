import asyncio
import os
from typing import AsyncGenerator, Optional, List, Dict, Any
from langchain.chat_models import init_chat_model
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage
from sqlalchemy.orm import Session
from .models import Message, Conversation
from .database import get_db
import yaml
from pathlib import Path

class ChatService:
    def __init__(self):
        self.model = None
        self.config = self._load_config()
        self._initialize_model()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration with environment variable overrides - same logic as CLI."""
        # Default configuration
        defaults = {
            "model_name": "gemma:2b",
            "model_provider": "ollama", 
            "base_url": "http://localhost:11434",
            "keep_alive": -1,
            "streaming": True,
            "history_turns": 4,
            "timeout": 30,
            "system_prompt": "You are a helpful assistant. Reply to user queries in a clear and informative manner.",
            "temperature": 0.7,
            "max_tokens": 1024
        }
        
        # Load from YAML file if it exists
        config_path = Path("config.yaml")
        if config_path.exists():
            try:
                with open(config_path, 'r') as f:
                    file_config = yaml.safe_load(f) or {}
                defaults.update(file_config)
            except Exception as e:
                print(f"Warning: Could not load config.yaml: {e}")
        
        # Override with environment variables
        env_overrides = {
            "MODEL_NAME": "model_name",
            "SYSTEM_PROMPT": "system_prompt", 
            "OLLAMA_BASE_URL": "base_url",
            "STREAMING": "streaming",
            "HISTORY_TURNS": "history_turns",
            "TEMPERATURE": "temperature"
        }
        
        for env_var, config_key in env_overrides.items():
            if env_var in os.environ:
                value = os.environ[env_var]
                # Convert string values to appropriate types
                if config_key in ["streaming"]:
                    value = value.lower() in ("true", "1", "yes", "on")
                elif config_key in ["history_turns", "timeout", "max_tokens"]:
                    value = int(value)
                elif config_key in ["temperature"]:
                    value = float(value)
                defaults[config_key] = value
        
        return defaults
    
    def _initialize_model(self):
        """Initialize the chat model with error handling."""
        try:
            self.model = init_chat_model(
                self.config.get("model_name"),
                model_provider=self.config.get("model_provider"),
                base_url=self.config.get("base_url"),
                streaming=self.config.get("streaming"),
                keep_alive=self.config.get("keep_alive"),
                temperature=self.config.get("temperature"),
                max_tokens=self.config.get("max_tokens"),
                timeout=self.config.get("timeout")
            )
        except Exception as e:
            print(f"Failed to initialize model: {e}")
            raise e
    
    def _build_conversation_history(self, conversation_id: int, db: Session) -> List[BaseMessage]:
        """Build conversation history from database."""
        messages = [SystemMessage(content=self.config.get("system_prompt"))]
        
        if conversation_id:
            # Load conversation history
            history = db.query(Message).filter(
                Message.conversation_id == conversation_id
            ).order_by(Message.created_at.asc()).all()
            
            # Apply history limit (keep last N turns)
            max_turns = self.config.get("history_turns")
            if len(history) > max_turns * 2:
                history = history[-(max_turns * 2):]
            
            for msg in history:
                if msg.role == "user":
                    messages.append(HumanMessage(content=msg.content))
                else:
                    messages.append(AIMessage(content=msg.content))
        
        return messages
    
    def _generate_conversation_title(self, message: str) -> str:
        """Generate a conversation title from the first message."""
        # Simple title generation - use first few words
        words = message.strip().split()[:6]
        title = " ".join(words)
        if len(title) > 50:
            title = title[:47] + "..."
        return title or "New Conversation"
    
    def _save_messages(self, conversation_id: int, user_message: str, assistant_message: str, db: Session):
        """Save messages to database."""
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
        
        # Update conversation timestamp
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conversation:
            db.refresh(conversation)  # This triggers the onupdate for updated_at
        
        db.commit()
    
    async def stream_chat_response(
        self, 
        message: str, 
        conversation_id: Optional[int] = None
    ) -> AsyncGenerator[dict, None]:
        """Stream chat response with conversation context."""
        
        db = next(get_db())
        try:
            # Create new conversation if needed
            if not conversation_id:
                title = self._generate_conversation_title(message)
                new_conversation = Conversation(title=title)
                db.add(new_conversation)
                db.commit()
                db.refresh(new_conversation)
                conversation_id = new_conversation.id
                
                # Send conversation ID to client
                yield {"type": "conversation_id", "conversation_id": conversation_id}
            
            # Build message history
            messages = self._build_conversation_history(conversation_id, db)
            
            # Add current user message
            messages.append(HumanMessage(content=message))
            
            # Stream response
            accumulated_response = ""
            
            try:
                async for chunk in self.model.astream(messages):
                    content = getattr(chunk, "content", "") or ""
                    if content:
                        accumulated_response += content
                        yield {"type": "content", "content": content}
                
                # Send completion signal
                yield {"type": "done"}
                
                # Save to database
                self._save_messages(conversation_id, message, accumulated_response, db)
                
            except Exception as e:
                print(f"Streaming error: {e}")
                # Fallback to non-streaming
                try:
                    response = self.model.invoke(messages)
                    content = getattr(response, "content", "")
                    accumulated_response = content
                    yield {"type": "content", "content": content}
                    yield {"type": "done"}
                    
                    # Save to database
                    self._save_messages(conversation_id, message, accumulated_response, db)
                except Exception as e2:
                    yield {"type": "error", "error": str(e2)}
        
        finally:
            db.close()

# Global instance
chat_service = ChatService()