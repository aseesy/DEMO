#!/bin/bash
# Ensures virtual environment exists and has required packages
# Usage: ./tools/ensure_venv.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."  # Go to chat-server directory

echo "🔧 Ensuring virtual environment is set up..."

# Create venv if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate venv
source .venv/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip --quiet

# Install required packages
echo "📦 Installing tree-sitter packages..."
pip install tree-sitter tree-sitter-javascript tree-sitter-typescript networkx --quiet

# Verify installation
echo "🔍 Verifying installation..."
python3 -c "
from tree_sitter import Language, Parser
import tree_sitter_javascript
import tree_sitter_typescript

js_lang = Language(tree_sitter_javascript.language())
ts_lang = Language(tree_sitter_typescript.language_typescript())

print('✅ tree-sitter installed')
print('✅ JavaScript grammar loaded')
print('✅ TypeScript grammar loaded')
print('✅ All dependencies ready!')
" || {
    echo "❌ Verification failed"
    exit 1
}

echo ""
echo "✅ Virtual environment is ready!"
echo ""
echo "You can now run:"
echo "  ./tools/analyze"
echo "  # or"
echo "  source .venv/bin/activate && python3 tools/analyze_contracts.py"
