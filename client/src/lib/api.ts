const API_BASE = (((import.meta as any).env?.VITE_API_URL as string) || '/api').replace(/\/+$/, '');

class ApiService {
  private accessToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('cw_access_token');
  }

  setToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('cw_access_token', token);
    } else {
      localStorage.removeItem('cw_access_token');
    }
  }

  getToken(): string | null {
    return this.accessToken;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (this.accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Handle token expiration & automatic refresh
    if (response.status === 401 && this.accessToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          this.setToken(data.accessToken);
          headers.set('Authorization', `Bearer ${data.accessToken}`);
          response = await fetch(url, { ...options, headers, credentials: 'include' });
        } else {
          this.setToken(null);
        }
      } catch {
        this.setToken(null);
      }
    }

    if (!response.ok) {
      let errorMsg = 'An error occurred';
      let errorDetails: unknown = null;
      try {
        const errJson = await response.json();
        errorMsg = errJson.error?.message || errJson.message || errorMsg;
        errorDetails = errJson.error?.details || null;
      } catch {
        errorMsg = response.statusText || errorMsg;
      }
      const err = new Error(errorMsg);
      (err as any).status = response.status;
      (err as any).details = errorDetails;
      throw err;
    }

    // Return blob if response is PDF or stream
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/pdf')) {
      return (await response.blob()) as unknown as T;
    }

    return response.json();
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiService();

