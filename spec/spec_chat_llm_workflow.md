# spec.md — Minimal CLI Chat App (Python + LangChain + Ollama + UV)
* This is a simple LLM workflow based chat app using modern UV package management

## 1) Goal
Build a **no‑agent**, **local‑only** CLI chatbot that streams responses from an **Ollama** model (e.g., `gemma3n-clean`, `gemma:2b`, or any `*-instruct`).

---

## 2) Requirements

### Functional
- Start a REPL: user types prompts; model replies.
- Maintain a tiny rolling history (system + last N turns).
- Stream tokens to console as they arrive.
- Exit on `/exit`, `exit`, or `quit`.

### Non‑Functional
- Runs fully offline after models are pulled.
- Minimal dependencies, simple code layout.
- Deterministic output surface (no chain‑of‑thought leakage).

---

## 3) Dependencies

- Python 3.10+
- **UV** package manager (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **pyproject.toml** with dependencies: `langchain`, `langchain-core`, `langchain-community`, `pyyaml`
- **Ollama** installed & running (`ollama serve`)
- A local model present (e.g., `ollama run gemma3n:e4b` once to pull/warm)

### Setup with UV
```bash
# Install dependencies
uv sync

# Or run directly without installing
uv run python chat.py
```

---

## 4) Model & Prompting

### Recommended Model Tags
- **Primary**: `gemma3n:e4b` with clean template variant via **Modelfile**:
  ```dockerfile
  FROM gemma3n:e4b
  TEMPLATE "{{ .System }}\n\n{{ .Prompt }}"
  PARAMETER temperature 0.7
  PARAMETER top_k 40
  PARAMETER top_p 0.9
  SYSTEM "Respond directly without showing reasoning process."
  ```
  Build: `ollama create gemma3n-clean -f Modelfile`

- **Alternatives**: Use `*-instruct`/`*-chat` tags (e.g., `llama3.2:3b-instruct`, `gemma:2b`).

### System Prompt (default)
```
"You are a concise assistant. Reply briefly and helpfully. 
Do NOT include chain-of-thought or hidden reasoning—only final answers."
```

---

## 5) User Flow (ASCII)

```
+---------------------+
|  User (CLI prompt)  |
+----------+----------+
           |
           v
+---------------------+
| chat.py (REPL loop) |
+----------+----------+
           |
           v
+------------------------------+
| Build Messages               |
| [SystemMessage, HumanMessage]|
+----------+-------------------+
           |
           v
+------------------------------+
| LangChain init_chat_model    |
| provider='ollama'            |
+----------+-------------------+
           |
           v
+------------------------------+
| STREAMING?                   |
|  yes -> model.stream(...)    |
|   no -> model.invoke(...)    |
+----------+-------------------+
           |
           v
+------------------------------+
| Print to console             |
+----------+-------------------+
           |
           v
+------------------------------+
| Append to short history      |
+------------------------------+
```

---

## 6) System Architecture (ASCII)

```
+-------------------------------------------------------------+
|                         macOS Host                          |
|                                                             |
|  +-------------------+        HTTP :11434                   |
|  |   CLI (chat.py)   |------------------------------+       |
|  +---------+---------+                              |       |
|            v                                        |       |
|  +----------------------------+                     |       |
|  | LangChain ChatModel        |                     |       |
|  | provider='ollama'          |                     |       |
|  +-------------+--------------+                     |       |
|                | POST /api/chat (JSON/SSE)          |       |
|                v                                    |       |
|        +-----------------------+                     |       |
|        |     Ollama Server     | <-------------------+       |
|        |  (applies TEMPLATE)   |                             |
|        +-----------+-----------+                             |
|                    v                                         |
|        +---------------------------+                        |
|        |  Local Model Weights      |                        |
|        |  qwen3-clean / gemma-*    |                        |
|        +---------------------------+                        |
+-------------------------------------------------------------+
```

---

## 7) CLI Behavior

- **Run**: `uv run python chat.py` or `python chat.py` (if env activated)
- **Prompt**: `You: `
- **Exit**: `/exit` | `exit` | `quit`
- **Streaming**: prints tokens as they arrive; flush to stdout.
- **History**: keep `SystemMessage` + last `K` (default 4) turns to save VRAM.

---

## 8) Configuration

```yaml
# config.yaml (optional)
model_name: "gemma3n-clean"   # or "gemma:2b", "llama3.2:3b-instruct"
model_provider: "ollama"
base_url: "http://localhost:11434"
keep_alive: -1                # keep model loaded
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

**Environment Variable Overrides:**
```bash
export MODEL_NAME="gemma3n:e4b"
export SYSTEM_PROMPT="You are a helpful coding assistant."
export STREAMING=true
export HISTORY_TURNS=6
```

---

## 9) Code Structure

```
.
├─ chat.py                 # main REPL with config management
├─ config.yaml             # YAML configuration with defaults
├─ pyproject.toml          # UV project configuration
└─ Modelfile               # clean template for gemma3n:e4b
```

**chat.py (essentials)**
- Load config from YAML + environment variables with precedence.
- Robust error handling with helpful Ollama troubleshooting messages.
- `init_chat_model()` with full parameter support (temperature, timeout, etc).
- Build messages: `[SystemMessage, ...History..., HumanMessage]`
- Stream responses with chain-of-thought filtering.
- History management with configurable turn limits.
- Signal handling for graceful shutdown (Ctrl+C).

---

## 10) Error Handling

- **Ollama not running** → Show actionable hint: “Start with `ollama serve`.”
- **Model missing** → Suggest `ollama run gemma3n:e4b` + `ollama create gemma3n-clean -f Modelfile`.
- **Connection refused** → Confirm port `:11434` / firewall.
- **Invalid JSON (if using `format: json`)** → Fallback to raw text with warning.

---

## 11) Testing

- Unit: history truncation, exit commands, config parsing.
- Smoke: start REPL, ask 2–3 prompts, confirm stream and final text.
- Prompt hygiene: verify **no** `<think>` blocks appear with `gemma3n-clean` or `*-instruct`.
- Configuration: test YAML loading and environment variable overrides.
- UV integration: verify `uv run python chat.py` works correctly.

---

## 12) Non‑Goals

- No tools, retrieval, or plugins.
- No multi‑agent orchestration.
- No persistence beyond session memory.

---

## 13) Stretch (Optional)

- `/save` to write transcript to `.md`.
- `/system "..."` to hot-swap system prompt.
- `/json` mode (enforce `format="json"` + parse).
- Add `FastAPI` wrapper for a tiny local web endpoint.

---

## 14) Acceptance Criteria

- Running `uv run python chat.py` yields a prompt.
- User can enter a message and see **token‑streamed** output.
- App exits cleanly on `/exit` or Ctrl+C.
- Uses local Ollama model; works offline (post‑pull).
- No chain‑of‑thought is surfaced when using `gemma3n-clean` or `-instruct` models.
- Configuration loads from YAML and respects environment variables.

---

## Appendix A — Project Setup (UV-based)

### pyproject.toml
```toml
[project]
name = "sandbox-lang-chat"
version = "0.1.0"
description = "Minimal CLI chat app using LangChain + Ollama"
requires-python = ">=3.10"
dependencies = [
    "langchain>=0.1.0",
    "langchain-core>=0.1.0", 
    "langchain-community>=0.0.20",
    "pyyaml>=6.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

### Quick Start Commands
```bash
# Setup
uv sync                              # Install dependencies
ollama serve                         # Start Ollama (separate terminal)
ollama run gemma3n:e4b              # Pull base model
ollama create gemma3n-clean -f Modelfile  # Create clean variant

# Run
uv run python chat.py               # Direct execution
# or
source .venv/bin/activate && python chat.py  # Activate first
```

---

## Interview Lens (why this matters)

- **Prompt/Template control**: Suppressing chain‑of‑thought at the **Modelfile TEMPLATE** is a production hygiene best‑practice.
- **Latency & UX**: Token streaming → faster perceived response; short history → VRAM‑aware scaling.
- **Local inference trade‑offs**: privacy & cost vs. throughput & model quality.
