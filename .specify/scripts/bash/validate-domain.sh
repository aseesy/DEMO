#!/usr/bin/env bash
# Validate feature specifications and implementations against coparentliaizen.com domain requirements
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$(cd "$SCRIPT_DIR/../../.." && pwd)")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Domain requirements checklist
declare -A REQUIREMENTS=(
    ["child_centered"]="Feature supports child-centered outcomes"
    ["conflict_reduction"]="Feature helps reduce misunderstandings and tensions"
    ["privacy_security"]="Feature protects sensitive family information"
    ["accessibility"]="Feature works for parents with varying technical skills"
    ["async_communication"]="Feature supports asynchronous communication"
    ["audit_trail"]="Feature maintains audit trail for legal/custody purposes"
    ["conflict_resources"]="Feature provides conflict resolution resources"
    ["privacy_compliance"]="Feature complies with privacy regulations (COPPA, GDPR)"
    ["selective_sharing"]="Feature supports selective information sharing"
    ["invitation_handling"]="Feature handles invitation states clearly"
    ["ai_mediation"]="Feature integrates with AI mediation service"
    ["realtime_support"]="Feature supports real-time communication"
    ["mobile_pwa"]="Feature works on mobile/PWA"
    ["backward_compatible"]="Feature maintains backward compatibility"
)

# Validation results
declare -A RESULTS=()
SCORE=0
TOTAL=0

# Print usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS] [FILE|DIRECTORY]

Validate feature specifications and implementations against coparentliaizen.com domain requirements.

OPTIONS:
    -f, --file FILE           Validate a specific file (spec.md, component, etc.)
    -d, --directory DIR       Validate entire feature directory
    -c, --component FILE      Validate a React component
    -s, --spec FILE           Validate a specification file
    -h, --help                Show this help message

EXAMPLES:
    # Validate a specification file
    $0 --spec specs/001-feature-name/spec.md

    # Validate entire feature directory
    $0 --directory specs/001-feature-name/

    # Validate a component
    $0 --component chat-client-vite/src/components/ContactsPanel.jsx

EOF
}

# Check if file contains keyword
check_keyword() {
    local file="$1"
    local keyword="$2"
    local context="${3:-}"
    
    if [ -f "$file" ]; then
        if grep -qi "$keyword" "$file"; then
            return 0
        fi
    fi
    return 1
}

# Validate requirement
validate_requirement() {
    local req_key="$1"
    local req_desc="$2"
    local file="$3"
    
    TOTAL=$((TOTAL + 1))
    
    case "$req_key" in
        "child_centered")
            if check_keyword "$file" "child|children|wellbeing|well-being" || \
               check_keyword "$file" "benefit.*child|child.*outcome"; then
                RESULTS["$req_key"]="PASS"
                SCORE=$((SCORE + 1))
                return 0
            fi
            ;;
        "conflict_reduction")
            if check_keyword "$file" "conflict|misunderstanding|tension|mediation" || \
               check_keyword "$file" "reduce.*conflict|improve.*communication"; then
                RESULTS["$req_key"]="PASS"
                SCORE=$((SCORE + 1))
                return 0
            fi
            ;;
        "privacy_security")
            if check_keyword "$file" "privacy|security|encrypt|sensitive|protect" || \
               check_keyword "$file" "data.*protection|secure.*data"; then
                RESULTS["$req_key"]="PASS"
                SCORE=$((SCORE + 1))
                return 0
            fi
            ;;
        "accessibility")
            if check_keyword "$file" "accessibility|accessible|mobile|responsive|PWA" || \
               check_keyword "$file" "varying.*skill|technical.*skill"; then
                RESULTS["$req_key"]="PASS"
                SCORE=$((SCORE + 1))
                return 0
            fi
            ;;
        "async_communication")
            if check_keyword "$file" "asynchronous|time.*zone|offline|sync" || \
               check_keyword "$file" "different.*time|timezone"; then
                RESULTS["$req_key"]="PASS"
                SCORE=$((SCORE + 1))
                return 0
            fi
            ;;
        "audit_trail")
            if check_keyword "$file" "audit|trail|log|history|record" || \
               check_keyword "$file" "legal|custody|court"; then
                RESULTS["$req_key"]="PASS"
                SCORE=$((SCORE + 1))
                return 0
            fi
            ;;
        "conflict_resources")
            if check_keyword "$file" "conflict.*resolution|resource|help|support" || \
               check_keyword "$file" "mediation.*resource|conflict.*help"; then
                RESULTS["$req_key"]="PASS"
                SCORE=$((SCORE + 1))
                return 0
            fi
            ;;
        "privacy_compliance")
            if check_keyword "$file" "COPPA|GDPR|privacy.*regulation|compliance" || \
               check_keyword "$file" "privacy.*law|data.*protection.*law"; then
                RESULTS["$req_key"]="PASS"
                SCORE=$((SCORE + 1))
                return 0
            fi
            ;;
        "selective_sharing")
            if check_keyword "$file" "selective|sharing|visibility|permission" || \
               check_keyword "$file" "control.*sharing|selective.*information"; then
                RESULTS["$req_key"]="PASS"
                SCORE=$((SCORE + 1))
                return 0
            fi
            ;;
        "invitation_handling")
            if check_keyword "$file" "invitation|invite|pending|rejected|accepted" || \
               check_keyword "$file" "connection.*request|invite.*state"; then
                RESULTS["$req_key"]="PASS"
                SCORE=$((SCORE + 1))
                return 0
            fi
            ;;
        "ai_mediation")
            if check_keyword "$file" "ai.*mediation|aiMediator|openai|gpt" || \
               check_keyword "$file" "message.*rewrite|mediation.*service"; then
                RESULTS["$req_key"]="PASS"
                SCORE=$((SCORE + 1))
                return 0
            fi
            ;;
        "realtime_support")
            if check_keyword "$file" "websocket|socket\.io|realtime|real-time" || \
               check_keyword "$file" "instant.*message|live.*update"; then
                RESULTS["$req_key"]="PASS"
                SCORE=$((SCORE + 1))
                return 0
            fi
            ;;
        "mobile_pwa")
            if check_keyword "$file" "mobile|PWA|progressive.*web|responsive" || \
               check_keyword "$file" "installable|offline.*support"; then
                RESULTS["$req_key"]="PASS"
                SCORE=$((SCORE + 1))
                return 0
            fi
            ;;
        "backward_compatible")
            if check_keyword "$file" "backward.*compatible|migration|compatibility" || \
               check_keyword "$file" "existing.*schema|legacy.*support"; then
                RESULTS["$req_key"]="PASS"
                SCORE=$((SCORE + 1))
                return 0
            fi
            ;;
    esac
    
    RESULTS["$req_key"]="FAIL"
    return 1
}

# Validate file
validate_file() {
    local file="$1"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: File not found: $file${NC}" >&2
        return 1
    fi
    
    echo -e "${BLUE}Validating: $file${NC}"
    echo ""
    
    # Validate all requirements
    for req_key in "${!REQUIREMENTS[@]}"; do
        validate_requirement "$req_key" "${REQUIREMENTS[$req_key]}" "$file"
    done
}

# Validate directory
validate_directory() {
    local dir="$1"
    
    if [ ! -d "$dir" ]; then
        echo -e "${RED}Error: Directory not found: $dir${NC}" >&2
        return 1
    fi
    
    echo -e "${BLUE}Validating directory: $dir${NC}"
    echo ""
    
    # Find all relevant files
    local files=()
    if [ -f "$dir/spec.md" ]; then
        files+=("$dir/spec.md")
    fi
    if [ -f "$dir/plan.md" ]; then
        files+=("$dir/plan.md")
    fi
    if [ -f "$dir/tasks.md" ]; then
        files+=("$dir/tasks.md")
    fi
    
    # Validate each file
    for file in "${files[@]}"; do
        validate_file "$file"
    done
}

# Print results
print_results() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Domain Validation Results${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    local passed=0
    local failed=0
    
    for req_key in "${!REQUIREMENTS[@]}"; do
        local status="${RESULTS[$req_key]}"
        local desc="${REQUIREMENTS[$req_key]}"
        
        if [ "$status" = "PASS" ]; then
            echo -e "${GREEN}✓${NC} $desc"
            passed=$((passed + 1))
        else
            echo -e "${RED}✗${NC} $desc"
            failed=$((failed + 1))
        fi
    done
    
    echo ""
    echo -e "${BLUE}========================================${NC}"
    
    if [ $TOTAL -gt 0 ]; then
        local percentage=$((SCORE * 100 / TOTAL))
        echo -e "Score: ${SCORE}/${TOTAL} (${percentage}%)"
    else
        echo -e "No requirements checked"
        return 1
    fi
    
    echo ""
    
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}✅ All domain requirements passed!${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  ${failed} requirement(s) need attention${NC}"
        echo ""
        echo -e "${YELLOW}Recommendations:${NC}"
        echo "- Review failed requirements above"
        echo "- Add missing co-parenting considerations"
        echo "- Ensure child-centered outcomes are addressed"
        echo "- Verify privacy and security measures"
        return 1
    fi
}

# Main
main() {
    local target_file=""
    local target_dir=""
    local component_file=""
    local spec_file=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--file)
                target_file="$2"
                shift 2
                ;;
            -d|--directory)
                target_dir="$2"
                shift 2
                ;;
            -c|--component)
                component_file="$2"
                shift 2
                ;;
            -s|--spec)
                spec_file="$2"
                shift 2
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                # Assume it's a file or directory path
                if [ -d "$1" ]; then
                    target_dir="$1"
                elif [ -f "$1" ]; then
                    target_file="$1"
                else
                    echo -e "${RED}Error: Unknown option or invalid path: $1${NC}" >&2
                    usage
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Determine what to validate
    if [ -n "$spec_file" ]; then
        validate_file "$spec_file"
    elif [ -n "$component_file" ]; then
        validate_file "$component_file"
    elif [ -n "$target_dir" ]; then
        validate_directory "$target_dir"
    elif [ -n "$target_file" ]; then
        validate_file "$target_file"
    else
        echo -e "${RED}Error: No file or directory specified${NC}" >&2
        usage
        exit 1
    fi
    
    # Print results
    print_results
    exit $?
}

main "$@"

