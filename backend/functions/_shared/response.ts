/**
 * Standardized API response helpers.
 * Ensures consistent response format across all Lambda functions.
 */

import type {
  APIGatewayProxyResultV2,
  APIGatewayProxyEventV2,
} from 'aws-lambda';
import { AppError } from './errors';

/**
 * Build CORS headers dynamically from the request origin.
 *
 * Access-Control-Allow-Origin only accepts a SINGLE origin value.
 * For staging, we allow both the Amplify domain and localhost, so
 * we check the incoming Origin header against our allowlist and
 * reflect it back if it matches.
 */
const ALLOWED_ORIGINS: string[] = process.env.STAGE === 'prod'
  ? [
      process.env.ALLOWED_ORIGIN || 'https://tabletryb.com',
      `https://www.${process.env.ALLOWED_ORIGIN?.replace('https://', '') || 'tabletryb.com'}`,
    ]
  : [
      process.env.ALLOWED_ORIGIN || 'https://staging.tabletryb.com',
      'http://localhost:3000',
      'http://localhost:3001',
    ];

export function getCorsHeaders(event?: APIGatewayProxyEventV2): Record<string, string> {
  const requestOrigin = event?.headers?.origin || '';
  const matchedOrigin = ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : ALLOWED_ORIGINS[0]; // Fallback to primary origin

  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': matchedOrigin,
    'Access-Control-Allow-Credentials': 'true',
  };
}

/** @deprecated Use getCorsHeaders(event) for proper multi-origin support */
const CORS_HEADERS = getCorsHeaders();

export function success(body: unknown, statusCode = 200, event?: APIGatewayProxyEventV2): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: event ? getCorsHeaders(event) : CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

export function created(body: unknown, event?: APIGatewayProxyEventV2): APIGatewayProxyResultV2 {
  return success(body, 201, event);
}

export function noContent(event?: APIGatewayProxyEventV2): APIGatewayProxyResultV2 {
  return {
    statusCode: 204,
    headers: event ? getCorsHeaders(event) : CORS_HEADERS,
  };
}

export function error(err: unknown, event?: APIGatewayProxyEventV2): APIGatewayProxyResultV2 {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      headers: event ? getCorsHeaders(event) : CORS_HEADERS,
      body: JSON.stringify({
        error: err.code,
        message: err.message,
      }),
    };
  }

  // Log unexpected errors for debugging
  console.error('Unexpected error:', err);

  return {
    statusCode: 500,
    headers: event ? getCorsHeaders(event) : CORS_HEADERS,
    body: JSON.stringify({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    }),
  };
}

/** Parse JSON body from API Gateway event, with validation */
export function parseBody<T>(body: string | undefined | null): T {
  if (!body) {
    throw new AppError('Request body is required', 400, 'MISSING_BODY');
  }
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new AppError('Invalid JSON in request body', 400, 'INVALID_JSON');
  }
}

/** Get a path parameter, throwing if missing */
export function getPathParam(
  pathParams: Record<string, string | undefined> | undefined,
  name: string
): string {
  const value = pathParams?.[name];
  if (!value) {
    throw new AppError(`Missing path parameter: ${name}`, 400, 'MISSING_PARAM');
  }
  return value;
}

/** Get a query parameter (optional) */
export function getQueryParam(
  queryParams: Record<string, string | undefined> | undefined,
  name: string,
  defaultValue?: string
): string | undefined {
  return queryParams?.[name] ?? defaultValue;
}
