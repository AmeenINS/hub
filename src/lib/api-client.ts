/**
 * API Client Service
 * Centralized service for making authenticated API requests
 * 
 * @module api-client
 * @description
 * This service provides a unified interface for all API requests in the application.
 * It automatically handles:
 * - Authentication token management (from cookies)
 * - Request/response formatting
 * - Error handling
 * - TypeScript type safety
 * 
 * @example
 * ```typescript
 * import { apiClient } from '@/lib/api-client';
 * 
 * // GET request
 * const users = await apiClient.get('/api/users');
 * 
 * // POST request
 * const newUser = await apiClient.post('/api/users', { name: 'John' });
 * ```
 */

/**
 * Standard API response format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Request options interface
 */
export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  skipAuth?: boolean;
}

/**
 * API Client Error class for better error handling
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public response?: any
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Get authentication token from cookies
 * @returns {string | null} The authentication token or null if not found
 */
function getAuthToken(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth-token='))
    ?.split('=')[1];

  return token || null;
}

/**
 * Build URL with query parameters
 * @param url - Base URL
 * @param params - Query parameters
 * @returns Complete URL with query string
 */
function buildUrl(url: string, params?: Record<string, string | number | boolean>): string {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  const queryString = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString();

  return `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
}

/**
 * Make an authenticated API request
 * @param url - API endpoint URL
 * @param options - Request options
 * @returns Parsed response data
 * @throws {ApiClientError} When request fails
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, skipAuth = false, headers = {}, ...fetchOptions } = options;

  // Build URL with query parameters
  const fullUrl = buildUrl(url, params);

  // Prepare headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  // Add authentication token if not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    // Make the request
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      headers: requestHeaders,
    });

    // Parse response
    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch {
      // If response is not JSON, create a generic response
      data = {
        success: response.ok,
        error: response.ok ? undefined : response.statusText,
      };
    }

    // Handle error responses
    if (!response.ok) {
      throw new ApiClientError(
        data.error || `Request failed with status ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    // Re-throw ApiClientError as-is
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Wrap other errors
    throw new ApiClientError(
      error instanceof Error ? error.message : 'An unknown error occurred'
    );
  }
}

/**
 * API Client object with HTTP methods
 */
export const apiClient = {
  /**
   * Make a GET request
   * @param url - API endpoint URL
   * @param options - Request options
   * @returns Response data
   * @example
   * ```typescript
   * const users = await apiClient.get('/api/users');
   * const user = await apiClient.get('/api/users/123');
   * const filtered = await apiClient.get('/api/users', { params: { role: 'admin' } });
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: <T = any>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'GET' }),

  /**
   * Make a POST request
   * @param url - API endpoint URL
   * @param data - Request body data
   * @param options - Request options
   * @returns Response data
   * @example
   * ```typescript
   * const newUser = await apiClient.post('/api/users', { 
   *   name: 'John Doe',
   *   email: 'john@example.com'
   * });
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: <T = any>(url: string, data?: any, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * Make a PUT request (full update)
   * @param url - API endpoint URL
   * @param data - Request body data
   * @param options - Request options
   * @returns Response data
   * @example
   * ```typescript
   * const updated = await apiClient.put('/api/users/123', {
   *   name: 'John Updated',
   *   email: 'john.new@example.com'
   * });
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put: <T = any>(url: string, data?: any, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * Make a PATCH request (partial update)
   * @param url - API endpoint URL
   * @param data - Request body data
   * @param options - Request options
   * @returns Response data
   * @example
   * ```typescript
   * const updated = await apiClient.patch('/api/users/123', {
   *   avatarUrl: '/uploads/avatar.jpg'
   * });
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch: <T = any>(url: string, data?: any, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * Make a DELETE request
   * @param url - API endpoint URL
   * @param options - Request options
   * @returns Response data
   * @example
   * ```typescript
   * await apiClient.delete('/api/users/123');
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: <T = any>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'DELETE' }),

  /**
   * Upload a file with multipart/form-data
   * @param url - API endpoint URL
   * @param formData - FormData object with file(s)
   * @param options - Request options
   * @returns Response data
   * @example
   * ```typescript
   * const formData = new FormData();
   * formData.append('file', fileBlob);
   * formData.append('entityType', 'user');
   * formData.append('entityId', userId);
   * 
   * const result = await apiClient.upload('/api/upload', formData);
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upload: async <T = any>(
    url: string,
    formData: FormData,
    options?: Omit<RequestOptions, 'body' | 'headers'>
  ): Promise<ApiResponse<T>> => {
    const { skipAuth = false, ...fetchOptions } = options || {};

    // Prepare headers (don't set Content-Type for FormData)
    const requestHeaders: Record<string, string> = {};

    // Add authentication token if not skipped
    if (!skipAuth) {
      const token = getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        method: 'POST',
        headers: requestHeaders,
        body: formData,
      });

      let data: ApiResponse<T>;
      try {
        data = await response.json();
      } catch {
        data = {
          success: response.ok,
          error: response.ok ? undefined : response.statusText,
        };
      }

      if (!response.ok) {
        throw new ApiClientError(
          data.error || `Upload failed with status ${response.status}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError(
        error instanceof Error ? error.message : 'Upload failed'
      );
    }
  },
};

/**
 * Helper function to check if user is authenticated
 * @returns {boolean} True if user has a valid auth token
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * Helper function to handle API errors consistently
 * @param error - The error object
 * @param defaultMessage - Default error message if none provided
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown, defaultMessage = 'An error occurred'): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
}
