# Langchain Chatbot Simple

This repository contains a simple Langchain chatbot implementation using a Jupyter Notebook (`langchain-chatbot-simple.ipynb`). The notebook demonstrates how to interact with large language models (LLMs) from both Ollama and Anthropic. It showcases basic model invocation, streaming responses, and dynamic prompt creation.

## Project Setup

### Prerequisites

*   **Python 3.10 or higher**: Ensure you have a compatible Python version installed.
*   **Ollama**: If you plan to use the Ollama models, you need to have Ollama installed and running.
    *   **macOS (via Homebrew)**:
        ```bash
        brew install ollama
        ollama run llama2 # or any other model, e.g., qwen3:8b, mistral:7b
        ```
    *   **Other Platforms**: Download from [https://ollama.com/](https://ollama.com/).
    Make sure to pull the necessary models (e.g., `qwen3:8b`, `tinyllama:latest`, `mistral:7b`) using `ollama pull <model_name>` if not already done during `ollama run`.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your_username/sandbox-lang.git
    cd sandbox-lang
    ```

2.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv_sandbox_lang
    source venv_sandbox_lang/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

### Running the Notebook

1.  **Start Jupyter Lab:**
    ```bash
    jupyter lab
    ```

2.  **Open `langchain-chatbot-simple.ipynb`:**
    Once Jupyter Lab is running, open the `langchain-chatbot-simple.ipynb` file from the file browser.

3.  **Run the cells:**
    Execute the cells in the notebook sequentially to see the chatbot in action.

## Notebook Overview

The `langchain-chatbot-simple.ipynb` notebook covers the following key aspects:

*   **Model Initialization**: Demonstrates how to initialize chat models from Ollama (e.g., `qwen3:8b`) and Anthropic (e.g., `claude-3-haiku-20240307`).
*   **Basic Chat Interaction**: Shows how to send messages to the LLM using `model.invoke()` and receive responses.
*   **Streaming Responses**: Illustrates how to get token-by-token responses from the LLM using `model.stream()`.
*   **Dynamic Prompting**: Explains how to create reusable and dynamic chat prompts using `langchain_core.prompts.ChatPromptTemplate` for more structured conversations.

This notebook serves as a quick start guide for building and experimenting with LLM-powered chatbots using Langchain.
