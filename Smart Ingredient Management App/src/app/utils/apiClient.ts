// 모든 인증 필요한 API 호출은 이 wrapper를 통과시킨다.
// - Authorization 헤더 자동 부착
// - 401/403 응답 시 refresh token으로 access token 재발급 후 1회 재시도
// - 재발급 실패 시 localStorage 정리 + /login 이동

const API_BASE_URL = 'http://localhost:8080';

// 동시에 여러 요청이 401 받았을 때 refresh 호출이 중복되지 않도록 한 번만 실행하고 promise 공유
let inflightRefresh: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  if (inflightRefresh) return inflightRefresh;

  inflightRefresh = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { token?: string; refreshToken?: string };
      if (!data.token || !data.refreshToken) return false;
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      inflightRefresh = null;
    }
  })();
  return inflightRefresh;
}

// 로그아웃/탈퇴/refresh 실패 시 클라이언트 측 흔적 일괄 제거
export function clearAuth(): void {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userProfile');
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...extra,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  let res = await fetch(url, { ...options, headers: buildHeaders(options.headers) });

  // 인증 실패: refresh 시도 → 성공 시 1회 재시도, 실패 시 로그인 화면으로
  if (res.status === 401 || res.status === 403) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await fetch(url, { ...options, headers: buildHeaders(options.headers) });
    } else {
      clearAuth();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
  }
  return res;
}

// 서버에 refresh token 폐기 요청까지 보내는 로그아웃 헬퍼
export async function logoutOnServer(): Promise<void> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return;
  try {
    await fetch(`${API_BASE_URL}/user/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // 네트워크 오류라도 클라이언트 측 토큰은 어차피 비우므로 무시
  }
}
