const API_BASE_URL = 'http://localhost:8080';

const AUTH_KEYS = ['isLoggedIn', 'authToken', 'refreshToken', 'userProfile'] as const;

let inflightRefresh: Promise<boolean> | null = null;

function readAuth(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function writeAuth(key: string, value: string, persistent: boolean): void {
  if (persistent) {
    localStorage.setItem(key, value);
    sessionStorage.removeItem(key);
    return;
  }

  sessionStorage.setItem(key, value);
  localStorage.removeItem(key);
}

function removeAuthKey(key: string): void {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
}

function isPersistentMode(): boolean {
  return localStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('authToken') !== null;
}

function buildHeaders(headers?: HeadersInit): HeadersInit {
  const token = readAuth('authToken');
  return {
    'Content-Type': 'application/json',
    ...(headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = readAuth('refreshToken');
  if (!refreshToken) return false;
  if (inflightRefresh) return inflightRefresh;

  const persistent = isPersistentMode();

  inflightRefresh = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      if (data.token) writeAuth('authToken', data.token, persistent);
      if (data.refreshToken) writeAuth('refreshToken', data.refreshToken, persistent);
      return true;
    } catch {
      return false;
    } finally {
      inflightRefresh = null;
    }
  })();

  return inflightRefresh;
}

export function saveAuth(
  data: { token?: string; refreshToken?: string; user?: unknown },
  persistent: boolean
): void {
  writeAuth('isLoggedIn', 'true', persistent);
  if (data.token) writeAuth('authToken', data.token, persistent);
  if (data.refreshToken) writeAuth('refreshToken', data.refreshToken, persistent);
  if (data.user) writeAuth('userProfile', JSON.stringify(data.user), persistent);
}

export function clearAuth(): void {
  AUTH_KEYS.forEach(removeAuthKey);
}

export function getAuthValue(key: string): string | null {
  return readAuth(key);
}

export async function logoutOnServer(): Promise<void> {
  const refreshToken = readAuth('refreshToken');
  if (!refreshToken) return;

  try {
    await fetch(`${API_BASE_URL}/user/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (error) {
    console.warn('서버 로그아웃 호출 실패:', error);
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const headers = buildHeaders(options.headers);
  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryHeaders = buildHeaders(options.headers);
      res = await fetch(url, { ...options, headers: retryHeaders });
    } else {
      clearAuth();
      window.location.href = '/login';
    }
  }

  return res;
}
