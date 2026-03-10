#!/usr/bin/env node
/**
 * CDK App — TableTryb infrastructure.
 *
 * Deploys two isolated stacks from the same code:
 *   - TableTryb-staging  (develop branch → staging.tabletryb.com)
 *   - TableTryb-prod     (main branch    → tabletryb.com)
 *
 * Usage:
 *   cdk deploy TableTryb-staging
 *   cdk deploy TableTryb-prod
 *   cdk deploy --all
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TableTrybStack } from '../lib/tabletryb-stack';

const app = new cdk.App();

const defaultEnv: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// ============================================================================
// STAGING
// ============================================================================
new TableTrybStack(app, 'TableTryb-staging', {
  env: defaultEnv,
  stage: 'staging',
  domainName: 'staging.tabletryb.com',
  description: 'TableTryb — Staging environment',
});

// ============================================================================
// PRODUCTION
// ============================================================================
new TableTrybStack(app, 'TableTryb-prod', {
  env: defaultEnv,
  stage: 'prod',
  domainName: 'tabletryb.com',
  description: 'TableTryb — Production environment',
});

app.synth();
