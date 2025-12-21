#!/bin/bash

# Script to fetch secrets from your secret manager
# Supports: AWS Secrets Manager, Railway CLI, HashiCorp Vault, and .env files

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SECRET_MANAGER="${SECRET_MANAGER:-}"  # aws, railway, vault, env
OUTPUT_FILE="${OUTPUT_FILE:-.env}"
SECRET_NAME="${SECRET_NAME:-}"
RAILWAY_PROJECT="${RAILWAY_PROJECT:-}"
VAULT_ADDR="${VAULT_ADDR:-http://127.0.0.1:8200}"
VAULT_PATH="${VAULT_PATH:-secret/data/app}"

# Print usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Retrieve secrets from various secret managers and write to .env file

OPTIONS:
    -m, --manager MANAGER     Secret manager to use (aws, railway, vault, env)
    -n, --name NAME           Secret name/identifier
    -o, --output FILE         Output file (default: .env)
    -p, --project PROJECT     Railway project name (for Railway manager)
    -v, --vault-path PATH     Vault secret path (default: secret/data/app)
    -h, --help                Show this help message

EXAMPLES:
    # AWS Secrets Manager
    SECRET_MANAGER=aws SECRET_NAME=my-app/secrets $0
    $0 -m aws -n my-app/secrets

    # Railway CLI
    SECRET_MANAGER=railway RAILWAY_PROJECT=my-project $0
    $0 -m railway -p my-project

    # HashiCorp Vault
    SECRET_MANAGER=vault VAULT_PATH=secret/data/myapp $0
    $0 -m vault -v secret/data/myapp

    # Environment variables (from existing .env file)
    $0 -m env

ENVIRONMENT VARIABLES:
    SECRET_MANAGER          Secret manager type (aws, railway, vault, env)
    SECRET_NAME            Secret name/identifier
    OUTPUT_FILE            Output file path (default: .env)
    RAILWAY_PROJECT        Railway project name
    VAULT_ADDR             Vault server address (default: http://127.0.0.1:8200)
    VAULT_PATH             Vault secret path (default: secret/data/app)
    AWS_REGION             AWS region (for AWS Secrets Manager)
    AWS_PROFILE            AWS profile to use (for AWS Secrets Manager)

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -m|--manager)
                SECRET_MANAGER="$2"
                shift 2
                ;;
            -n|--name)
                SECRET_NAME="$2"
                shift 2
                ;;
            -o|--output)
                OUTPUT_FILE="$2"
                shift 2
                ;;
            -p|--project)
                RAILWAY_PROJECT="$2"
                shift 2
                ;;
            -v|--vault-path)
                VAULT_PATH="$2"
                shift 2
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}" >&2
                usage
                exit 1
                ;;
        esac
    done
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Retrieve secrets from AWS Secrets Manager
retrieve_aws_secrets() {
    if ! command_exists aws; then
        echo -e "${RED}Error: AWS CLI not found. Install it first.${NC}" >&2
        exit 1
    fi

    if [[ -z "$SECRET_NAME" ]]; then
        echo -e "${RED}Error: SECRET_NAME is required for AWS Secrets Manager${NC}" >&2
        exit 1
    fi

    echo -e "${BLUE}Retrieving secrets from AWS Secrets Manager: ${SECRET_NAME}${NC}"

    local region="${AWS_REGION:-us-east-1}"
    local profile="${AWS_PROFILE:-}"

    local aws_cmd="aws secretsmanager get-secret-value --secret-id ${SECRET_NAME} --region ${region}"
    if [[ -n "$profile" ]]; then
        aws_cmd="${aws_cmd} --profile ${profile}"
    fi

    local secret_value
    secret_value=$($aws_cmd --query SecretString --output text)

    if [[ -z "$secret_value" ]]; then
        echo -e "${RED}Error: Failed to retrieve secret${NC}" >&2
        exit 1
    fi

    # Parse JSON secret and write to .env format
    echo "$secret_value" | jq -r 'to_entries | .[] | "\(.key)=\(.value)"' > "$OUTPUT_FILE"

    echo -e "${GREEN}✅ Secrets retrieved and written to ${OUTPUT_FILE}${NC}"
}

# Retrieve secrets from Railway
retrieve_railway_secrets() {
    if ! command_exists railway; then
        echo -e "${RED}Error: Railway CLI not found. Install it first:${NC}" >&2
        echo -e "${YELLOW}  npm i -g @railway/cli${NC}" >&2
        exit 1
    fi

    echo -e "${BLUE}Retrieving secrets from Railway${NC}"

    local railway_cmd="railway variables"
    if [[ -n "$RAILWAY_PROJECT" ]]; then
        railway_cmd="${railway_cmd} --project ${RAILWAY_PROJECT}"
    fi

    # Railway CLI outputs variables in KEY=VALUE format
    $railway_cmd > "$OUTPUT_FILE" 2>/dev/null || {
        echo -e "${RED}Error: Failed to retrieve Railway secrets${NC}" >&2
        echo -e "${YELLOW}Make sure you're logged in: railway login${NC}" >&2
        exit 1
    }

    echo -e "${GREEN}✅ Secrets retrieved and written to ${OUTPUT_FILE}${NC}"
}

# Retrieve secrets from HashiCorp Vault
retrieve_vault_secrets() {
    if ! command_exists vault; then
        echo -e "${RED}Error: Vault CLI not found. Install it first.${NC}" >&2
        exit 1
    fi

    echo -e "${BLUE}Retrieving secrets from Vault: ${VAULT_PATH}${NC}"

    export VAULT_ADDR

    # Check if vault is accessible
    if ! vault status >/dev/null 2>&1; then
        echo -e "${RED}Error: Cannot connect to Vault at ${VAULT_ADDR}${NC}" >&2
        echo -e "${YELLOW}Make sure Vault is running and you're authenticated${NC}" >&2
        exit 1
    fi

    # Read secret from Vault
    vault kv get -format=json "$VAULT_PATH" | jq -r '.data.data | to_entries | .[] | "\(.key)=\(.value)"' > "$OUTPUT_FILE" || {
        echo -e "${RED}Error: Failed to retrieve Vault secrets${NC}" >&2
        exit 1
    }

    echo -e "${GREEN}✅ Secrets retrieved and written to ${OUTPUT_FILE}${NC}"
}

# Copy from existing .env file (useful for local development)
retrieve_env_secrets() {
    local source_file="${1:-.env.example}"

    if [[ ! -f "$source_file" ]]; then
        echo -e "${RED}Error: Source file ${source_file} not found${NC}" >&2
        exit 1
    fi

    echo -e "${BLUE}Copying secrets from ${source_file} to ${OUTPUT_FILE}${NC}"

    cp "$source_file" "$OUTPUT_FILE"

    echo -e "${GREEN}✅ Secrets copied to ${OUTPUT_FILE}${NC}"
    echo -e "${YELLOW}⚠️  Remember to fill in actual secret values!${NC}"
}

# Main function
main() {
    parse_args "$@"

    # Determine secret manager if not specified
    if [[ -z "$SECRET_MANAGER" ]]; then
        echo -e "${YELLOW}No secret manager specified. Checking available options...${NC}"
        
        if command_exists aws && aws sts get-caller-identity >/dev/null 2>&1; then
            SECRET_MANAGER="aws"
            echo -e "${GREEN}Detected AWS credentials, using AWS Secrets Manager${NC}"
        elif command_exists railway && railway whoami >/dev/null 2>&1; then
            SECRET_MANAGER="railway"
            echo -e "${GREEN}Detected Railway CLI, using Railway${NC}"
        elif command_exists vault && vault status >/dev/null 2>&1; then
            SECRET_MANAGER="vault"
            echo -e "${GREEN}Detected Vault, using HashiCorp Vault${NC}"
        else
            echo -e "${RED}Error: No secret manager detected. Please specify one with -m option${NC}" >&2
            usage
            exit 1
        fi
    fi

    # Create backup of existing .env if it exists
    if [[ -f "$OUTPUT_FILE" ]]; then
        local backup_file="${OUTPUT_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$OUTPUT_FILE" "$backup_file"
        echo -e "${YELLOW}Backed up existing ${OUTPUT_FILE} to ${backup_file}${NC}"
    fi

    # Retrieve secrets based on manager
    case "$SECRET_MANAGER" in
        aws)
            retrieve_aws_secrets
            ;;
        railway)
            retrieve_railway_secrets
            ;;
        vault)
            retrieve_vault_secrets
            ;;
        env)
            retrieve_env_secrets "${SECRET_NAME:-.env.example}"
            ;;
        *)
            echo -e "${RED}Error: Unknown secret manager: ${SECRET_MANAGER}${NC}" >&2
            echo -e "${YELLOW}Supported managers: aws, railway, vault, env${NC}" >&2
            exit 1
            ;;
    esac

    # Set secure permissions on output file
    chmod 600 "$OUTPUT_FILE"
    echo -e "${GREEN}✅ Set secure permissions (600) on ${OUTPUT_FILE}${NC}"
}

# Run main function
main "$@"

