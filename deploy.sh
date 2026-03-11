#!/bin/bash
# deploy.sh — Deploy TableTryb backend via CDK
#
# Usage:
#   ./deploy.sh staging    # Deploys TableTryb-staging stack
#   ./deploy.sh prod       # Deploys TableTryb-prod stack
#
# Required env vars:
#   ANTHROPIC_API_KEY, CHARGEBEE_SITE, CHARGEBEE_API_KEY,
#   CHARGEBEE_WEBHOOK_SECRET, KROGER_CLIENT_ID, KROGER_CLIENT_SECRET

set -euo pipefail

ENV=${1:-staging}

if [[ "$ENV" != "staging" && "$ENV" != "prod" ]]; then
  echo "Usage: ./deploy.sh [staging|prod]"
  exit 1
fi

STACK_NAME="TableTryb-${ENV}"

echo "========================================="
echo "  TableTryb CDK Deploy"
echo "  Environment: ${ENV}"
echo "  Stack:       ${STACK_NAME}"
echo "========================================="

# Verify AWS credentials
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account: ${ACCOUNT_ID}"
echo "Region: ${CDK_DEFAULT_REGION:-us-east-2}"

# Build shared types package
echo ""
echo "→ Building shared package..."
npm run build:shared

# CDK deploy
echo ""
echo "→ Deploying via CDK..."
cd infrastructure

if [ "$ENV" = "prod" ]; then
  npx cdk deploy "$STACK_NAME" --require-approval broadening
else
  npx cdk deploy "$STACK_NAME" --require-approval never
fi

echo ""
echo "✅ ${STACK_NAME} deployed successfully!"
echo ""
echo "Set these in Amplify Console for the ${ENV} branch:"
echo "  REACT_APP_API_URL"
echo "  REACT_APP_USER_POOL_ID"
echo "  REACT_APP_USER_POOL_CLIENT_ID"
echo "  REACT_APP_CHARGEBEE_SITE"
