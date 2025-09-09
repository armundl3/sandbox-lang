# CLI Chat App - Comprehensive Documentation

A minimal, local-only CLI chatbot that streams responses from Ollama models with chain-of-thought suppression. Built with Python, LangChain, and UV for modern package management.

## System Architecture

```
+-------------------------------------------------------------------+
|                          Development Machine                       |
|                                                                   |
|  ┌─────────────────┐     HTTP :11434      ┌─────────────────────┐ |
|  │   chat.py       │◄─────────────────────►│   Ollama Server     │ |
|  │                 │                       │                     │ |
|  │ ┌─────────────┐ │   POST /api/chat      │ ┌─────────────────┐ │ |
|  │ │ Config      │ │   (JSON/SSE)          │ │ Model Engine    │ │ |
|  │ │ ├─YAML      │ │                       │ │ ├─Template      │ │ |
|  │ │ └─Env Vars  │ │                       │ │ └─Parameters    │ │ |
|  │ └─────────────┘ │                       │ └─────────────────┘ │ |
|  │                 │                       │                     │ |
|  │ ┌─────────────┐ │   Token Stream        │ ┌─────────────────┐ │ |
|  │ │ LangChain   │ │◄──────────────────────┤ │ gemma3n:e4b     │ │ |
|  │ │ ChatModel   │ │                       │ │ (Local Weights) │ │ |
|  │ └─────────────┘ │                       │ └─────────────────┘ │ |
|  └─────────────────┘                       └─────────────────────┘ |
|           │                                                       |
|           ▼                                                       |
|  ┌─────────────────┐                                              |
|  │ Terminal REPL   │ ◄─── User Input/Output                       |
|  │ └─Streaming     │                                              |
|  └─────────────────┘                                              |
+-------------------------------------------------------------------+
```

## Features

- 🚀 **Modern Package Management**: UV for fast, reliable dependency management
- 🔄 **Token Streaming**: Real-time response streaming to console
- 🧠 **Chain-of-Thought Suppression**: Clean outputs without reasoning artifacts
- ⚙️ **Flexible Configuration**: YAML config + environment variable overrides
- 🔌 **Local-Only**: Fully offline operation after initial model pull
- 🛡️ **Robust Error Handling**: Helpful error messages and graceful failures
- 📦 **Zero-Setup Execution**: Run without installing dependencies via `uv run`

## Manual Installation Guide

### Step 1: Install Prerequisites

**Python 3.11 (via pyenv)**
```bash
# Install pyenv for Python version management
brew install pyenv

# Add pyenv to your shell profile
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(pyenv init -)"' >> ~/.zshrc

# Restart your shell or reload the profile
source ~/.zshrc

# Install and set Python 3.11.10
pyenv install 3.11.10
pyenv local 3.11.10

# Verify installation
python --version  # Should show Python 3.11.10
```

**UV Package Manager**
```bash
# Install UV via curl
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or via Homebrew
brew install uv

# Verify installation
uv --version
```

**Ollama**
```bash
# Install via Homebrew
brew install ollama
```

### Step 2: Project Setup

```bash
# Clone the repository
git clone https://github.com/your_username/sandbox-lang.git
cd sandbox-lang

# Install project dependencies
uv sync

# Verify installation
uv run python -c "import chat; print('✅ Setup complete!')"
```

### Step 3: Ollama Model Setup

```bash
# Terminal 1: Start Ollama server
ollama serve

# Terminal 2: Pull and set up the model
ollama pull gemma3n:e4b                      # Download base model (~2.6GB)
ollama create gemma3n-clean -f Modelfile     # Create clean template variant
ollama list                                  # Verify both models exist
```

## Usage Examples

### Method 1: Direct Execution (Recommended)
```bash
# Run without installing dependencies locally
uv run python chat.py
```

### Method 2: Virtual Environment
```bash
# Activate UV-managed environment
source .venv/bin/activate
python chat.py

# Deactivate when done
deactivate
```

### Method 3: Development Mode
```bash
# Install in editable mode for development
uv pip install -e .
chat  # Uses project.scripts entry point
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

You: Explain quantum computing in simple terms
Assistant: Quantum computing uses quantum bits (qubits) that can exist in multiple states simultaneously, unlike classical bits that are either 0 or 1. This allows quantum computers to process many possibilities at once, potentially solving certain problems much faster than traditional computers.

You: Think step by step: What is 2+2?
Assistant: 4.

You: /exit
Bye!
```

**Notice:** No `<think>` blocks appear even when prompted for step-by-step reasoning, demonstrating effective chain-of-thought suppression.

## Configuration

### YAML Configuration (`config.yaml`)

```yaml
model_name: "gemma3n-clean"
model_provider: "ollama"
base_url: "http://localhost:11434"
keep_alive: -1
streaming: true
history_turns: 4
timeout: 30
temperature: 0.7
max_tokens: 1024
system_prompt: |
  You are a concise assistant. Reply briefly and helpfully.
  Do NOT include chain-of-thought, reasoning steps, or <think> blocks.
  Only provide final answers directly.
```

### Environment Variables

Override any config setting with environment variables:

```bash
export MODEL_NAME="gemma3n:e4b"
export SYSTEM_PROMPT="You are a helpful coding assistant."
export STREAMING=true
export HISTORY_TURNS=6
export TEMPERATURE=0.5
```

## Advanced Usage

### Custom Models

To use a different model:

1. **Pull the model:**
   ```bash
   ollama run llama3.2:3b-instruct
   ```

2. **Update config:**
   ```yaml
   model_name: "llama3.2:3b-instruct"
   ```

3. **Or use environment variable:**
   ```bash
   export MODEL_NAME="llama3.2:3b-instruct"
   ```

### Chain-of-Thought Suppression

The included `Modelfile` creates a clean template variant that prevents reasoning leakage:

```dockerfile
# Modelfile for gemma3n-clean
FROM gemma3n:e4b

# Clean template that prevents chain-of-thought leakage
TEMPLATE """{{ .System }}

{{ .Prompt }}"""

# Parameters to reduce reasoning artifacts
PARAMETER temperature 0.7
PARAMETER top_k 40
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1
PARAMETER num_predict 1024

# System message to enforce direct responses
SYSTEM """You are a helpful assistant. Respond directly and concisely without showing your reasoning process. Do not include <think> tags, reasoning steps, or explanations of your thought process. Only provide the final answer."""
```

**Key Benefits:**
- ✅ Eliminates `<think>...</think>` blocks
- ✅ Reduces verbose reasoning explanations
- ✅ Maintains answer quality while improving conciseness
- ✅ Provides consistent, deterministic output format

## Troubleshooting

### Common Issues

**❌ Cannot connect to Ollama server**
```bash
# Make sure Ollama is running
ollama serve

# Check if accessible
curl http://localhost:11434/api/version
```

**❌ Model not found**
```bash
# Pull the base model first
ollama run gemma3n:e4b

# Create the clean variant
ollama create gemma3n-clean -f Modelfile

# List available models
ollama list
```

**❌ UV not found**
```bash
# Install UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or use pip
pip install uv
```

**❌ Python version issues**
```bash
# Check current Python version
python --version

# If not 3.11.x, reinstall with pyenv
pyenv install 3.11.10
pyenv local 3.11.10
```

### Performance Tips

- **Keep models loaded**: Set `keep_alive: -1` to avoid reload delays
- **Adjust history**: Reduce `history_turns` for lower memory usage
- **Optimize streaming**: Disable with `streaming: false` if experiencing issues

## Project Structure

```
sandbox-lang/
├── chat.py                      # 🎯 Main CLI application
│   ├── Config class             #    YAML + env var management
│   ├── ChatApp class            #    REPL loop with streaming
│   └── Error handling           #    Ollama connection management
│
├── config.yaml                  # ⚙️  Configuration file
│   ├── Model settings           #    gemma3n-clean, temperature, etc.
│   ├── Ollama connection        #    base_url, timeout, keep_alive
│   └── System prompt            #    Chain-of-thought suppression
│
├── Modelfile                    # 🧠 Clean template definition
│   ├── FROM gemma3n:e4b         #    Base model reference
│   ├── TEMPLATE                 #    Suppresses <think> blocks
│   └── PARAMETERS               #    Temperature, top_k, top_p
│
├── pyproject.toml              # 📦 UV project configuration
│   ├── Dependencies             #    langchain, pyyaml, etc.
│   ├── Python version           #    >=3.11 requirement
│   └── Build system             #    hatchling backend
│
├── setup.sh                    # 🚀 Automated setup script
├── setup_env.sh                # 🐍 Legacy venv setup (optional)
├── langchain-chatbot-simple.ipynb # 📓 Legacy Jupyter demo
└── README.md                   # 📚 Quick start documentation
```

### Key Components

**Configuration System:**
- `config.yaml` → Default settings
- Environment variables → Runtime overrides
- Command-line friendly with helpful error messages

**Model Management:**
- `gemma3n:e4b` → Base model (2.6GB download)
- `gemma3n-clean` → Template variant (suppresses reasoning)
- Configurable parameters (temperature, max_tokens, etc.)

**Streaming Architecture:**
- LangChain ChatModel → Ollama HTTP API
- Server-Sent Events (SSE) → Real-time token streaming
- Chain-of-thought filtering → Clean output surface

## Testing & Verification

### Basic Smoke Tests

```bash
# Test 1: Configuration loading (with pyenv Python 3.11)
python -c "
import chat
config = chat.Config()
print('✅ Configuration loads successfully')
print(f'Python version: {__import__('sys').version}')
print(f'Model: {config.get(\"model_name\")}')
print(f'Provider: {config.get(\"model_provider\")}')
print(f'Base URL: {config.get(\"base_url\")}')
"

# Test 2: Ollama connectivity
curl -s http://localhost:11434/api/version || echo "❌ Ollama not running"

# Test 3: Model availability
ollama list | grep -E "(gemma3n:e4b|gemma3n-clean)" || echo "❌ Models not found"

# Test 4: Chain-of-thought suppression
uv run python chat.py <<EOF
Think step by step: What is 2+2?
/exit
EOF
# Expected: Should NOT show <think> blocks
```

### Integration Testing

```bash
# Test different execution methods
uv run python chat.py &
PID=$!
sleep 2
echo "/exit" | nc localhost 12345 2>/dev/null || kill $PID

# Test configuration overrides
MODEL_NAME="gemma3n:e4b" STREAMING=false uv run python chat.py <<EOF
Hello
/exit
EOF

# Test error handling (with Ollama stopped)
pkill ollama
uv run python chat.py  # Should show helpful error message
```

## Migration & Compatibility

### From Legacy Setup

If migrating from the legacy setup:

```bash
# Remove old virtual environment
rm -rf venv_sandbox_lang/

# Install pyenv and Python 3.11
brew install pyenv
pyenv install 3.11.10
pyenv local 3.11.10

# Install UV and sync dependencies
curl -LsSf https://astral.sh/uv/install.sh | sh
uv sync

# Update model references
ollama pull gemma3n:e4b
ollama create gemma3n-clean -f Modelfile
```

### Jupyter Notebook (Legacy)

The repository includes a legacy Jupyter notebook (`langchain-chatbot-simple.ipynb`) for educational purposes. It demonstrates:
- Basic LangChain model initialization
- Simple invoke() vs stream() patterns
- Chain-of-thought issues (which our CLI app solves)

**Note:** The CLI app is the recommended approach for production use due to better error handling, configuration management, and chain-of-thought suppression.

### Alternative Package Managers

While UV is recommended, you can also use:

```bash
# Using pip (ensure Python 3.11)
pip install langchain langchain-core langchain-community pyyaml
python chat.py

# Using conda
conda install -c conda-forge langchain pyyaml
python chat.py

# Using poetry
poetry install
poetry run python chat.py
```

However, UV provides the fastest and most reliable dependency resolution.

## Development

### Setting up Development Environment

```bash
# Clone and set up for development
git clone https://github.com/your_username/sandbox-lang.git
cd sandbox-lang

# Use automated setup
./setup.sh

# Or manual setup
pyenv local 3.11.10
uv sync
ollama serve &
ollama pull gemma3n:e4b
ollama create gemma3n-clean -f Modelfile
```

### Code Structure

The main application (`chat.py`) is organized into:

- **Config class**: Handles YAML and environment variable configuration
- **ChatApp class**: Manages the REPL loop, streaming, and history
- **Error handling**: Provides helpful messages for common issues
- **Signal handlers**: Graceful shutdown on interrupts

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with the automated setup script
5. Submit a pull request

## Specification Compliance

This implementation follows the specification in `spec/spec_chat_llm_workflow.md` which defines:
- Model selection and template requirements
- Chain-of-thought suppression strategies
- Configuration management
- Error handling patterns
- Testing requirements

For the complete technical specification, see `spec/spec_chat_llm_workflow.md`.