/**
 * Clarity AI API Client
 * Handles authentication and HTTP requests
 */

import type { AuthResponse, ApiError } from './types';

const CLARITY_BASE_URL = process.env.CLARITY_API_BASE_URL || 'https://api.clarity.ai/clarity/v1';

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get or refresh authentication token
 * Tokens expire after 60 minutes
 */
export async function getToken(): Promise<string> {
  // Check if cached token is still valid (with 5-min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const key = process.env.CLARITY_API_KEY;
  const secret = process.env.CLARITY_API_SECRET;

  if (!key || !secret) {
    throw new Error('CLARITY_API_KEY and CLARITY_API_SECRET must be set');
  }

  const response = await fetch(`${CLARITY_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, secret }),
  });

  if (!response.ok) {
    const error = await response.json() as ApiError;
    throw new Error(`Auth failed: ${error.message || response.statusText}`);
  }

  const { token } = await response.json() as AuthResponse;

  // Cache token (expires in 60 minutes)
  cachedToken = {
    token,
    expiresAt: Date.now() + 60 * 60 * 1000,
  };

  return token;
}

/**
 * Clear token cache (useful for testing or forced refresh)
 */
export function clearTokenCache(): void {
  cachedToken = null;
}

/**
 * Make authenticated GET request to Clarity API
 */
export async function clarityGet<T>(
  endpoint: string,
  params?: Record<string, string | string[]>
): Promise<T> {
  const token = await getToken();

  let url = `${CLARITY_BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v));
      } else {
        searchParams.append(key, value);
      }
    }
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  return response.json() as Promise<T>;
}

/**
 * Make authenticated POST request to Clarity API
 */
export async function clarityPost<T, B = unknown>(
  endpoint: string,
  body: B
): Promise<T> {
  const token = await getToken();

  const response = await fetch(`${CLARITY_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  return response.json() as Promise<T>;
}

/**
 * Make authenticated DELETE request to Clarity API
 */
export async function clarityDelete(endpoint: string): Promise<void> {
  const token = await getToken();

  const response = await fetch(`${CLARITY_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }
}

/**
 * Handle error responses from Clarity API
 */
async function handleErrorResponse(response: Response): Promise<never> {
  let errorMessage = response.statusText;

  try {
    const error = await response.json() as ApiError;
    errorMessage = error.message || errorMessage;
  } catch {
    // Response wasn't JSON
  }

  // Handle specific status codes
  switch (response.status) {
    case 401:
      // Token expired, clear cache
      clearTokenCache();
      throw new Error(`Authentication failed: ${errorMessage}`);
    case 403:
      throw new Error(`Access denied: ${errorMessage}`);
    case 404:
      throw new Error(`Not found: ${errorMessage}`);
    case 429:
      throw new Error(`Rate limit exceeded: ${errorMessage}`);
    default:
      throw new Error(`API error (${response.status}): ${errorMessage}`);
  }
}

/**
 * Utility: Delay for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Utility: Retry with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on auth or permission errors
      if (lastError.message.includes('Authentication') ||
          lastError.message.includes('Access denied')) {
        throw lastError;
      }

      // Retry with exponential backoff
      if (attempt < maxRetries) {
        const delayMs = baseDelay * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}
