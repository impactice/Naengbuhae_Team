# 냉부해 (Naengbuhae) — Frontend

스마트 냉장고 / 식재료 관리 앱 **냉부해**의 React 프론트엔드.
사용자가 보유한 식재료와 신체정보 기반으로 맞춤 레시피·칼로리·식단을 추천합니다.

> 백엔드 저장소: <https://github.com/impactice/Naengbuhae_Team_backend>

---

## 🛠 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 언어 | TypeScript |
| 프레임워크 | React 18 + Vite |
| 라우팅 | react-router |
| 스타일 | Tailwind CSS |
| 아이콘 | lucide-react |
| 상태 관리 | 가벼운 직접 구현 store + 구독 패턴 (`userStore`, `ingredientStore`) |

---

## 📁 디렉터리 구조

```
Smart Ingredient Management App/
└── src/app/
    ├── App.tsx                          # RouterProvider
    ├── routes.ts                        # 라우트 정의
    ├── pages/
    │   ├── Login.tsx                    # 일반 + 카카오 로그인
    │   ├── SignUp.tsx                   # 회원가입 (인라인 검증)
    │   ├── OAuthCallback.tsx            # 카카오 콜백 (토큰 저장)
    │   ├── ProfileComplete.tsx          # 카카오 사용자 신체정보 입력
    │   ├── Home.tsx
    │   ├── Ingredients.tsx              # 식재료 목록
    │   ├── AddIngredient.tsx
    │   ├── Priority.tsx                 # 유통기한 임박 우선순위
    │   ├── ShoppingList.tsx
    │   ├── Recipes.tsx + RecipeDetail.tsx
    │   ├── MealPlan.tsx
    │   ├── MyCustom.tsx                 # 마이페이지 (프로필 + 맞춤기능)
    │   ├── NutritionAnalysis.tsx
    │   └── NotFound.tsx
    ├── store/
    │   ├── userStore.ts                 # /user/me 호출 + 캐시
    │   └── ingredientStore.ts           # 식재료 store + 한↔영 enum 매핑
    ├── hooks/
    │   └── useUserProfile.ts            # userStore 구독 훅
    ├── components/                      # UI 컴포넌트
    └── data/, types/, utils/
```

---

## 🚀 실행

```bash
cd "Smart Ingredient Management App"
npm install
npm run dev
```

기본 포트: **5173** (Vite). 백엔드는 `http://localhost:8080`에서 실행 중이어야 합니다.

---

## 🔗 백엔드 연동 포인트

| 화면 | 호출 API | 메서드 |
|---|---|---|
| 회원가입 | `/user/signup` | POST |
| 로그인 | `/user/login` | POST |
| 카카오 로그인 시작 | `/oauth2/authorization/kakao` | GET (브라우저 redirect) |
| OAuth 콜백 (토큰 수신) | 백엔드가 `?token=...&needsAdditionalInfo=...`로 redirect | — |
| 마이페이지 | `/user/me` | GET |
| 프로필 수정 | `/user/me` | PUT |
| 식재료 목록 | `/api/ingredients` | GET |
| 유통기한 임박 | `/api/ingredients/expiring` | GET |
| 식재료 CRUD | `/api/ingredients`, `/api/ingredients/{id}` | POST/PUT/DELETE |
| 레시피 추천 | `/api/recipes/recommendations` | GET |
| 장보기 | `/api/shopping-list` 외 | GET/POST/DELETE |

**인증 헤더**: 로그인 후 `localStorage.authToken`에 저장된 JWT를 `Authorization: Bearer ...`로 전송.

---

## ✨ 이번 작업에서 추가/변경된 부분

### 1. 카카오 OAuth 소셜 로그인 흐름 통합
- **`Login.tsx`**: "카카오로 시작하기" 버튼이 실제 백엔드 OAuth 엔드포인트(`/oauth2/authorization/kakao`)로 이동
  - 네이버/구글 버튼은 placeholder ("준비 중") 안내
- **`OAuthCallback.tsx`** (신규, 라우트 `/oauth/callback`)
  - URL 쿼리 `token` 파싱 → `localStorage`에 저장 → 프로필 fetch → 홈(`/`)으로 이동
  - 실패 시 로그인 페이지로 회귀
- **`ProfileComplete.tsx`** (신규, 라우트 `/profile/complete`)
  - 카카오로 가입한 사용자를 위한 신체정보 입력 전용 페이지
  - 키·몸무게·성별·생년월일·활동량·식단목표·알레르기 입력 → `PUT /user/me` 저장

### 2. 마이페이지 (`MyCustom.tsx`) — 프로필 미완성 안내
- 신체정보(키/몸무게/성별/생년월일)가 비어있는지 자동 감지
- 비어있으면 상단에 **"정보 입력 마저하기"** CTA 카드 표시 → 클릭 시 `/profile/complete`로 이동
- 비어있는 필드를 가진 섹션(키/몸무게/BMI 카드, 건강 목표, 권장 영양소 비율)은 자동으로 숨김 처리해 깨진 표시 방지

### 3. 회원가입 (`SignUp.tsx`) — 검증 강화
- **백엔드 응답 처리 통합**: HTTP status에 의존하지 않고 `ApiResponse({success, message})`의 `success` 플래그로 분기
  - 이전: `response.ok` 체크 → 200 + `success: false`(중복 아이디)도 성공 처리하던 버그
  - 현재: `success === false`인 경우 `message`의 키워드(아이디/이메일/비밀번호/...)에 따라 해당 필드 인라인 에러로 매핑 + 자동 스크롤 + 포커스
- **클라이언트 검증 세분화**:
  - 아이디: 빈 값 / 6자 미만 / 영문·숫자 외 문자 / 영문 없음 / 숫자 없음 → 각각 다른 메시지
  - 비밀번호: 빈 값 / 한글 포함 / 8자 미만 / 영소문자 없음 / 숫자 없음 / 특수문자 없음 → 각각 다른 메시지
- **탭 키 UX 개선**: 비밀번호 눈 모양 토글 버튼에 `tabIndex={-1}` — Tab 키로 비밀번호→비밀번호 확인→가입하기로 자연스럽게 이동

### 4. 라우트 추가 (`routes.ts`)
```ts
{ path: "/oauth/callback", Component: OAuthCallback },
{ path: "/profile/complete", Component: ProfileComplete },
```
둘 다 Root 레이아웃(하단 네비) 밖에 배치 — OAuth 처리 / 입력 폼 전용 화면.

---

## 🔄 사용자 흐름 (카카오 로그인 케이스)

```
[로그인] "카카오로 시작하기" 클릭
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

## ⚠️ 알아두기

- **인증 토큰 저장소**: `localStorage.authToken`(JWT) + `localStorage.isLoggedIn`
- **프로필 캐시**: `userStore`가 메모리에 유지 + 구독자에게 브로드캐스트
- **CORS**: 백엔드가 `http://localhost:*` 와일드카드 패턴으로 허용 (5173/5174 등 어떤 포트도 OK)
- **enum 매핑**: 프론트는 영문 키(예: `weight-loss`), 백엔드는 한글 라벨(`체중 감량`) 사용 → `ingredientStore` / `SignUp` 내부에서 양방향 변환
