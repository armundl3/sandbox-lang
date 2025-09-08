#!/bin/bash

VENV="venv_sandbox_lang"

# Create the virtual environment
python3 -m venv "$VENV"

# Activate it
source "$VENV"/bin/activate

# (Optional) Confirm it's active
echo "✅ Virtualenv '$VENV' is now active."