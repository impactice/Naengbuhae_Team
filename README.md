# Naengbuhae_Team

스마트 냉장고 관리 앱 — 프론트엔드 코드.

> 백엔드 repo: [`Naengbuhae_Team_backend`](https://github.com/impactice/Naengbuhae_Team_backend)

---

## 🆕 이번 작업 정리 (2026-05-08)

이번 세션의 큰 줄기:
1. **세션 저장소 전환** — `localStorage` → `sessionStorage`로 바꿔서 브라우저/컴퓨터 종료 = 자동 로그아웃
2. **백엔드 사이드 변경에 따른 영향** — 알레르기 경고 응답 / `POST /api/ingredients` 응답 형태 변경 등

---

### 1) `localStorage` → `sessionStorage` 일괄 전환

**무엇을 바꿨나**: auth/session 관련 키(`authToken`, `refreshToken`, `isLoggedIn`, `userProfile`)를 모두 `sessionStorage`로 이동.

**왜?**
- 기존: 컴퓨터 껐다 켜도 로그인 상태가 유지됨 (localStorage는 디스크에 저장돼 영구 보존)
- 사용자 경험상 "컴퓨터 재부팅 = 로그아웃"이 표준. 매번 재로그인을 강제하는 게 아니라 **세션 단위(브라우저 프로세스 살아있는 동안)** 로그인 유지하는 모델로 전환
- sessionStorage는 브라우저 탭/창 닫히면 자동 정리됨

**영향 범위**
- `apiClient.ts` (refresh/clearAuth/buildHeaders/logoutOnServer)
- `Login.tsx`, `OAuthCallback.tsx` (로그인 후 토큰 저장)
- `MyCustom.tsx` (회원 탈퇴 시 정리)
- `NutritionAnalysis.tsx` (userProfile 읽기)
- `Root.tsx` (로그인 가드)

**알아둘 점**
- sessionStorage는 **탭 단위**라 같은 사이트를 새 탭으로 열면 새 탭은 미로그인 상태. 사용자에겐 "탭 두 개 열어놓고 한 쪽만 로그인됨" 현상이 보일 수 있음 — 이는 v1 한계로 받아들이고, 필요하면 추후 BroadcastChannel 같은 걸로 탭 동기화 가능
- "자동 로그인" 체크박스가 필요해지면 → 체크 시 localStorage, 미체크 시 sessionStorage 식의 분기로 확장 가능

---

### 2) 백엔드 사이드 변경에 따른 영향 (참고)

**알레르기 경고 응답** (비파괴, opt-in)
- `GET /api/recipes`, `GET /api/recipes/recommendations`, `GET /api/ingredients`, `POST /api/ingredients` 응답에 `allergyWarnings: string[]` 필드 추가
- 비어있으면 안전, 비어있지 않으면 사용자 알레르기와 매칭된 키워드들 (예: `["땅콩"]`)
- 프론트는 이 배열이 있을 때 경고 배지/문구 표시하면 됨. 무시해도 동작은 그대로
- 추천(`/api/recipes/recommendations`)에선 알레르기 매칭된 레시피가 결과에서 자동으로 빠짐

**`POST /api/ingredients` 응답 형태 변경** (⚠️ breaking)
- 이전: `123` (생성된 ID, 숫자)
- 이후: `{id: 123, name: "...", allergyWarnings: [...], ...}` (전체 IngredientResponseDto)
- 영향: 프론트에서 `data`를 ID로 직접 쓰던 코드가 있으면 `data.id`로 변경 필요
- 이점: 등록 직후 알레르기 경고를 즉시 표시 가능

**그 외 백엔드 변경 (프론트 영향 없음)**
- 인증 엔드포인트 Rate Limiting (5회/분, 5회/분, 10회/분) — 정상 사용 시 체감 없음
- 전역 예외 처리 보강 — 에러 응답이 더 일관된 형태(`{success: false, message: ...}`)로 옴
- 입력값 검증 강화 — 잘못된 입력 시 400 응답에 한 번에 모든 field 에러가 합쳐져서 옴 (`'; '` 구분)
- prod 설정 분리, refresh token 자동 정리, 카카오 OAuth unlink — 운영 측면

---

## 이전 작업 정리 (2026-05-07)

이번 세션의 큰 줄기:
1. **인증 흐름 보강** — 로그아웃 버그 수정, 회원 탈퇴, refresh token 자동 갱신
2. **공용 API wrapper 도입** — 모든 fetch 호출을 한 곳에 모아 토큰 만료 시 자동 재발급 + 1회 재시도

---

### 1) 공용 fetch wrapper — `utils/apiClient.ts` (신규)

`Smart Ingredient Management App/src/app/utils/apiClient.ts` (신규)

**역할**
- 모든 인증 API 호출을 이 wrapper를 통과시킴
- `Authorization` 헤더 자동 부착
- 응답이 401/403이면 `refreshToken`으로 새 access token 받아서 1회 자동 재시도
- 재발급 실패 → localStorage 정리 + `/login` 이동
- 동시 요청이 401 받았을 때 refresh 호출이 중복되지 않도록 한 번만 실행하고 promise 공유

**왜?**
- access token이 30분으로 짧게 잡혀있어서, wrapper가 없으면 사용자가 화면 켜놓고 잠깐 자리 비웠다 돌아오면 모든 호출이 401로 튕겨남
- store/페이지마다 같은 401 처리 코드를 복붙하는 대신 한 곳에서 책임지게 하면 새 API 추가 시 신경 쓸 거리가 줄어듦

**핵심 코드**
```ts
// 동시에 여러 요청이 401 받았을 때 한 번만 refresh
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
      const data = await res.json();
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch { return false; }
    finally { inflightRefresh = null; }
  })();
  return inflightRefresh;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  let res = await fetch(url, { ...options, headers: buildHeaders(options.headers) });

  if (res.status === 401 || res.status === 403) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await fetch(url, { ...options, headers: buildHeaders(options.headers) });
    } else {
      clearAuth();
      window.location.href = '/login';
    }
  }
  return res;
}

export function clearAuth(): void { /* localStorage 정리 */ }
export async function logoutOnServer(): Promise<void> { /* /user/logout 호출 */ }
```

---

### 2) Login — refreshToken 저장 + ApiResponse 분기

`Smart Ingredient Management App/src/app/pages/Login.tsx`

**변경 사항**
- 백엔드 `LoginResponse`에 `refreshToken` 필드가 추가됨에 따라 localStorage에 같이 저장
- `success === false`인 경우(아이디/비번 불일치 등)도 HTTP 200으로 오므로 별도 분기 추가

**왜?**
- refresh token을 안 저장하면 wrapper의 자동 재발급 흐름이 작동 안 함
- 기존엔 `response.ok`만 보고 무조건 성공 처리해서, 잘못된 비번 입력 시에도 `localStorage`에 빈 token이 들어가던 잠재 버그 가능

**핵심 코드**
```ts
if (response.ok) {
  const data = await response.json();

  if (data.success === false) {
    alert(`로그인 실패: ${data.message || '아이디 또는 비밀번호를 확인해주세요.'}`);
    return;
  }

  localStorage.setItem('isLoggedIn', 'true');
  if (data.token) localStorage.setItem('authToken', data.token);
  if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
  navigate('/');
}
```

---

### 3) OAuth 콜백 — refreshToken query param 받기

`Smart Ingredient Management App/src/app/pages/OAuthCallback.tsx`

**변경 사항**
- 백엔드 `OAuth2SuccessHandler`가 redirect URL에 `?token=...&refreshToken=...&needsAdditionalInfo=...` 형태로 보내옴
- `searchParams.get('refreshToken')`을 받아 localStorage에 저장

**왜?**
- 일반 로그인과 OAuth 로그인 모두 동일하게 access + refresh를 받아야 wrapper가 동작
- 두 흐름이 같은 키로 저장되면 후속 페이지가 분기 없이 동일하게 동작

**핵심 코드**
```ts
const token = searchParams.get('token');
const refreshToken = searchParams.get('refreshToken');

localStorage.setItem('authToken', token);
if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
localStorage.setItem('isLoggedIn', 'true');
```

---

### 4) Root — 로그아웃 버그 + 백엔드 logout 호출

`Smart Ingredient Management App/src/app/pages/Root.tsx`

**변경 사항**
- 기존엔 `localStorage.removeItem('isLoggedIn')`만 호출 → `authToken`/`refreshToken`/`userProfile`은 그대로 남던 버그
- `clearAuth()` 헬퍼로 통일 + `userStore.clearCache()`로 메모리 캐시도 비움
- 백엔드 `/user/logout`에 `refreshToken`을 보내 서버 측 row까지 즉시 폐기

**왜?**
- 토큰이 남으면 다음 사용자가 동일 브라우저에서 직접 호출 시 잠깐 동안이라도 권한 활용 가능 (보안 리스크)
- refresh token은 서버에 보관되므로 서버에서 row를 지워야 진짜로 무효화됨 (탈취 대응)

**핵심 코드**
```ts
const handleLogout = async () => {
  if (!confirm('로그아웃 하시겠습니까?')) return;
  await logoutOnServer();   // 백엔드 /user/logout
  clearAuth();              // localStorage 일괄 정리
  userStore.clearCache();
  navigate('/login');
};
```

---

### 5) 회원 탈퇴 — MyCustom + userStore

`Smart Ingredient Management App/src/app/pages/MyCustom.tsx`
`Smart Ingredient Management App/src/app/store/userStore.ts`

**변경 사항**
- 마이페이지 맨 하단(권장 영양소 비율 아래)에 **"회원 탈퇴" 버튼** 추가
- 의도적으로 눈에 덜 띄게 디자인 (작은 회색 텍스트 + 밑줄, hover 시 빨강) — 실수 클릭 방지
- **2단계 confirm**: 1차 "정말 탈퇴?" → 2차 "마지막 확인" — 비가역 작업이라서
- 성공 시 localStorage/캐시 모두 정리 후 로그인 페이지로 이동
- `userStore.deleteAccount()` — 백엔드 `DELETE /user/me` 호출 헬퍼

**왜?**
- 인증된 사용자의 가장 기본적인 권리(자기 데이터 삭제) 제공
- 백엔드는 cascade로 식재료/레시피/장보기 + refresh token row까지 함께 정리

**핵심 코드 (MyCustom)**
```tsx
const handleDeleteAccount = async () => {
  if (!confirm('정말 회원 탈퇴 하시겠습니까?\n\n탈퇴 시 ...')) return;
  if (!confirm('마지막 확인입니다.\n탈퇴를 진행하시겠습니까?')) return;
  try {
    await userStore.deleteAccount();
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userProfile');
    userStore.clearCache();
    alert('회원 탈퇴가 완료되었습니다.');
    navigate('/login');
  } catch (error) {
    alert('회원 탈퇴 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
};
```

```tsx
<button onClick={handleDeleteAccount} className="text-sm text-gray-500 hover:text-red-600 underline">
  회원 탈퇴
</button>
```

**핵심 코드 (userStore)**
```ts
async deleteAccount(): Promise<void> {
  const response = await apiFetch('/user/me', { method: 'DELETE' });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `회원 탈퇴 실패 (${response.status})`);
  }
}
```

---

### 6) 모든 store가 apiFetch 사용하도록 마이그레이션

`Smart Ingredient Management App/src/app/store/userStore.ts`
`Smart Ingredient Management App/src/app/store/ingredientStore.ts`
`Smart Ingredient Management App/src/app/store/recipeStore.ts`

**변경 사항**
- 세 store에서 직접 `fetch()` + `getAuthHeaders()` 호출하던 패턴을 모두 `apiFetch()`로 교체
- 각 store에 흩어져 있던 `getAuthHeaders` 함수와 `API_BASE_URL` 상수 제거
- path는 wrapper의 base URL(`http://localhost:8080`) 기준으로 호출 (예: `/user/me`, `/api/ingredients`, `/api/recipes`)

**왜?**
- store별로 401 처리를 따로 짜면 신규 API 추가 시 까먹기 쉬움
- 한 곳(wrapper)에서 책임지면 새 호출도 자동으로 자동 재발급 흐름 안에 들어옴

**예시 — ingredientStore**
```ts
// Before
const response = await fetch(`${API_BASE_URL}/ingredients`, {
  headers: getAuthHeaders(),
});

// After
const response = await apiFetch('/api/ingredients');
```

POST/PUT/DELETE도 같은 패턴으로 일괄 변경.

---

## 🔄 인증 흐름 정리

```
[로그인]
   ↓
LoginResponse: { token, refreshToken } 둘 다 저장
   ↓
[일반 API 호출] apiFetch('/api/...')
   ├── access token 살아있음 → 200 OK
   └── access token 만료됨 → 401/403
                    ↓
              [자동 refresh 시도]
                    ├── 성공 → 새 토큰 저장 후 원 요청 재시도 (사용자는 못 느낌)
                    └── 실패 → clearAuth() + /login redirect
```

```
[로그아웃]                              [회원 탈퇴]
   ↓                                       ↓
POST /user/logout                       DELETE /user/me
   (refreshToken row 삭제)                (식재료/레시피/장보기/refresh tokens 일괄 삭제)
   ↓                                       ↓
clearAuth() + /login                    clearAuth() + /login
```

---

## 🔌 백엔드 측 변경 (참고용)

이번 세션 동안 백엔드도 함께 수정됨 (`Naengbuhae_Team_backend` repo의 `chore/db-setting` 브랜치):

- `DELETE /user/me` 신규 — 본인 계정 + 식재료/레시피/장보기 cascade 삭제
- `POST /user/token/refresh` 신규 — refresh token 으로 access(+새 refresh) 재발급
- `POST /user/logout` 신규 — refresh token row 즉시 폐기
- `LoginResponse`에 `refreshToken` 필드 추가
- OAuth 콜백 redirect URL에 `&refreshToken=...` 추가
- `RefreshToken` 엔티티 + `refresh_tokens` 테이블 (hibernate ddl-auto로 자동 생성)
- access 30분 / refresh 14일 (만료 시간은 properties로 조절 가능)

---

## ✅ OAuth 제공자 구현 현황

| 제공자 | 백엔드 | 프론트 | 자동 prefill |
|---|---|---|---|
| 카카오 | ✅ 완료 | ✅ 완료 | name (일반 앱은 email 못 받음 → placeholder 처리) |
| 구글 | ✅ 완료 | ✅ 완료 | name, email |
| 네이버 | ✅ 완료 | ✅ 완료 | **name, email, 성별, 생년월일** (동의 항목 4개 + 출생연도) |

---

## 📌 다음 작업 후보

- access token 만료 시간을 짧게(예: 1분) 두고 자동 refresh가 실제로 동작하는지 통합 테스트
- 다른 페이지(`SignUp`, `ProfileComplete` 등)에서 직접 fetch 호출하는 자리도 점진적으로 apiFetch로 통일
- OAuth provider unlink (탈퇴 시 카카오/구글/네이버에 unlink 호출 추가)
