# CLI Chat App - Minimal LangChain + Ollama + UV

A minimal, local-only CLI chatbot that streams responses from Ollama models with chain-of-thought suppression. Built with Python 3.11, LangChain, and UV for modern package management.

## Quick Start

```bash
# Automated setup (recommended)
./setup.sh

# Then run the chat app
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
ollama pull gemma3n:e4b && ollama create gemma3n-clean -f Modelfile

# 3. Run the chat app
uv run python chat.py
```

That's it! Type your messages and get streaming responses. Use `/exit` to quit.

## Features

- 🚀 **Automated Setup**: One command setup with `./setup.sh`
- 🐍 **Python 3.11**: Managed with pyenv for consistency
- 🔄 **Token Streaming**: Real-time response streaming to console
- 🧠 **Chain-of-Thought Suppression**: Clean outputs without reasoning artifacts
- ⚙️ **Flexible Configuration**: YAML config + environment variable overrides
- 🔌 **Local-Only**: Fully offline operation after initial model pull
- 🛡️ **Robust Error Handling**: Helpful error messages and graceful failures

## Usage Examples

### Method 1: Direct Execution (Recommended)
```bash
uv run python chat.py
```

### Method 2: Virtual Environment
```bash
source .venv/bin/activate
python chat.py
deactivate
```

**Example Session:**
```
$ uv run python chat.py
Initializing model: gemma3n-clean...
✅ Model loaded: gemma3n-clean
🌐 Ollama URL: http://localhost:11434
Type '/exit', 'exit', or 'quit' to quit.

You: What's the capital of France?
Assistant: Paris.

You: Think step by step: What is 2+2?
Assistant: 4.

You: /exit
Bye!
```

**Notice:** No `<think>` blocks appear, demonstrating effective chain-of-thought suppression.

## Configuration

Basic configuration via `config.yaml` and environment variables:

```bash
export MODEL_NAME="gemma3n:e4b"
export TEMPERATURE=0.5
export STREAMING=true
```

## Troubleshooting

**❌ Setup script issues**: Make sure you have Homebrew installed first
**❌ Model not found**: Run `./setup.sh` again to download models  
**❌ Python version**: The script will install Python 3.11.10 automatically

For common issues and solutions, run:
```bash
curl -s http://localhost:11434/api/version  # Check Ollama
python --version                            # Check Python version
uv --version                                # Check UV installation
```

## Documentation

- **Quick Start**: This README
- **Comprehensive Guide**: [spec/spec_README.md](spec/spec_README.md)
- **Technical Specification**: [spec/spec_chat_llm_workflow.md](spec/spec_chat_llm_workflow.md)
