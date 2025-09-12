# Local LLM Chat - CLI + Web App

A minimal, local-only chat application with both CLI and web interfaces that streams responses from Ollama models. Built with Python 3.11, LangChain, FastAPI, React, and UV for modern package management.

## Quick Start

### Option 1: Web App (ChatGPT-like Interface)

```bash
# Automated setup (recommended)
./setup.sh

# Install web dependencies
npm run setup

# Start both backend and frontend
npm run dev
```

Visit **http://localhost:3000** for the web interface.

### Option 2: CLI App (Terminal Interface)

```bash
# Automated setup (recommended)
./setup.sh

# Run the CLI chat app
uv run python chat.py
```

**Alternative manual setup:**
```bash
# 1. Install prerequisites and Python 3.11
brew install pyenv ollama uv
pyenv install 3.11.10 && pyenv local 3.11.10

# 2. Setup dependencies and models
uv sync
ollama serve &
ollama pull gemma:2b

# 3. Run the chat app
uv run python chat.py
```

That's it! Type your messages and get streaming responses. Use `/exit` to quit.

## Features

### Web App Features
- 🌐 **ChatGPT-like Interface**: Modern, responsive web UI at http://localhost:3000
- 🔄 **Real-time Streaming**: Server-sent events for token-by-token streaming
- 💬 **Conversation History**: Persistent chat history with sidebar navigation
- 🌙 **Dark/Light Mode**: Theme toggle with system preference support
- 📱 **Responsive Design**: Works on desktop and tablet
- 📋 **Copy Messages**: One-click copy to clipboard
- 🗑️ **Delete Conversations**: Manage your chat history

### CLI Features  
- 🚀 **Automated Setup**: One command setup with `./setup.sh`
- 🐍 **Python 3.11**: Managed with pyenv for consistency
- 🔄 **Token Streaming**: Real-time response streaming to console
- 🧠 **Natural Responses**: Direct model outputs
- ⚙️ **Flexible Configuration**: YAML config + environment variable overrides
- 🔌 **Local-Only**: Fully offline operation after initial model pull
- 🛡️ **Robust Error Handling**: Helpful error messages and graceful failures

## Usage Examples

### Web App Usage
```bash
# Start the development servers
npm run dev

# Visit http://localhost:3000 in your browser
# - Chat in real-time with streaming responses
# - View conversation history in the sidebar
# - Toggle between dark and light themes
# - Copy messages with one click
```

### CLI Usage

#### Method 1: Direct Execution (Recommended)
```bash
uv run python chat.py
```

#### Method 2: Virtual Environment
```bash
source .venv/bin/activate
python chat.py
deactivate
```

**Example CLI Session:**
```
$ uv run python chat.py
Initializing model: gemma:2b...
✅ Model loaded: gemma:2b
🌐 Ollama URL: http://localhost:11434
Type '/exit', 'exit', or 'quit' to quit.

You: What's the capital of France?
Assistant: Paris.

You: What is 2+2?
Assistant: 4.

You: /exit
Bye!
```

## Development Scripts

```bash
# Setup (one-time)
npm run setup              # Install all dependencies
npm run setup:backend      # Install Python dependencies only 
npm run setup:frontend     # Install Node.js dependencies only

# Development
npm run dev                # Start both frontend and backend
npm run dev:frontend       # Start React app only (port 3000)
npm run dev:backend        # Start FastAPI server only (port 8000)

# Building
npm run build              # Build frontend for production
npm run lint               # Lint frontend code

# Individual tools
uv run python chat.py      # CLI app
cd frontend && npm run dev  # Frontend dev server
cd backend && uv run uvicorn app.main:app --reload  # Backend dev server
```

## Configuration

Basic configuration via `config.yaml` and environment variables:

```bash
export MODEL_NAME="gemma:2b"
export TEMPERATURE=0.5
export STREAMING=true
```

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS (port 3000)
- **Backend**: FastAPI + Python (port 8000)  
- **Database**: SQLite for conversation history
- **LLM**: Ollama local models (port 11434)
- **Streaming**: Server-Sent Events for real-time responses

## Troubleshooting

### General Issues
**❌ Setup script issues**: Make sure you have Homebrew installed first  
**❌ Model not found**: Run `./setup.sh` again to download models  
**❌ Python version**: The script will install Python 3.11.10 automatically

### Web App Issues
**❌ Port conflicts**: Make sure ports 3000 and 8000 are available  
**❌ Frontend won't start**: Run `npm run setup:frontend` to install dependencies  
**❌ Backend won't start**: Run `npm run setup:backend` to install Python dependencies  
**❌ Can't connect to API**: Check that the backend is running on port 8000

For common issues and solutions, run:
```bash
curl -s http://localhost:11434/api/version  # Check Ollama
curl -s http://localhost:8000/api/health    # Check backend API  
python --version                            # Check Python version
uv --version                                # Check UV installation
node --version                              # Check Node.js version
```

## Documentation

- **Quick Start**: This README
- **Web App Specification**: [spec/spec_chat_llm_webapp.md](spec/spec_chat_llm_webapp.md)  
- **CLI Specification**: [spec/spec_chat_llm_workflow.md](spec/spec_chat_llm_workflow.md)
- **Comprehensive Guide**: [spec/spec_README.md](spec/spec_README.md)
