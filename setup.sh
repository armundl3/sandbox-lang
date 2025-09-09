#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PYTHON_VERSION="3.11.10"
OLLAMA_MODEL="gemma3n:e4b"
CLEAN_MODEL="gemma3n-clean"
OLLAMA_PORT="11434"

echo -e "${BLUE}🚀 Setting up CLI Chat App Environment${NC}"
echo "================================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Ollama is running
ollama_running() {
    curl -s "http://localhost:${OLLAMA_PORT}/api/version" >/dev/null 2>&1
}

# Function to check if model exists
model_exists() {
    ollama list | grep -q "$1" 2>/dev/null
}

# Step 1: Check and install prerequisites
echo -e "\n${YELLOW}📦 Checking Prerequisites${NC}"

# Check Homebrew
if ! command_exists brew; then
    echo -e "${RED}❌ Homebrew not found. Please install from https://brew.sh${NC}"
    exit 1
fi
echo "✅ Homebrew installed"

# Check and install pyenv
if ! command_exists pyenv; then
    echo "⏳ Installing pyenv..."
    brew install pyenv
    echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
    echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
    echo 'eval "$(pyenv init -)"' >> ~/.zshrc
    export PYENV_ROOT="$HOME/.pyenv"
    export PATH="$PYENV_ROOT/bin:$PATH"
    eval "$(pyenv init -)"
fi
echo "✅ pyenv installed"

# Check and install Ollama
if ! command_exists ollama; then
    echo "⏳ Installing Ollama..."
    brew install ollama
fi
echo "✅ Ollama installed"

# Check and install UV
if ! command_exists uv; then
    echo "⏳ Installing UV package manager..."
    brew install uv
fi
echo "✅ UV package manager installed"

# Step 2: Python version management
echo -e "\n${YELLOW}🐍 Setting up Python ${PYTHON_VERSION}${NC}"

# Install Python version if needed
if ! pyenv versions | grep -q "${PYTHON_VERSION}"; then
    echo "⏳ Installing Python ${PYTHON_VERSION}..."
    pyenv install "${PYTHON_VERSION}"
fi
echo "✅ Python ${PYTHON_VERSION} available"

# Set local Python version
echo "⏳ Setting local Python version..."
pyenv local "${PYTHON_VERSION}"
echo "✅ Local Python version set to ${PYTHON_VERSION}"

# Step 3: Ollama server management
echo -e "\n${YELLOW}🧠 Managing Ollama Server${NC}"

# Check if Ollama is running
if ! ollama_running; then
    echo "⏳ Starting Ollama server in background..."
    nohup ollama serve >/dev/null 2>&1 &
    sleep 3
    
    # Wait for server to be ready
    for i in {1..10}; do
        if ollama_running; then
            break
        fi
        echo "⏳ Waiting for Ollama server to start... (${i}/10)"
        sleep 2
    done
    
    if ! ollama_running; then
        echo -e "${RED}❌ Failed to start Ollama server${NC}"
        echo "Please run 'ollama serve' manually in another terminal"
        exit 1
    fi
fi
echo "✅ Ollama server running on port ${OLLAMA_PORT}"

# Step 4: Model management
echo -e "\n${YELLOW}🤖 Managing Models${NC}"

# Check and pull base model
if ! model_exists "${OLLAMA_MODEL}"; then
    echo "⏳ Downloading ${OLLAMA_MODEL} model (~2.6GB)..."
    ollama pull "${OLLAMA_MODEL}"
fi
echo "✅ ${OLLAMA_MODEL} model available"

# Check Modelfile exists
if [ ! -f "Modelfile" ]; then
    echo -e "${RED}❌ Modelfile not found in current directory${NC}"
    echo "Please ensure you're running this script from the project root"
    exit 1
fi

# Check and create clean template model
if ! model_exists "${CLEAN_MODEL}"; then
    echo "⏳ Creating clean template model (${CLEAN_MODEL})..."
    ollama create "${CLEAN_MODEL}" -f Modelfile
fi
echo "✅ ${CLEAN_MODEL} template model available"

# Step 5: UV environment setup
echo -e "\n${YELLOW}📚 Setting up Python Environment${NC}"

# Sync dependencies
echo "⏳ Installing Python dependencies with UV..."
uv sync
echo "✅ Dependencies installed"

# Step 6: Verify setup
echo -e "\n${YELLOW}🔍 Verifying Setup${NC}"

# Test configuration loading
echo "⏳ Testing configuration..."
if uv run python -c "import chat; config = chat.Config(); print(f'Model: {config.get(\"model_name\")}')"; then
    echo "✅ Configuration loads successfully"
else
    echo -e "${RED}❌ Configuration test failed${NC}"
    exit 1
fi

# Test Ollama connectivity
echo "⏳ Testing Ollama connectivity..."
if curl -s "http://localhost:${OLLAMA_PORT}/api/version" >/dev/null; then
    echo "✅ Ollama server accessible"
else
    echo -e "${RED}❌ Cannot connect to Ollama server${NC}"
    exit 1
fi

# Final success message
echo -e "\n${GREEN}🎉 Setup Complete!${NC}"
echo "================================================"
echo -e "Your CLI Chat App is ready to use!"
echo -e "\nTo start chatting:"
echo -e "  ${BLUE}uv run python chat.py${NC}"
echo -e "\nTo stop the background Ollama server later:"
echo -e "  ${BLUE}pkill ollama${NC}"
echo -e "\nFor detailed documentation:"
echo -e "  ${BLUE}open spec/spec_README.md${NC}"