#!/bin/bash

VENV="venv_sandbox_lang"

# Create the virtual environment if it doesn't exist
if [ ! -d "$VENV" ]; then
    echo "Creating virtual environment '$VENV'..."
    python3 -m venv "$VENV"
fi

# Activate it
echo "Activating virtual environment '$VENV'..."
source "$VENV"/bin/activate

# (Optional) Confirm it's active
echo "✅ Virtualenv '$VENV' is now active."
echo "To use this environment, run: source setup_env.sh"