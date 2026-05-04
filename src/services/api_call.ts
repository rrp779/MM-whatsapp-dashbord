/**
 * Centralized API Service
 *
 * This service handles all HTTP requests in the application.
 * All API calls should go through this service to ensure:
 * - Consistent error handling
 * - Request deduplication
 * - Mock data support
 * - Type safety
 * - Flexible authentication support (ready for future implementation)
 *
 * Rules:
 * - Never make direct fetch calls outside this service
 * - All API responses follow the canonical format: { status, message, data }
 * - Use the appropriate method (get, post, put, delete) for each operation
 * - For authenticated endpoints, use getWithAuth, postWithAuth when auth is implemented
 */

import { USE_MOCK_DATA } from '../constants/api';

/**
 * Standard API response format
 * All API responses must follow this structure
 */
export interface ApiResponse<T> {
  /** Status code: 1 for success, 0 for error */
  status: 0 | 1;
  /** Response message */
  message: string;
  /** Response data (only present on success) */
  data?: T;
  /** Total count for paginated responses */
  total?: number;
  /** URL for next page, or boolean indicating if there's a next page */
  next?: string | boolean | null;
  /** URL for previous page, or boolean indicating if there's a previous page */
  previous?: string | boolean | null;
}

/**
 * API configuration for making requests
 */
interface ApiConfig<T> {
  /** API endpoint URL */
  url: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Whether to use mock data */
  useMockData: boolean;
  /** Query parameters for GET requests */
  queryParams?: Record<string, string | number>;
  /** Mock response data */
  mockResponse?: T;
  /** Whether to include credentials (cookies) - defaults to false for public APIs */
  includeCredentials?: boolean;
  /** Request body for POST, PUT, PATCH requests */
  body?: unknown;
}

/**
 * In-flight request tracker to prevent duplicate API calls
 * Maps request keys to their Promise
 */
const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Generates a unique key for a request based on URL and params
 *
 * @param url - The API endpoint URL
 * @param params - Query parameters
 * @returns Unique request key
 */
const generateRequestKey = (
  url: string,
  params?: Record<string, string | number>
): string => {
  const paramString = params ? JSON.stringify(params) : '';
  return `${url}:${paramString}`;
};

/**
 * Builds URL with query parameters
 *
 * @param baseUrl - The base URL
 * @param params - Query parameters to append
 * @returns Full URL with query string
 */
const buildUrl = (
  baseUrl: string,
  params?: Record<string, string | number>
): string => {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });

  return `${baseUrl}?${searchParams.toString()}`;
};

/**
 * Makes an HTTP request to the API
 *
 * Features:
 * - Prevents duplicate concurrent requests
 * - Supports mock data for development
 * - Returns typed responses
 * - Handles errors consistently
 *
 * @param config - API configuration
 * @returns Promise with the API response
 */
export async function apiRequest<T>(
  config: ApiConfig<ApiResponse<T>>
): Promise<ApiResponse<T>> {
  const {
    url,
    method,
    useMockData,
    queryParams,
    mockResponse,
    includeCredentials = false,
    body,
  } = config;

  // Use mock data if configured
  if (useMockData && mockResponse) {
    // Simulate network delay for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockResponse;
  }

  const requestKey = generateRequestKey(url, queryParams);

  // Check for in-flight request to prevent duplicates
  const existingRequest = inFlightRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest as Promise<ApiResponse<T>>;
  }

  // Create the request promise
  const requestPromise = (async (): Promise<ApiResponse<T>> => {
    try {
      const fullUrl = buildUrl(url, queryParams);

      const fetchOptions: RequestInit = {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store', // Prevent browser from using cached responses (avoids 304)
      };

      // Only include credentials when explicitly required (for authenticated endpoints)
      if (includeCredentials) {
        fetchOptions.credentials = 'include';
      }

      // Add bot user data to headers if available (for authenticated requests)
      // This allows other APIs to use bot user information
      try {
        const { getBotUserId, getBotUserName, getBotUserPhoneNumber } = await import('../utils/auth');
        const botUserId = getBotUserId();
        const botUserName = getBotUserName();
        const botUserPhoneNumber = getBotUserPhoneNumber();

        if (botUserId && botUserName && botUserPhoneNumber) {
          // Add bot user information as headers for other APIs to use
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'X-Bot-User-Id': botUserId,
            'X-Bot-User-Name': botUserName,
            'X-Bot-User-Phone-Number': botUserPhoneNumber,
          };
        }
      } catch {
        // If auth utils are not available, continue without bot user headers
        // This allows the API service to work even if auth hasn't been initialized
      }

      // Add request body for POST, PUT, PATCH
      if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(fullUrl, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle 304 Not Modified responses - they have empty bodies
      // Even with cache: 'no-store', some servers may still return 304
      if (response.status === 304) {
        // For 304, make a fresh request with cache-busting timestamp
        const cacheBustUrl = buildUrl(url, {
          ...queryParams,
          _t: Date.now(),
        });
        const freshResponse = await fetch(cacheBustUrl, fetchOptions);
        if (!freshResponse.ok) {
          throw new Error(`HTTP error! status: ${freshResponse.status}`);
        }
        const data = (await freshResponse.json()) as ApiResponse<T>;
        return data;
      }

      // Parse JSON response, handling potential empty body gracefully
      let data: ApiResponse<T>;
      try {
        const text = await response.text();
        if (!text || text.trim().length === 0) {
          // Empty response - make a fresh request with cache-busting
          const cacheBustUrl = buildUrl(url, {
            ...queryParams,
            _t: Date.now(),
          });
          const freshResponse = await fetch(cacheBustUrl, fetchOptions);
          if (!freshResponse.ok) {
            throw new Error(`HTTP error! status: ${freshResponse.status}`);
          }
          data = (await freshResponse.json()) as ApiResponse<T>;
        } else {
          data = JSON.parse(text) as ApiResponse<T>;
        }
      } catch (parseError) {
        // If JSON parsing fails, try a fresh request
        const cacheBustUrl = buildUrl(url, {
          ...queryParams,
          _t: Date.now(),
        });
        const freshResponse = await fetch(cacheBustUrl, fetchOptions);
        if (!freshResponse.ok) {
          throw new Error(`HTTP error! status: ${freshResponse.status}`);
        }
        data = (await freshResponse.json()) as ApiResponse<T>;
      }

      return data;
    } catch (error) {
      // Return error in standard API response format
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      return {
        status: 0,
        message: errorMessage,
      };
    } finally {
      // Remove from in-flight requests after completion
      inFlightRequests.delete(requestKey);
    }
  })();

  // Track the in-flight request
  inFlightRequests.set(requestKey, requestPromise);

  return requestPromise;
}

/**
 * Makes a GET request to the API
 *
 * @param config - API configuration object from constants/api.ts
 * @returns Promise with the API response
 */
export async function get<T>(config: {
  url: string;
  method: 'GET';
  useMockData: boolean;
  queryParams?: Record<string, string | number>;
  mockResponse?: ApiResponse<T>;
  includeCredentials?: boolean;
}): Promise<ApiResponse<T>> {
  return apiRequest<T>({
    url: config.url,
    method: 'GET',
    // Prioritize individual API's useMockData setting over global USE_MOCK_DATA
    // Individual APIs can override the global setting
    useMockData: config.useMockData,
    queryParams: config.queryParams,
    mockResponse: config.mockResponse,
    includeCredentials: config.includeCredentials,
  });
}

/**
 * Makes a POST request to the API
 *
 * @param config - API configuration object from constants/api.ts
 * @param body - Request body data
 * @returns Promise with the API response
 */
export async function post<T, B = unknown>(
  config: {
    url: string;
    method: 'POST';
    useMockData: boolean;
    mockResponse?: ApiResponse<T>;
    includeCredentials?: boolean;
  },
  body: B
): Promise<ApiResponse<T>> {
  return apiRequest<T>({
    url: config.url,
    method: 'POST',
    useMockData: config.useMockData,
    mockResponse: config.mockResponse,
    includeCredentials: config.includeCredentials,
    body,
  });
}

/**
 * Makes a PUT request to the API
 *
 * @param config - API configuration object from constants/api.ts
 * @param body - Request body data
 * @returns Promise with the API response
 */
export async function put<T, B = unknown>(
  config: {
    url: string;
    method: 'PUT';
    useMockData: boolean;
    mockResponse?: ApiResponse<T>;
    includeCredentials?: boolean;
  },
  body: B
): Promise<ApiResponse<T>> {
  return apiRequest<T>({
    url: config.url,
    method: 'PUT',
    useMockData: config.useMockData,
    mockResponse: config.mockResponse,
    includeCredentials: config.includeCredentials,
    body,
  });
}

/**
 * Makes a PATCH request to the API
 *
 * @param config - API configuration object from constants/api.ts
 * @param body - Request body data
 * @returns Promise with the API response
 */
export async function patch<T, B = unknown>(
  config: {
    url: string;
    method: 'PATCH';
    useMockData: boolean;
    mockResponse?: ApiResponse<T>;
    includeCredentials?: boolean;
  },
  body: B
): Promise<ApiResponse<T>> {
  return apiRequest<T>({
    url: config.url,
    method: 'PATCH',
    useMockData: config.useMockData,
    mockResponse: config.mockResponse,
    includeCredentials: config.includeCredentials,
    body,
  });
}

/**
 * Makes a DELETE request to the API
 *
 * @param config - API configuration object from constants/api.ts
 * @returns Promise with the API response
 */
export async function del<T>(
  config: {
    url: string;
    method: 'DELETE';
    useMockData: boolean;
    mockResponse?: ApiResponse<T>;
    includeCredentials?: boolean;
  }
): Promise<ApiResponse<T>> {
  return apiRequest<T>({
    url: config.url,
    method: 'DELETE',
    useMockData: config.useMockData,
    mockResponse: config.mockResponse,
    includeCredentials: config.includeCredentials,
  });
}

/**
 * Placeholder for authenticated GET request
 * This function is ready for future authentication implementation
 * 
 * When authentication is added:
 * - Add token management utilities
 * - Implement token refresh logic
 * - Add Authorization header with Bearer token
 * - Handle 401 errors with automatic token refresh
 *
 * @param url - API endpoint URL
 * @param queryParams - Optional query parameters
 * @param useMockData - Whether to use mock data
 * @param mockResponse - Mock response for development
 * @returns Promise with the API response
 */
export async function getWithAuth<T>(
  url: string,
  queryParams?: Record<string, string | number>,
  useMockData: boolean = false,
  mockResponse?: ApiResponse<T>
): Promise<ApiResponse<T>> {
  // For now, delegate to regular get
  // When auth is implemented, add token handling here
  return get<T>({
    url,
    method: 'GET',
    useMockData,
    queryParams,
    mockResponse,
    includeCredentials: false, // Will be true when auth is implemented
  });
}

/**
 * Placeholder for authenticated POST request
 * This function is ready for future authentication implementation
 * 
 * When authentication is added:
 * - Add token management utilities
 * - Implement token refresh logic
 * - Add Authorization header with Bearer token
 * - Handle 401 errors with automatic token refresh
 *
 * @param url - API endpoint URL
 * @param body - Request body data
 * @param useMockData - Whether to use mock data
 * @param mockResponse - Mock response for development
 * @returns Promise with the API response
 */
export async function postWithAuth<T, B = unknown>(
  url: string,
  body: B,
  useMockData: boolean = false,
  mockResponse?: ApiResponse<T>
): Promise<ApiResponse<T>> {
  // For now, delegate to regular post
  // When auth is implemented, add token handling here
  return post<T, B>(
    {
      url,
      method: 'POST',
      useMockData,
      mockResponse,
      includeCredentials: false, // Will be true when auth is implemented
    },
    body
  );
}
