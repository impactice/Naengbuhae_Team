# Naengbuhae_Team

스마트 냉장고 관리 앱 — 프론트엔드 코드.

> 백엔드 repo: [`Naengbuhae_Team_backend`](https://github.com/impactice/Naengbuhae_Team_backend)

---

## 🆕 이번 작업 정리 (프론트 담당자용)

이번 작업의 큰 줄기:
1. **3개 OAuth 제공자 (카카오/구글/네이버) 모두 연동** — 콜백 페이지 / 추가 정보 페이지 / 마이페이지 안내
2. **네이버 로그인은 성별·생년월일까지 자동 prefill** — 백엔드가 받은 정보로 회원 정보 자동 채움
3. **회원가입 페이지 검증 강화** (백엔드 응답 처리 통합 + 클라이언트 검증 세분화)

---

### 1) 로그인 페이지 — 카카오/구글/네이버 버튼 실제 연결

`Smart Ingredient Management App/src/app/pages/Login.tsx`

**변경 사항**
- 처음엔 카카오만 연결 → 이후 구글, 마지막에 네이버까지 추가
- 세 제공자 모두 백엔드의 `/oauth2/authorization/{provider}` 엔드포인트로 redirect (Spring Security가 자동 처리)
- 한 줄로 통합

**왜?**
- 백엔드(`/oauth2/authorization/{provider}`)가 OAuth 플로우를 시작 → 제공자 인증 → 백엔드 콜백 → JWT 발급 → **프론트 콜백 페이지(`/oauth/callback`)로 redirect**
- 모든 제공자에 동일한 패턴이라 한 줄로 처리 가능

**핵심 코드 (최종)**
```ts
const handleSocialLogin = (provider: 'kakao' | 'naver' | 'google') => {
  window.location.href = `http://localhost:8080/oauth2/authorization/${provider}`;
};
```

---

### 2) OAuth 콜백 페이지 (신규)

`Smart Ingredient Management App/src/app/pages/OAuthCallback.tsx` (신규)
라우트: `/oauth/callback`

**역할**
- 백엔드가 카카오 인증 완료 후 `?token=xxx&needsAdditionalInfo=true` 형태로 이 페이지에 redirect함
- 토큰을 `localStorage`에 저장 → 프로필 fetch → 홈(`/`)으로 자동 이동
- 화면엔 "로그인 처리 중..." 로딩만 잠깐 보였다가 사라짐

**왜?**
- OAuth는 외부 서비스(카카오) 인증 후 다시 우리 사이트로 돌아올 곳이 필요함
- 일반 로그인과 동일한 키(`localStorage.authToken`, `isLoggedIn`)에 저장해서 **다른 페이지가 별도 분기 없이 동일하게 작동**하도록

**핵심 코드**
```ts
const token = searchParams.get('token');
if (!token) {
  navigate('/login', { replace: true });
  return;
}
localStorage.setItem('authToken', token);
localStorage.setItem('isLoggedIn', 'true');
userStore.fetchUserProfile().finally(() => {
  navigate('/', { replace: true });
});
```

---

### 3) 프로필 완성 페이지 (신규)

`Smart Ingredient Management App/src/app/pages/ProfileComplete.tsx` (신규)
라우트: `/profile/complete`

**역할**
- 소셜 로그인한 사용자가 **신체정보(키/몸무게/성별/생년월일/활동량/식단목표/알레르기)** 를 나중에 채워넣는 전용 페이지
- `PUT /user/me`로 저장하면 백엔드가 권장 칼로리도 자동 재계산해서 응답
- **이미 입력된 값(백엔드가 prefill해준 네이버 사용자의 성별/생년월일 포함)은 form 초기값으로 자동 표시**

**왜?**
- 소셜 로그인의 메리트는 "회원가입 정보 입력 귀찮음 회피"인데, 로그인 직후 강제로 신체정보 입력시키면 사용자 이탈 위험
- 그래서 OAuth 콜백에선 강제 진입 없이 홈으로 보내고, **마이페이지에서 자발적으로 들어올 때만** 이 페이지를 띄움
- 네이버 사용자는 이미 4개 항목(이름/이메일/성별/생년월일)이 채워진 상태로 진입해서 입력 부담이 절반 이하로 줄어듦

**버그 수정 (2026-05-06)**
- 네이버 prefill 도입 시 발견: birthDate가 `yyyy-MM-dd` 포맷(0 패딩됨)으로 오는데 select 옵션 값은 0 패딩 없는 정수("1"~"12") → 1~9월 생인 사용자는 월이 prefill 안 되던 버그
- `parseInt(month, 10)`로 0 제거 후 문자열화해서 매칭

```ts
const [year, month, day] = (profile.birthDate ?? '').split('-');
setFormData((prev) => ({
  ...prev,
  birthYear: year ?? '',
  birthMonth: month ? String(parseInt(month, 10)) : '',  // "05" → "5"
  birthDay: day ? String(parseInt(day, 10)) : '',
  // ... 나머지 필드들
}));
```

---

### 4) 마이페이지 — 미완성 프로필 안내 + 빈 데이터 방어

`Smart Ingredient Management App/src/app/pages/MyCustom.tsx`

**변경 사항**
- 신체정보(`height`/`weight`/`gender`/`birthDate`)가 비어있으면 → 페이지 상단에 **노란 CTA 카드** "정보 입력 마저하기" 노출 → 클릭 시 `/profile/complete`로 이동
- 비어있는 필드를 가진 섹션(키/몸무게/BMI 카드, 건강 목표, 권장 영양소 비율)은 **자동으로 숨김 처리**해서 `undefined cm` 같은 깨진 표시 방지
- "○○세 · 남성/여성" 표시는 정보 없을 시 "프로필 정보를 완성해주세요"로 fallback

**왜?**
- 기존 MyCustom은 신체정보가 다 있다고 가정하고 그렸기 때문에, 카카오로 가입한 사용자가 들어오면 `undefined세 · undefined` 같은 깨진 표시가 나오는 상태였음
- CTA를 통해 **자연스럽게 정보 입력 유도** (강제 X)

**핵심 코드**
```tsx
const isProfileIncomplete = !!profile && (
  !profile.height || !profile.weight || !profile.gender || !profile.birthDate
);

{isProfileIncomplete && (
  <button onClick={() => navigate('/profile/complete')} className="...">
    정보 입력 마저하기
    <p>키, 몸무게, 활동량 등을 입력하면 맞춤 칼로리와 식단 추천을 받을 수 있어요</p>
  </button>
)}
```

---

### 5) 회원가입 페이지 — 응답 처리 통합 + 검증 세분화

`Smart Ingredient Management App/src/app/pages/SignUp.tsx`

**변경 사항 A — 백엔드 응답 처리 버그 수정**
- 기존: `if (response.ok)`만 체크 → HTTP 200이면 무조건 성공 처리
- 백엔드는 중복 아이디/이메일 같은 비즈니스 에러도 **HTTP 200 + `{success: false, message: ...}`** 로 응답 → 기존 코드는 이걸 성공으로 잘못 처리해서 "회원가입 완료!" alert 후 로그인 페이지로 넘어가던 버그 있었음
- 또한 검증 실패(`@Valid`)는 HTTP 400이지만, 백엔드 `GlobalExceptionHandler`가 동일한 `{success, message}` JSON 형식으로 변환해서 응답
- → **HTTP status 무관하게 body의 `success` 플래그로 분기**, `success === false`면 `message` 키워드로 해당 필드에 인라인 매핑

**핵심 코드**
```ts
let data = {};
try { data = await response.json(); } catch { /* ... */ }

if (data.success) {
  alert('회원가입이 완료되었습니다!');
  navigate('/login');
  return;
}

const fieldErrors: Record<string, string> = {};
if (data.message.includes('아이디')) fieldErrors.username = data.message;
else if (data.message.includes('이메일')) fieldErrors.email = data.message;
else if (data.message.includes('비밀번호')) fieldErrors.password = data.message;
// ... 성별/생년월일/키/몸무게/이름/활동량/식단도 같은 방식으로 매핑
else fieldErrors.submit = data.message;
setErrors(fieldErrors);
```

**변경 사항 B — 클라이언트 검증 세분화**

기존엔 단순히 "6자 미만" / "8자 미만" 한 가지 메시지로 끝났는데, 무엇이 부족한지 사용자가 모름. 케이스별로 다른 메시지를 띄우도록 확장.

**아이디** (백엔드 정규식 `^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9]{6,}$` 와 동일한 의도):
```ts
if (!formData.username) {
  newErrors.username = '아이디를 입력해주세요';
} else if (formData.username.length < 6) {
  newErrors.username = '아이디는 6자 이상이어야 합니다';
} else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
  newErrors.username = '아이디는 영문과 숫자만 사용할 수 있습니다';
} else if (!/[a-zA-Z]/.test(formData.username)) {
  newErrors.username = '아이디에 영문을 포함해야 합니다';
} else if (!/\d/.test(formData.username)) {
  newErrors.username = '아이디에 숫자를 포함해야 합니다';
}
```

**비밀번호** (백엔드 정규식 `^(?=.*[a-z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$` 와 동일한 의도):
```ts
if (!formData.password) { /* 입력해주세요 */ }
else if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(formData.password)) { /* 한글 사용 X */ }
else if (formData.password.length < 8) { /* 8자 이상 */ }
else if (!/[a-z]/.test(formData.password)) { /* 영어 소문자 */ }
else if (!/\d/.test(formData.password)) { /* 숫자 */ }
else if (!/[^a-zA-Z0-9]/.test(formData.password)) { /* 특수문자 */ }
```

**변경 사항 C — Tab 키 UX**
- 비밀번호 / 비밀번호 확인 필드의 **눈 모양 토글 버튼**에 `tabIndex={-1}` 추가
- 기존: Tab 누르면 비밀번호 → 눈 버튼 → 비밀번호 확인 (불필요한 한 단계)
- 변경: Tab 누르면 비밀번호 → 비밀번호 확인 → 가입하기 (자연스럽게 진행)
- 마우스 클릭은 그대로 작동

---

### 6) 라우트 등록

`Smart Ingredient Management App/src/app/routes.ts`

```ts
import OAuthCallback from "./pages/OAuthCallback";
import ProfileComplete from "./pages/ProfileComplete";

// 두 라우트 모두 Root 레이아웃(하단 네비) 밖 — 처리/입력 전용 화면이라 깔끔하게 보이도록
{ path: "/oauth/callback", Component: OAuthCallback },
{ path: "/profile/complete", Component: ProfileComplete },
```

---

## 🔄 사용자 흐름 (카카오 로그인 케이스)

```
[로그인 페이지] "카카오로 시작하기" 클릭
   ↓
[카카오] 인증 + 동의(닉네임 필수)
   ↓
[Backend] JWT 발급 → /oauth/callback?token=...
   ↓
[OAuthCallback] 토큰 저장 + 프로필 조회 → / 로 이동
   ↓
[Home] 카카오 사용자가 앱 자유 사용 (강제 입력 없음)
   ↓
[하단 네비 → 나의 맞춤]
   ↓
[MyCustom] 프로필 미완성 감지 → 노란 CTA 카드 노출
   ↓
[CTA 클릭]
   ↓
[/profile/complete] 키/몸무게/성별/생년월일/활동량/식단목표 입력
   ↓
[저장] PUT /user/me → 마이페이지로 복귀, 모든 정보 정상 표시
```

---

### 7) 백엔드 측 변경 (참고용)

프론트 변경에 맞춰 백엔드도 함께 수정됨 (`Naengbuhae_Team_backend` repo):

- **카카오 OAuth 호환**: 일반 앱은 이메일 권한을 못 받으므로 `account_email` scope 제거 + `OAuth2UserInfo`가 `kakao_{providerId}@kakao.local` placeholder 자동 생성
- **빈 순환 참조 해결**: `PasswordEncoder` 빈을 `PasswordEncoderConfig`로 분리
- **회원가입 아이디 정규식 강화**: `^[a-zA-Z0-9]{6,}$` → `^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9]{6,}$` (영문만/숫자만 통과 차단)
- **성별 enum 정렬**: 새 프론트가 `'남'`/`'여'`로 보내므로 백엔드 검증/시드/계산 로직도 모두 `(남|여)` 기준으로 정렬
- **구글 OAuth 추가**: Spring Security 내장 provider 사용, scope=profile,email
- **네이버 OAuth 추가 + 회원정보 자동 prefill**:
  - 동의 항목으로 받은 성별(M/F→남/여)/생일/출생연도를 회원 정보에 자동 입력
  - `User.prefillFromOAuth(gender, birthDate)` — 비어있을 때만 채우는 안전한 setter
  - 사용자는 키/몸무게/활동량/식단목표 4개만 추가 입력하면 됨

---

## ✅ OAuth 제공자 구현 현황

| 제공자 | 백엔드 | 프론트 | 자동 prefill |
|---|---|---|---|
| 카카오 | ✅ 완료 | ✅ 완료 | name (일반 앱은 email 못 받음 → placeholder 처리) |
| 구글 | ✅ 완료 | ✅ 완료 | name, email |
| 네이버 | ✅ 완료 | ✅ 완료 | **name, email, 성별, 생년월일** (동의 항목 4개 + 출생연도) |
