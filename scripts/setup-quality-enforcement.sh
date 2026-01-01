#!/bin/bash

# Setup script for quality enforcement tools
# This installs Husky, lint-staged, and Prettier

set -e

echo "🔧 Setting up quality enforcement tools..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run this from the project root."
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --save-dev husky lint-staged prettier

# Initialize Husky
echo "🐕 Setting up Husky..."
npx husky install

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/pre-push

echo "✅ Quality enforcement setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Run 'npm test' to ensure tests pass"
echo "   2. Run 'npm run format' to format existing code"
echo "   3. Try making a commit to test pre-commit hooks"
echo ""
echo "💡 Tips:"
echo "   - Pre-commit hooks will run automatically on commit"
echo "   - Pre-push hooks will run automatically before pushing"
echo "   - Use 'git commit --no-verify' to skip hooks (not recommended)"














