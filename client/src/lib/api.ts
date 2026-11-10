const API_BASE = (
  ((import.meta as any).env?.VITE_API_URL as string) ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? '/api'
    : 'https://custoworks-car-rental.onrender.com/api')
).replace(/\/+$/, '');

const CACHE_VERSION = 'v6_rates_1500_permanent';
try {
  const keys = Object.keys(sessionStorage).filter((k) => k.startsWith('cw_cache_'));
  keys.forEach((k) => sessionStorage.removeItem(k));
  sessionStorage.setItem('cw_cache_version', CACHE_VERSION);
  // Also clear any persisted client caches
  localStorage.removeItem('cw_vehicles_cache');
  localStorage.removeItem('cw_rates_cache');
} catch {}

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

const memoryCache = new Map<string, CacheItem>();

export function getFromCache<T>(key: string): T | null {
  const mem = memoryCache.get(key);
  if (mem && Date.now() - mem.timestamp < mem.ttl) {
    return mem.data as T;
  }
  try {
    const raw = sessionStorage.getItem(`cw_cache_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < parsed.ttl) {
        memoryCache.set(key, parsed);
        return parsed.data as T;
      } else {
        sessionStorage.removeItem(`cw_cache_${key}`);
      }
    }
  } catch {}
  return null;
}

export function saveToCache(key: string, data: any, ttlMs: number = 300_000): void {
  const item: CacheItem = { data, timestamp: Date.now(), ttl: ttlMs };
  memoryCache.set(key, item);
  try {
    sessionStorage.setItem(`cw_cache_${key}`, JSON.stringify(item));
  } catch {}
}

export function clearClientCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
    try {
      const keys = Object.keys(sessionStorage).filter((k) => k.startsWith('cw_cache_'));
      keys.forEach((k) => sessionStorage.removeItem(k));
    } catch {}
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) memoryCache.delete(key);
  }
  try {
    const keys = Object.keys(sessionStorage).filter((k) => k.startsWith(`cw_cache_${prefix}`));
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch {}
}

export interface ApiGetOptions extends RequestInit {
  cacheTtlMs?: number;
  forceRefresh?: boolean;
}

let slowTimerCounter = 0;
function emitSlowEvent(isSlow: boolean) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:slow-request', { detail: { isSlow } }));
  }
}

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

  clearCache(prefix?: string) {
    clearClientCache(prefix);
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

    // Set slow-network detection timer (triggers if Render cold-start or slow latency > 2500ms)
    let isSlow = false;
    const slowTimer = setTimeout(() => {
      isSlow = true;
      slowTimerCounter++;
      emitSlowEvent(true);
    }, 2500);

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    } finally {
      clearTimeout(slowTimer);
      if (isSlow) {
        slowTimerCounter = Math.max(0, slowTimerCounter - 1);
        if (slowTimerCounter === 0) {
          emitSlowEvent(false);
        }
      }
    }

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

        // If generic validation failed, enrich with first field issue
        if ((errorMsg === 'Validation failed' || errorMsg === 'Unprocessable Entity') && Array.isArray(errorDetails) && errorDetails.length > 0) {
          const first = errorDetails[0];
          if (first && first.path) {
            const isPhone = String(first.path).toLowerCase().includes('phone');
            if (isPhone) {
              errorMsg = 'Philippine mobile number is incorrect (must be 11 digits starting with 09, e.g. 09953827972)';
            } else {
              errorMsg = `${first.path}: ${first.message || 'invalid'}`;
            }
          }
        }
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

  async get<T>(endpoint: string, options?: ApiGetOptions): Promise<T> {
    const isCacheable = Boolean(options?.cacheTtlMs && options.cacheTtlMs > 0 && !endpoint.includes('/admin/'));
    const ttl = options?.cacheTtlMs ?? 0;

    if (isCacheable && !options?.forceRefresh) {
      const cached = getFromCache<T>(endpoint);
      if (cached !== null) {
        return cached;
      }
    }

    const data = await this.request<T>(endpoint, { ...options, method: 'GET' });

    if (isCacheable && ttl > 0) {
      saveToCache(endpoint, data, ttl);
    }

    return data;
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    clearClientCache();
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    clearClientCache();
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    clearClientCache();
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    clearClientCache();
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiService();
