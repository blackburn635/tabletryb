import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * Reusable Lambda function construct for TableTryb.
 *
 * Standardizes: runtime, architecture, bundling, environment, tagging.
 * In SAM, each Lambda was ~25 lines of YAML. With this construct, it's 4-5 lines of TypeScript.
 *
 * Example:
 *   const fn = new TrybFunction(this, 'CreateRecipe', {
 *     entry: 'recipes/create.ts',
 *     handler: 'handler',
 *     timeout: 30,
 *   });
 */

export interface TrybFunctionProps {
  /** Path to the handler file, relative to backend/functions/ */
  entry: string;
  /** Exported handler function name (default: 'handler') */
  handler?: string;
  /** Timeout in seconds (default: 30) */
  timeout?: number;
  /** Memory in MB (default: 256) */
  memorySize?: number;
  /** Additional environment variables beyond the shared defaults */
  environment?: Record<string, string>;
  /** Additional IAM policy statements */
  policies?: iam.PolicyStatement[];
  /** Description for the function */
  description?: string;
}

export interface TrybFunctionSharedEnv {
  TABLE_NAME: string;
  STAGE: string;
  RECIPE_IMAGE_BUCKET: string;
  USER_POOL_ID: string;
  CHARGEBEE_SITE: string;
  CHARGEBEE_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  KROGER_CLIENT_ID: string;
  KROGER_CLIENT_SECRET: string;
  ALLOWED_ORIGIN: string;
}

export class TrybFunction extends Construct {
  public readonly function: nodejs.NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    props: TrybFunctionProps & { stage: string; sharedEnv: TrybFunctionSharedEnv }
  ) {
    super(scope, id);

    // Go up from lib/constructs/ → lib/ → infrastructure/ → repo root, then into backend/functions/
    const functionsDir = path.join(__dirname, '..', '..', '..', 'backend', 'functions');

    this.function = new nodejs.NodejsFunction(this, 'Function', {
      functionName: `tabletryb-${id.toLowerCase()}-${props.stage}`,
      entry: path.join(functionsDir, props.entry),
      handler: props.handler || 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64, // Graviton — 20% cheaper
      timeout: cdk.Duration.seconds(props.timeout || 30),
      memorySize: props.memorySize || 256,
      description: props.description,

      // esbuild bundling — same as SAM Metadata.BuildProperties
      bundling: {
        minify: true,
        target: 'es2022',
        sourceMap: true,
        externalModules: ['@aws-sdk/*'], // Use Lambda-provided SDK
      },

      environment: {
        ...props.sharedEnv,
        NODE_OPTIONS: '--enable-source-maps',
        ...(props.environment || {}),
      },
    });

    // Apply additional IAM policies
    if (props.policies) {
      for (const policy of props.policies) {
        this.function.addToRolePolicy(policy);
      }
    }

    // Tag for cost tracking
    cdk.Tags.of(this.function).add('Project', 'TableTryb');
    cdk.Tags.of(this.function).add('Stage', props.stage);
  }
}