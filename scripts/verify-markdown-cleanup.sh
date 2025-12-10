#!/bin/bash
# Verification script to test markdown cleanup

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Verifying Markdown Cleanup"
echo "=============================="
echo ""

ERRORS=0

# Check 1: No completion files in root
echo "1. Checking for completion files in root..."
COMPLETION_FILES=$(find "$PROJECT_ROOT" -maxdepth 1 -name "*_COMPLETE.md" -o -name "*_SUMMARY.md" -o -name "*_RESULTS.md" 2>/dev/null | grep -v node_modules || true)

if [[ -n "$COMPLETION_FILES" ]]; then
  echo -e "${RED}❌ Found completion files in root:${NC}"
  echo "$COMPLETION_FILES"
  ((ERRORS++))
else
  echo -e "${GREEN}✅ No completion files in root${NC}"
fi

# Check 2: Essential files still exist
echo ""
echo "2. Checking essential files exist..."
ESSENTIAL_FILES=(
  "README.md"
  "START_HERE.md"
  "CLAUDE.md"
  "AGENTS.md"
  "LIAIZEN_MEDIATION_COMPLETE_REFERENCE.md"
)

for file in "${ESSENTIAL_FILES[@]}"; do
  if [[ -f "$PROJECT_ROOT/$file" ]]; then
    echo -e "${GREEN}✅ $file${NC}"
  else
    echo -e "${RED}❌ Missing: $file${NC}"
    ((ERRORS++))
  fi
done

# Check 3: Archive directory exists
echo ""
echo "3. Checking archive directory..."
if [[ -d "$PROJECT_ROOT/docs-archive" ]]; then
  ARCHIVE_COUNT=$(find "$PROJECT_ROOT/docs-archive" -name "*.md" | wc -l | tr -d ' ')
  echo -e "${GREEN}✅ docs-archive/ exists ($ARCHIVE_COUNT files)${NC}"
else
  echo -e "${RED}❌ docs-archive/ missing${NC}"
  ((ERRORS++))
fi

# Check 4: No broken references (basic check)
echo ""
echo "4. Checking for common reference patterns..."
if grep -r "TEST_FIXES_COMPLETE.md\|SCAN_RESULTS_SUMMARY.md" "$PROJECT_ROOT" --include="*.md" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v "docs-archive" | grep -v node_modules | grep -v ".git" > /dev/null; then
  echo -e "${YELLOW}⚠️  Found references to archived files (may need updating)${NC}"
else
  echo -e "${GREEN}✅ No obvious broken references${NC}"
fi

echo ""
echo "=============================="
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Found $ERRORS issue(s)${NC}"
  exit 1
fi

