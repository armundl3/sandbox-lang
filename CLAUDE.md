# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a minimal CLI chat application using LangChain + Ollama for local LLM interactions. The app features streaming responses with chain-of-thought suppression, built using Python 3.11 and UV package management.

## Architecture

- **chat.py**: Main application file containing:
  - `Config` class: Handles YAML config loading with environment variable overrides
  - `ChatApp` class: Main REPL loop with streaming support and conversation history management
  - Integration with LangChain's `init_chat_model` for Ollama connectivity

- **config.yaml**: Default configuration with model settings, prompts, and parameters
- **Modelfile**: Ollama model template that creates `gemma3n-clean` variant with chain-of-thought suppression
- **pyproject.toml**: UV-based dependency management with LangChain ecosystem packages

## Development Commands

### Environment Setup
```bash
# Automated setup (installs prerequisites, models, dependencies)
./setup.sh

# Manual setup
uv sync                          # Install dependencies
ollama serve &                   # Start Ollama server
ollama pull gemma3n:e4b          # Download base model
ollama create gemma3n-clean -f Modelfile  # Create clean variant
```

### Running the Application
```bash
# Primary method
uv run python chat.py

# Alternative with virtual environment
source .venv/bin/activate && python chat.py
```

### Testing and Verification
```bash
# Test configuration loading
uv run python -c "import chat; config = chat.Config(); print(f'Model: {config.get(\"model_name\")}')"

# Check Ollama connectivity
curl -s http://localhost:11434/api/version

# Verify model availability
ollama list | grep gemma3n
```

## Key Implementation Details

### Configuration System
- Supports YAML file + environment variable overrides
- Environment variables: `MODEL_NAME`, `SYSTEM_PROMPT`, `OLLAMA_BASE_URL`, `STREAMING`, etc.
- Type conversion for boolean/numeric values

### Chain-of-Thought Suppression
- Custom system prompt in config.yaml explicitly forbids reasoning steps
- Modelfile parameters tuned to reduce reasoning artifacts
- Runtime filtering in `_stream_response()` method removes `<think>` blocks

### Conversation Management
- Maintains rolling history window (configurable via `history_turns`)
- Preserves system message while rotating user/assistant pairs
- Graceful error handling with fallback to non-streaming mode

### Dependencies
- LangChain core libraries for chat model abstraction
- PyYAML for configuration management
- No testing framework currently configured