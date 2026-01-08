#!/bin/bash
# Codemod Orchestration Script
# Runs codemods with safety checks and validation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CODEMOD_DIR="$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Defaults
DRY_RUN=false
TARGET_DIR=""
CODEMOD=""
VALIDATE=true

usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --codemod NAME       Codemod to run (console-to-logger)"
  echo "  --target DIR         Target directory (relative to project root)"
  echo "  --dry                Dry run (preview changes only)"
  echo "  --no-validate        Skip validation (lint, tests)"
  echo "  --help               Show this help"
  echo ""
  echo "Examples:"
  echo "  $0 --codemod console-to-logger --target chat-server/src/core/engine --dry"
  echo "  $0 --codemod console-to-logger --target chat-server/src/core/engine"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --codemod)
      CODEMOD="$2"
      shift 2
      ;;
    --target)
      TARGET_DIR="$2"
      shift 2
      ;;
    --dry)
      DRY_RUN=true
      shift
      ;;
    --no-validate)
      VALIDATE=false
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      usage
      exit 1
      ;;
  esac
done

# Validate arguments
if [ -z "$CODEMOD" ]; then
  echo -e "${RED}Error: --codemod is required${NC}"
  usage
  exit 1
fi

if [ -z "$TARGET_DIR" ]; then
  echo -e "${RED}Error: --target is required${NC}"
  usage
  exit 1
fi

TRANSFORM_FILE="$CODEMOD_DIR/transforms/$CODEMOD.js"
if [ ! -f "$TRANSFORM_FILE" ]; then
  echo -e "${RED}Error: Codemod not found: $TRANSFORM_FILE${NC}"
  exit 1
fi

TARGET_PATH="$PROJECT_ROOT/$TARGET_DIR"
if [ ! -d "$TARGET_PATH" ]; then
  echo -e "${RED}Error: Target directory not found: $TARGET_PATH${NC}"
  exit 1
fi

# Check git status
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
  echo "It's recommended to commit or stash changes before running codemods."
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Pre-run analysis
echo -e "${GREEN}📊 Pre-run Analysis${NC}"
echo "Codemod: $CODEMOD"
echo "Target: $TARGET_DIR"
echo "Dry run: $DRY_RUN"
echo ""

# Count files that will be affected
echo "Analyzing files..."
AFFECTED_FILES=$(find "$TARGET_PATH" -type f \( -name "*.js" -o -name "*.jsx" \) ! -path "*/node_modules/*" ! -path "*/__tests__/*" | wc -l | tr -d ' ')
echo "Found $AFFECTED_FILES JavaScript files"

# Run codemod
echo ""
echo -e "${GREEN}🔄 Running Codemod${NC}"

cd "$CODEMOD_DIR"

if [ "$DRY_RUN" = true ]; then
  echo "DRY RUN MODE - No files will be modified"
  jscodeshift -t "transforms/$CODEMOD.js" --dry "$TARGET_PATH" || true
else
  jscodeshift -t "transforms/$CODEMOD.js" "$TARGET_PATH"
fi

# Post-run validation
if [ "$VALIDATE" = true ] && [ "$DRY_RUN" = false ]; then
  echo ""
  echo -e "${GREEN}✅ Validation${NC}"
  
  cd "$PROJECT_ROOT"
  
  echo "Running ESLint..."
  npm run lint:fix || echo -e "${YELLOW}Linter found issues - please review${NC}"
  
  echo "Running Prettier..."
  npm run format || echo -e "${YELLOW}Formatting issues - please review${NC}"
  
  echo ""
  echo -e "${GREEN}✅ Codemod complete!${NC}"
  echo "Next steps:"
  echo "  1. Review changes: git diff"
  echo "  2. Run tests: npm run test:backend"
  echo "  3. Commit if satisfied: git add . && git commit"
else
  echo ""
  echo -e "${GREEN}✅ Codemod complete!${NC}"
fi