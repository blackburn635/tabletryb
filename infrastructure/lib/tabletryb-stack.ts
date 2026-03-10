import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigatewayv2Authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import { TrybFunction, type TrybFunctionSharedEnv } from './constructs/tryb-function';

// ============================================================================
// Stack Props
// ============================================================================
export interface TableTrybStackProps extends cdk.StackProps {
  stage: 'staging' | 'prod';
  domainName: string;
}

// ============================================================================
// Main Stack
// ============================================================================
export class TableTrybStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TableTrybStackProps) {
    super(scope, id, props);

    const { stage, domainName } = props;

    // ==================================================================
    // DynamoDB — Single-table multi-tenant
    // ==================================================================
    const table = new dynamodb.Table(this, 'Table', {
      tableName: `tabletryb-${stage}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ==================================================================
    // Cognito User Pool
    // ==================================================================
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `tabletryb-${stage}`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      customAttributes: {
        householdId: new cognito.StringAttribute({ maxLen: 64, mutable: true }),
        role: new cognito.StringAttribute({ maxLen: 16, mutable: true }),
      },
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPoolClientName: `tabletryb-web-${stage}`,
      userPool,
      generateSecret: false,
      authFlows: {
        userSrp: true,
      },
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
    });

    // ==================================================================
    // S3 — Recipe images
    // ==================================================================
    const imageBucket = new s3.Bucket(this, 'RecipeImageBucket', {
      bucketName: `tabletryb-images-${this.account}-${stage}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: stage !== 'prod',
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins: stage === 'prod'
            ? [`https://${domainName}`, `https://www.${domainName}`]
            : ['http://localhost:3000'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        { abortIncompleteMultipartUploadAfter: cdk.Duration.days(1) },
      ],
    });

    // ==================================================================
    // Shared environment for all Lambdas
    // ==================================================================
    const sharedEnv: TrybFunctionSharedEnv = {
      TABLE_NAME: table.tableName,
      STAGE: stage,
      RECIPE_IMAGE_BUCKET: imageBucket.bucketName,
      USER_POOL_ID: userPool.userPoolId,
      CHARGEBEE_SITE: process.env.CHARGEBEE_SITE || `tabletryb-test`,
      CHARGEBEE_API_KEY: process.env.CHARGEBEE_API_KEY || '',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
      KROGER_CLIENT_ID: process.env.KROGER_CLIENT_ID || '',
      KROGER_CLIENT_SECRET: process.env.KROGER_CLIENT_SECRET || '',
      ALLOWED_ORIGIN: `https://${domainName}`,
    };

    // IAM policies reused across many functions
    const dynamoReadPolicy = new iam.PolicyStatement({
      actions: ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:BatchGetItem'],
      resources: [table.tableArn, `${table.tableArn}/index/*`],
    });

    const dynamoCrudPolicy = new iam.PolicyStatement({
      actions: [
        'dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem',
        'dynamodb:DeleteItem', 'dynamodb:Query', 'dynamodb:BatchGetItem',
        'dynamodb:BatchWriteItem',
      ],
      resources: [table.tableArn, `${table.tableArn}/index/*`],
    });

    const cognitoAdminPolicy = new iam.PolicyStatement({
      actions: ['cognito-idp:AdminUpdateUserAttributes'],
      resources: [userPool.userPoolArn],
    });

    const sesPolicy = new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendTemplatedEmail'],
      resources: ['*'],
    });

    const s3CrudPolicy = new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
      resources: [`${imageBucket.bucketArn}/*`],
    });

    // ==================================================================
    // Lambda Functions — using reusable TrybFunction construct
    //
    // Compare: SAM needed ~25 lines per function.
    // CDK: ~5 lines per function.
    // ==================================================================

    // --- Contact (public, no auth) ---
    const contactSubmit = new TrybFunction(this, 'ContactSubmit', {
      stage, sharedEnv,
      entry: 'contact/submit.ts',
      description: 'Process contact form submissions',
      policies: [sesPolicy],
    });

    // --- Household ---
    const householdCreate = new TrybFunction(this, 'HouseholdCreate', {
      stage, sharedEnv,
      entry: 'household/create.ts',
      description: 'Create a new household',
      policies: [dynamoCrudPolicy, cognitoAdminPolicy],
    });

    const householdGet = new TrybFunction(this, 'HouseholdGet', {
      stage, sharedEnv,
      entry: 'household/get.ts',
      description: 'Get household details and members',
      policies: [dynamoReadPolicy],
    });

    const householdUpdate = new TrybFunction(this, 'HouseholdUpdate', {
      stage, sharedEnv,
      entry: 'household/update.ts',
      description: 'Update household settings',
      policies: [dynamoCrudPolicy],
    });

    const householdInvite = new TrybFunction(this, 'HouseholdInvite', {
      stage, sharedEnv,
      entry: 'household/invite.ts',
      description: 'Send household invitation email',
      policies: [dynamoCrudPolicy, sesPolicy],
    });

    const householdAcceptInvite = new TrybFunction(this, 'HouseholdAcceptInvite', {
      stage, sharedEnv,
      entry: 'household/accept-invite.ts',
      description: 'Accept invitation and join household',
      policies: [dynamoCrudPolicy, cognitoAdminPolicy],
    });

    const householdRemoveMember = new TrybFunction(this, 'HouseholdRemoveMember', {
      stage, sharedEnv,
      entry: 'household/remove-member.ts',
      description: 'Remove member from household',
      policies: [dynamoCrudPolicy, cognitoAdminPolicy],
    });

    // --- Recipes ---
    const recipesCreate = new TrybFunction(this, 'RecipesCreate', {
      stage, sharedEnv,
      entry: 'recipes/create.ts',
      policies: [dynamoCrudPolicy],
    });

    const recipesList = new TrybFunction(this, 'RecipesList', {
      stage, sharedEnv,
      entry: 'recipes/list.ts',
      policies: [dynamoReadPolicy],
    });

    const recipesGet = new TrybFunction(this, 'RecipesGet', {
      stage, sharedEnv,
      entry: 'recipes/get.ts',
      policies: [dynamoReadPolicy],
    });

    const recipesUpdate = new TrybFunction(this, 'RecipesUpdate', {
      stage, sharedEnv,
      entry: 'recipes/update.ts',
      policies: [dynamoCrudPolicy],
    });

    const recipesDelete = new TrybFunction(this, 'RecipesDelete', {
      stage, sharedEnv,
      entry: 'recipes/delete.ts',
      policies: [dynamoCrudPolicy],
    });

    const recipesAnalyze = new TrybFunction(this, 'RecipesAnalyze', {
      stage, sharedEnv,
      entry: 'recipes/analyze.ts',
      description: 'Claude AI recipe extraction (photo + URL)',
      timeout: 90,
      memorySize: 512,
      policies: [dynamoReadPolicy],
    });

    // --- Meal Plan ---
    const mealPlanGenerate = new TrybFunction(this, 'MealPlanGenerate', {
      stage, sharedEnv,
      entry: 'meal-plan/generate.ts',
      policies: [dynamoCrudPolicy],
    });

    const mealPlanGet = new TrybFunction(this, 'MealPlanGet', {
      stage, sharedEnv,
      entry: 'meal-plan/get.ts',
      policies: [dynamoReadPolicy],
    });

    const mealPlanVote = new TrybFunction(this, 'MealPlanVote', {
      stage, sharedEnv,
      entry: 'meal-plan/vote.ts',
      policies: [dynamoCrudPolicy],
    });

    const mealPlanGetVotes = new TrybFunction(this, 'MealPlanGetVotes', {
      stage, sharedEnv,
      entry: 'meal-plan/get-votes.ts',
      policies: [dynamoReadPolicy],
    });

    const mealPlanFinalize = new TrybFunction(this, 'MealPlanFinalize', {
      stage, sharedEnv,
      entry: 'meal-plan/finalize.ts',
      policies: [dynamoCrudPolicy],
    });

    // --- Grocery ---
    const groceryGenerateList = new TrybFunction(this, 'GroceryGenerateList', {
      stage, sharedEnv,
      entry: 'grocery/generate-list.ts',
      policies: [dynamoCrudPolicy],
    });

    const groceryCartPush = new TrybFunction(this, 'GroceryCartPush', {
      stage, sharedEnv,
      entry: 'grocery/cart-push.ts',
      policies: [dynamoCrudPolicy],
    });

    // --- Subscription ---
    const subscriptionCheckout = new TrybFunction(this, 'SubscriptionCheckout', {
      stage, sharedEnv,
      entry: 'subscription/create-checkout.ts',
      policies: [dynamoReadPolicy],
    });

    const subscriptionStatus = new TrybFunction(this, 'SubscriptionStatus', {
      stage, sharedEnv,
      entry: 'subscription/get-status.ts',
      policies: [dynamoReadPolicy],
    });

    const subscriptionWebhook = new TrybFunction(this, 'SubscriptionWebhook', {
      stage, sharedEnv,
      entry: 'subscription/chargebee-webhook.ts',
      description: 'Process Chargebee webhook events',
      environment: {
        CHARGEBEE_WEBHOOK_SECRET: process.env.CHARGEBEE_WEBHOOK_SECRET || '',
      },
      policies: [dynamoCrudPolicy],
    });

    // --- Image Upload ---
    const imageUpload = new TrybFunction(this, 'ImageUpload', {
      stage, sharedEnv,
      entry: 'image-upload/presigned-url.ts',
      policies: [s3CrudPolicy],
    });

    // --- Stores ---
    const storesListSupported = new TrybFunction(this, 'StoresListSupported', {
      stage, sharedEnv,
      entry: 'stores/list-supported.ts',
      policies: [dynamoReadPolicy],
    });

    // ==================================================================
    // API Gateway (HTTP API)
    // ==================================================================
    const httpApi = new apigatewayv2.HttpApi(this, 'HttpApi', {
      apiName: `tabletryb-api-${stage}`,
      description: `TableTryb API — ${stage}`,
      corsPreflight: {
        allowOrigins: stage === 'prod'
          ? [`https://${domainName}`, `https://www.${domainName}`]
          : [`https://${domainName}`, 'http://localhost:3000', 'http://localhost:3001'],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.PUT,
          apigatewayv2.CorsHttpMethod.DELETE,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
        allowCredentials: true,
        maxAge: cdk.Duration.hours(24),
      },
    });

    // JWT Authorizer
    const jwtAuthorizer = new apigatewayv2Authorizers.HttpJwtAuthorizer(
      'CognitoAuthorizer',
      `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      {
        jwtAudience: [userPoolClient.userPoolClientId],
      }
    );

    // Helper to add routes concisely
    const addRoute = (
      method: apigatewayv2.HttpMethod,
      path: string,
      fn: TrybFunction,
      options?: { noAuth?: boolean }
    ) => {
      httpApi.addRoutes({
        path,
        methods: [method],
        integration: new apigatewayv2Integrations.HttpLambdaIntegration(
          `${fn.node.id}-integration`,
          fn.function
        ),
        authorizer: options?.noAuth ? undefined : jwtAuthorizer,
      });
    };

    // --- Public routes (no auth) ---
    addRoute(apigatewayv2.HttpMethod.POST, '/v1/contact', contactSubmit, { noAuth: true });
    addRoute(apigatewayv2.HttpMethod.POST, '/v1/webhooks/chargebee', subscriptionWebhook, { noAuth: true });

    // --- Household ---
    addRoute(apigatewayv2.HttpMethod.POST,   '/v1/households', householdCreate);
    addRoute(apigatewayv2.HttpMethod.GET,    '/v1/households/{householdId}', householdGet);
    addRoute(apigatewayv2.HttpMethod.PUT,    '/v1/households/{householdId}', householdUpdate);
    addRoute(apigatewayv2.HttpMethod.POST,   '/v1/households/{householdId}/invite', householdInvite);
    addRoute(apigatewayv2.HttpMethod.POST,   '/v1/invites/{token}', householdAcceptInvite);
    addRoute(apigatewayv2.HttpMethod.DELETE,  '/v1/households/{householdId}/members/{userId}', householdRemoveMember);

    // --- Recipes ---
    addRoute(apigatewayv2.HttpMethod.POST,   '/v1/households/{householdId}/recipes', recipesCreate);
    addRoute(apigatewayv2.HttpMethod.GET,    '/v1/households/{householdId}/recipes', recipesList);
    addRoute(apigatewayv2.HttpMethod.GET,    '/v1/households/{householdId}/recipes/{recipeId}', recipesGet);
    addRoute(apigatewayv2.HttpMethod.PUT,    '/v1/households/{householdId}/recipes/{recipeId}', recipesUpdate);
    addRoute(apigatewayv2.HttpMethod.DELETE,  '/v1/households/{householdId}/recipes/{recipeId}', recipesDelete);
    addRoute(apigatewayv2.HttpMethod.POST,   '/v1/households/{householdId}/recipes/analyze', recipesAnalyze);

    // --- Meal Plan ---
    addRoute(apigatewayv2.HttpMethod.POST,   '/v1/households/{householdId}/meal-plans/generate', mealPlanGenerate);
    addRoute(apigatewayv2.HttpMethod.GET,    '/v1/households/{householdId}/meal-plans/{weekId}', mealPlanGet);
    addRoute(apigatewayv2.HttpMethod.POST,   '/v1/households/{householdId}/meal-plans/{weekId}/vote', mealPlanVote);
    addRoute(apigatewayv2.HttpMethod.GET,    '/v1/households/{householdId}/meal-plans/{weekId}/votes', mealPlanGetVotes);
    addRoute(apigatewayv2.HttpMethod.POST,   '/v1/households/{householdId}/meal-plans/{weekId}/finalize', mealPlanFinalize);

    // --- Grocery ---
    addRoute(apigatewayv2.HttpMethod.GET,    '/v1/households/{householdId}/grocery-list/{weekId}', groceryGenerateList);
    addRoute(apigatewayv2.HttpMethod.POST,   '/v1/households/{householdId}/grocery-list/{weekId}/cart-push', groceryCartPush);

    // --- Subscription ---
    addRoute(apigatewayv2.HttpMethod.POST,   '/v1/subscription/checkout', subscriptionCheckout);
    addRoute(apigatewayv2.HttpMethod.GET,    '/v1/subscription/status', subscriptionStatus);

    // --- Image Upload ---
    addRoute(apigatewayv2.HttpMethod.POST,   '/v1/households/{householdId}/images/presigned-url', imageUpload);

    // --- Stores ---
    addRoute(apigatewayv2.HttpMethod.GET,    '/v1/stores/supported', storesListSupported);

    // ==================================================================
    // CloudWatch Alarms
    // ==================================================================
    new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      alarmName: `tabletryb-api-5xx-${stage}`,
      alarmDescription: 'API Gateway 5xx errors above threshold',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5xx',
        dimensionsMap: { ApiId: httpApi.httpApiId },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'DynamoThrottleAlarm', {
      alarmName: `tabletryb-dynamo-throttle-${stage}`,
      alarmDescription: 'DynamoDB throttling detected',
      metric: table.metricThrottledRequestsForOperations({
        operations: [dynamodb.Operation.PUT_ITEM, dynamodb.Operation.GET_ITEM, dynamodb.Operation.QUERY],
        period: cdk.Duration.minutes(5),
      }),
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // ==================================================================
    // Outputs
    // ==================================================================
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.apiEndpoint,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'RecipeImageBucket', {
      value: imageBucket.bucketName,
      description: 'S3 bucket for recipe images',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
    });
  }
}
