#!/bin/bash
# Markdown Cleanup Script
# Archives completion reports and summary files to docs-archive/
# Usage: ./cleanup-markdown.sh [--yes] [--dry-run]

set -e  # Exit on error

# Parse arguments
AUTO_YES=false
DRY_RUN=false

for arg in "$@"; do
  case $arg in
    --yes)
      AUTO_YES=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ARCHIVE_DIR="$PROJECT_ROOT/docs-archive"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "📚 Markdown Cleanup Script"
echo "=========================="
echo ""

# Ensure archive directory exists
mkdir -p "$ARCHIVE_DIR"

# Patterns to archive (from root directory only)
PATTERNS=(
  "*_COMPLETE.md"
  "*_SUMMARY.md"
  "*_RESULTS.md"
  "*_PROGRESS.md"
  "*_FIXES.md"
  "*_TEST.md"
  "*_REPORT.md"
)

# Files to move
FILES_TO_MOVE=()

# Find files matching patterns in root (not in docs-archive, node_modules, or .git)
for pattern in "${PATTERNS[@]}"; do
  while IFS= read -r file; do
    # Skip if already in archive or in excluded directories
    if [[ "$file" != *"docs-archive"* ]] && \
       [[ "$file" != *"node_modules"* ]] && \
       [[ "$file" != *".git"* ]] && \
       [[ "$file" == "$PROJECT_ROOT"/* ]]; then
      FILES_TO_MOVE+=("$file")
    fi
  done < <(find "$PROJECT_ROOT" -maxdepth 1 -name "$pattern" -type f 2>/dev/null || true)
done

# Also add specific known files
SPECIFIC_FILES=(
  "CODE_REMOVAL_PLAN.md"
  "UNUSED_CODE_ANALYSIS.md"
  "CODEBASE_SCAN_RECOMMENDATIONS.md"
  "IMMEDIATE_SCAN_RESULTS.md"
  "QUICK_SCAN_RESULTS.md"
  "SCAN_SETUP_COMPLETE.md"
  "ERROR_HANDLING_ANALYSIS.md"
  "ERROR_HANDLING_EXAMPLES.md"
  "ERROR_HANDLING_REFACTORING_COMPLETE.md"
  "REMOVAL_DECISION_SUMMARY.md"
  "TEST_CREATION_PROGRESS.md"
  "TEST_CREATION_SUMMARY.md"
  "TEST_AUDIT_REPORT.md"
  "TEST_SUFFICIENCY_SUMMARY.md"
  "TEST_SUFFICIENCY_FINAL_REPORT.md"
  "REFACTORING_PROGRESS.md"
  "PROTECTIONS_SUMMARY.md"
  "NAMING_CONVENTIONS_COMPLETION.md"
  "NAMING_CONVENTIONS_AUDIT.md"
  "USERNAME_DISPLAYNAME_COMPLETE.md"
  "USERNAME_DISPLAYNAME_PHASE2_COMPLETE.md"
  "USERNAME_DISPLAYNAME_FIX_SUMMARY.md"
  "USERNAME_DISPLAYNAME_CONFUSION_ANALYSIS.md"
  "USERNAME_DISPLAYNAME_TEST_PLAN.md"
  "DOMAIN_MODEL_PROPOSAL.md"
  "DOMAIN_MODEL_IMPLEMENTATION_PLAN.md"
  "DOMAIN_MODEL_PHASE1_DECISION.md"
  "DOMAIN_MODEL_RISK_ASSESSMENT.md"
  "DOMAIN_MODEL_STATUS.md"
  "DOMAIN_MODEL_SUMMARY.md"
  "DOMAIN_MODEL_INTEGRATION_POINTS.md"
  "POSTGRESQL_MIGRATION_COMPLETE.md"
  "CLIENT_TEST_COMPLETE.md"
  "MESSAGE_PERSISTENCE_TEST_REPORT.md"
  "LOGIN_TEST_RESULTS.md"
  "LOGIN_ERROR_HANDLING_VERIFICATION.md"
  "NOTIFICATION_FEATURE_TEST.md"
  "USER_COUNT_REPORT.md"
  "RESTART_SERVERS.md"
  "QUICK_DEPLOYMENT_FIX.md"
  "RAILWAY_SETUP_SUMMARY.md"
  "RAILWAY_DEPLOYMENT_CHECK.md"
  "RAILWAY_NOT_UPDATING_FIX.md"
  "RAILWAY_PROJECT_INFO.md"
  "VERCEL_PROJECTS_CHECK.md"
  "VERIFY_VERCEL_RAILWAY.md"
  "TRIGGER_VERCEL_DEPLOYMENT.md"
  "MEDIATOR_TEST_SUMMARY.md"
  "TEST_FIXES_COMPLETE.md"
  "TEST_FIXES_FINAL.md"
  "SCAN_RESULTS.md"
  "SCAN_RESULTS_SUMMARY.md"
  "MEDIATOR_REFACTORING_PLAN.md"
)

for file in "${SPECIFIC_FILES[@]}"; do
  full_path="$PROJECT_ROOT/$file"
  if [[ -f "$full_path" ]]; then
    FILES_TO_MOVE+=("$full_path")
  fi
done

# Remove duplicates
IFS=$'\n' FILES_TO_MOVE=($(printf '%s\n' "${FILES_TO_MOVE[@]}" | sort -u))

if [ ${#FILES_TO_MOVE[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ No files to archive${NC}"
  exit 0
fi

echo -e "${YELLOW}Found ${#FILES_TO_MOVE[@]} file(s) to archive:${NC}"
echo ""

# Show files that will be moved
for file in "${FILES_TO_MOVE[@]}"; do
  filename=$(basename "$file")
  echo "  - $filename"
done

if [[ "$DRY_RUN" == true ]]; then
  echo ""
  echo -e "${YELLOW}🔍 DRY RUN MODE - No files will be moved${NC}"
  exit 0
fi

if [[ "$AUTO_YES" != true ]]; then
  echo ""
  read -p "Move these files to docs-archive/? (y/N): " -n 1 -r
  echo ""

  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled${NC}"
    exit 0
  fi
fi

# Move files
MOVED=0
FAILED=0

for file in "${FILES_TO_MOVE[@]}"; do
  if [[ -f "$file" ]]; then
    filename=$(basename "$file")
    dest="$ARCHIVE_DIR/$filename"
    
    # Handle duplicates (add timestamp)
    if [[ -f "$dest" ]]; then
      timestamp=$(date +%Y%m%d_%H%M%S)
      name_no_ext="${filename%.md}"
      dest="$ARCHIVE_DIR/${name_no_ext}_${timestamp}.md"
    fi
    
    if mv "$file" "$dest" 2>/dev/null; then
      echo -e "${GREEN}✅ Moved: $filename${NC}"
      ((MOVED++))
    else
      echo -e "${RED}❌ Failed: $filename${NC}"
      ((FAILED++))
    fi
  fi
done

echo ""
echo "=========================="
echo -e "${GREEN}✅ Moved: $MOVED file(s)${NC}"
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}❌ Failed: $FAILED file(s)${NC}"
fi
echo ""
echo "Files archived to: $ARCHIVE_DIR"

