import axios, { AxiosError, AxiosInstance } from 'axios';
import Cookies from 'js-cookie';
import { useSession } from 'next-auth/react';

export const ACCESS_TOKEN_KEY = 'hq_access_token';
export const REFRESH_TOKEN_KEY = 'hq_refresh_token';

export type ApiError = {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
};

const isBrowser = typeof window !== 'undefined';

export const tokenStorage = {
  getAccessToken(): string | undefined {
    if (!isBrowser) return undefined;
    // Check both cookie and localStorage for token
    return Cookies.get(ACCESS_TOKEN_KEY) || localStorage.getItem('auth_token') || undefined;
  },
  setAccessToken(token: string) {
    if (!isBrowser) return;
    // Store in both cookie and localStorage for better persistence
    Cookies.set(ACCESS_TOKEN_KEY, token, { sameSite: 'lax' });
    localStorage.setItem('auth_token', token);
  },
  clearAccessToken() {
    if (!isBrowser) return;
    Cookies.remove(ACCESS_TOKEN_KEY);
    localStorage.removeItem('auth_token');
  },
  getRefreshToken(): string | undefined {
    if (!isBrowser) return undefined;
    return Cookies.get(REFRESH_TOKEN_KEY);
  },
  setRefreshToken(token: string) {
    if (!isBrowser) return;
    Cookies.set(REFRESH_TOKEN_KEY, token, { sameSite: 'lax' });
  },
  clearRefreshToken() {
    if (!isBrowser) return;
    Cookies.remove(REFRESH_TOKEN_KEY);
  },
  clearAll() {
    this.clearAccessToken();
    this.clearRefreshToken();
  },
  // Helper method to sync with NextAuth session
  syncWithNextAuthSession(session: any) {
    if (session?.user?.token) {
      this.setAccessToken(session.user.token);
    } else {
      this.clearAll();
    }
  }
};

function toApiError(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0;
  const data: any = error.response?.data ?? {};

  // Enhanced error logging for debugging
  console.error('API Error:', {
    message: error.message,
    code: error.code,
    status: status,
    responseData: data,
    config: {
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers,
      withCredentials: error.config?.withCredentials,
      baseURL: error.config?.baseURL
    }
  });

  return {
    status,
    code: data.code,
    message: data.message || error.message,
    details: data.details
  };
}

let isRefreshing = false;
let pendingRequests: Array<(token?: string) => void> = [];

function subscribeTokenRefresh(callback: (token?: string) => void) {
  pendingRequests.push(callback);
}

function onRefreshed(token?: string) {
  pendingRequests.forEach(cb => cb(token));
  pendingRequests = [];
}

export function createApiClient(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    withCredentials: false, // Disable credentials to avoid CORS preflight issues
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  instance.interceptors.request.use((config) => {
    // Check for token in config headers first (passed from NextAuth session)
    let token: string | undefined;
    if (typeof config.headers?.Authorization === 'string') {
      token = config.headers.Authorization.replace('Bearer ', '');
    }

    // Try to get token from NextAuth session (client-side only)
    if (!token && isBrowser) {
      try {
        // Import NextAuth getSession dynamically to avoid SSR issues
        const { getSession } = require('next-auth/react');
        // Note: getSession() is async, but we can't use async in interceptors
        // We'll need to handle this differently
      } catch (error) {
        console.log('NextAuth not available in this context');
      }
    }

    // Fallback to tokenStorage for backward compatibility
    if (!token) {
      token = tokenStorage.getAccessToken();
    }

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token found and added to request:', token.substring(0, 20) + '...');
    } else {
      console.log('No token found in storage');
    }

    // Set basic headers
    config.headers = config.headers || {};
    config.headers['Content-Type'] = 'application/json';
    config.headers['Accept'] = 'application/json';

    // Log request for debugging
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      hasAuth: !!token,
      data: config.data
    });

    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest: any = error.config;
      const status = error.response?.status;

      // Attempt refresh on 401, once
      if (status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((newToken) => {
              if (!newToken) return reject(error);
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(instance(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = tokenStorage.getRefreshToken();
          if (!refreshToken) {
            tokenStorage.clearAll();
            throw error;
          }

          // This endpoint path is a placeholder; adjust when API is known
          const refreshResponse = await axios.post(
            `${baseURL}/auth/refresh`,
            { refreshToken },
            {
              withCredentials: false,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              }
            }
          );
          const newAccessToken: string | undefined = (refreshResponse.data as any)?.accessToken;
          if (newAccessToken) {
            tokenStorage.setAccessToken(newAccessToken);
            onRefreshed(newAccessToken);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return instance(originalRequest);
          }
          tokenStorage.clearAll();
          throw error;
        } catch (refreshErr) {
          tokenStorage.clearAll();
          onRefreshed(undefined);
          throw toApiError(error);
        } finally {
          isRefreshing = false;
        }
      }

      throw toApiError(error);
    }
  );

  return instance;
}

// Default instance using env var; update NEXT_PUBLIC_API_URL when API is ready
export const api = createApiClient((process.env.NEXT_PUBLIC_API_URL || 'https://hedera-quests.com').replace(/\/$/, ''));

// Helper function to create API client with NextAuth session token
export function createApiClientWithToken(token: string): AxiosInstance {
  const instance = createApiClient((process.env.NEXT_PUBLIC_API_URL || 'https://hedera-quests.com').replace(/\/$/, ''));

  // Override the request interceptor to use the provided token
  instance.interceptors.request.use((config) => {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;

    // Set basic headers
    config.headers['Content-Type'] = 'application/json';
    config.headers['Accept'] = 'application/json';

    // Log request for debugging
    console.log('API Request with session token:', {
      url: config.url,
      method: config.method,
      hasAuth: true,
      data: config.data
    });

    return config;
  });

  return instance;
}

// React hook for making authenticated API calls with NextAuth
export function useAuthenticatedApi() {
  const { data: session } = useSession();

  const makeRequest = async (method: string, url: string, data?: any) => {
    if (!session?.user?.token) {
      throw new Error('No authentication token available');
    }

    const apiClient = createApiClientWithToken(session.user.token);

    try {
      const response = await apiClient.request({
        method: method as any,
        url,
        data
      });
      return response.data;
    } catch (error) {
      console.error('Authenticated API request failed:', error);
      throw error;
    }
  };

  return {
    get: (url: string) => makeRequest('GET', url),
    post: (url: string, data?: any) => makeRequest('POST', url, data),
    put: (url: string, data?: any) => makeRequest('PUT', url, data),
    delete: (url: string) => makeRequest('DELETE', url),
    patch: (url: string, data?: any) => makeRequest('PATCH', url, data),
  };
}




