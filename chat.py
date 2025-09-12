#!/usr/bin/env python3
"""
Minimal CLI Chat App using LangChain + Ollama
Streams responses from local Ollama models.
"""

import sys
import os
import signal
from typing import List, Dict, Any
import yaml
from pathlib import Path

from langchain.chat_models import init_chat_model
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage


class Config:
    """Configuration manager with YAML file and environment variable support."""
    
    def __init__(self, config_file: str = "config.yaml"):
        self.config = self._load_config(config_file)
    
    def _load_config(self, config_file: str) -> Dict[str, Any]:
        """Load configuration with environment variable overrides."""
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
        config_path = Path(config_file)
        if config_path.exists():
            try:
                with open(config_path, 'r') as f:
                    file_config = yaml.safe_load(f) or {}
                defaults.update(file_config)
            except Exception as e:
                print(f"Warning: Could not load {config_file}: {e}")
        
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
    
    def get(self, key: str, default=None):
        """Get configuration value."""
        return self.config.get(key, default)


class ChatApp:
    """Main chat application with streaming support."""
    
    def __init__(self, config: Config):
        self.config = config
        self.model = None
        self.history: List[BaseMessage] = []
        self._setup_signal_handlers()
        
    def _setup_signal_handlers(self):
        """Setup graceful shutdown on SIGINT/SIGTERM."""
        def signal_handler(signum, frame):
            print("\n\nBye!")
            sys.exit(0)
            
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    def _initialize_model(self):
        """Initialize the chat model with error handling."""
        try:
            print(f"Initializing model: {self.config.get('model_name')}...")
            
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
            
            # Initialize history with system message
            system_prompt = self.config.get("system_prompt")
            self.history = [SystemMessage(content=system_prompt)]
            
            print(f"✅ Model loaded: {self.config.get('model_name')}")
            print(f"🌐 Ollama URL: {self.config.get('base_url')}")
            print("Type '/exit', 'exit', or 'quit' to quit.\n")
            
        except Exception as e:
            self._handle_initialization_error(e)
    
    def _handle_initialization_error(self, error):
        """Handle model initialization errors with helpful messages."""
        error_str = str(error).lower()
        
        if "connection" in error_str or "refused" in error_str:
            print("❌ Cannot connect to Ollama server.")
            print("💡 Make sure Ollama is running: `ollama serve`")
            print(f"💡 Check if Ollama is accessible at: {self.config.get('base_url')}")
        elif "not found" in error_str or "unknown" in error_str:
            print(f"❌ Model '{self.config.get('model_name')}' not found.")
            print(f"💡 Pull the base model: `ollama run gemma3n:e4b`")
            print(f"💡 Create clean variant: `ollama create {self.config.get('model_name')} -f Modelfile`")
        else:
            print(f"❌ Failed to initialize model: {error}")
            print("💡 Check your Ollama installation and model availability.")
        
        sys.exit(1)
    
    def _manage_history(self):
        """Keep history within specified turn limit."""
        max_turns = self.config.get("history_turns")
        # Keep system message + last N turns (each turn = human + AI message)
        if len(self.history) > 1 + (max_turns * 2):
            # Keep system message and last N complete turns
            self.history = [self.history[0]] + self.history[-(max_turns * 2):]
    
    def _stream_response(self, messages: List[BaseMessage]) -> str:
        """Stream model response and return accumulated text."""
        print("Assistant: ", end="", flush=True)
        
        accumulated_text = []
        try:
            for chunk in self.model.stream(messages):
                content = getattr(chunk, "content", "") or ""
                if content:
                    sys.stdout.write(content)
                    sys.stdout.flush()
                    accumulated_text.append(content)
            
            print()  # Add newline after response
            return "".join(accumulated_text)
            
        except Exception as e:
            print(f"\n❌ Streaming error: {e}")
            # Fallback to non-streaming
            try:
                response = self.model.invoke(messages)
                content = getattr(response, "content", "")
                print(content)
                return content
            except Exception as e2:
                print(f"❌ Fallback failed: {e2}")
                return ""
    
    def _is_exit_command(self, user_input: str) -> bool:
        """Check if user wants to exit."""
        return user_input.lower().strip() in {"/exit", "exit", "quit", "/quit"}
    
    def run(self):
        """Main REPL loop."""
        self._initialize_model()
        
        while True:
            try:
                user_input = input("You: ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\n\nBye!")
                break
            
            # Handle exit commands
            if self._is_exit_command(user_input):
                print("Bye!")
                break
            
            # Skip empty inputs
            if not user_input:
                continue
            
            # Add user message to history
            self.history.append(HumanMessage(content=user_input))
            
            # Stream response
            response_text = self._stream_response(self.history)
            
            # Add AI response to history
            if response_text:
                self.history.append(AIMessage(content=response_text))
                self._manage_history()


def main():
    """Entry point for the chat application."""
    try:
        config = Config()
        app = ChatApp(config)
        app.run()
    except KeyboardInterrupt:
        print("\n\nBye!")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()