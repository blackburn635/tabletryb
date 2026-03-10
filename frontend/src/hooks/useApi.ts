/**
 * useApi — Authenticated API client hook.
 * Injects Bearer token from Cognito into all requests.
 * Replaces the prototype's api.js utility.
 */

import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiConfig } from '../config/amplify';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  skipAuth?: boolean;
}

export function useApi() {
  const { getToken } = useAuth();

  const request = useCallback(async <T = unknown>(
    path: string,
    options: ApiOptions = {}
  ): Promise<T> => {
    const { method = 'GET', body, skipAuth = false } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!skipAuth) {
      const token = await getToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${apiConfig.baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `API error: ${response.status}`,
        response.status,
        errorData.error
      );
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }, [getToken]);

  return {
    get: <T = unknown>(path: string) => request<T>(path),
    post: <T = unknown>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
    put: <T = unknown>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
    del: <T = unknown>(path: string) => request<T>(path, { method: 'DELETE' }),
  };
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}
