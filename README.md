# Naengbuhae_Team

스마트 냉장고 관리 앱 — 프론트엔드 코드.

> 백엔드 repo: [`Naengbuhae_Team_backend`](https://github.com/impactice/Naengbuhae_Team_backend)

---

## 🆕 이번 작업 정리 (2026-05-20)

### 라이트 모드 활성 색상 분리

라이트에서 `--accent`가 회색(`#e9ebef`)이라 하단 네비 활성 페이지가 안 보이고 사용자 아바타도 흐릿했음. 한 토큰으로 통일하면 어디는 너무 옅고 어디는 너무 진해서 위치별로 분리:

- `theme.css` 라이트 `--accent` → 다크와 동일 옅은 스카이 `#8BCEEA` (맞춤 카드 / 홈 카드 아이콘들이 한 번에 살아남)
- `Root.tsx` 하단 네비 활성: `text-accent` → `text-sky-600 dark:text-accent` (라이트는 한 톤 진하게 대비 확보)
- `MyCustom.tsx` 사용자 아바타: 인라인 라임 `#CDFF00` + 검정 아이콘 (양 모드 동일)
- 다크 모드는 그대로 옅은 스카이 유지

### 팀원 디자인 머지 (rebase)

팀원 `[디자인수정]` 커밋(`58e766bb`: Ingredients / Recipes / RecipeDetail / Root)이랑 충돌 없이 rebase 통합. "레시피 상세에서 하단 네비 숨김" + 내 활성 색 변경 양쪽 다 살아남음.

---

## 이전 작업 정리 (2026-05-18)

### 디자인 / 색상

**기능 아이콘 색 복구**
- 다크모드 적용 시 아이콘을 전부 하늘색(`text-accent`)으로 통일했던 걸 distinct 색으로 되돌림
- `MyCustom.tsx` — 맞춤 레시피=액센트, 식단 계획=`text-blue-500`, 소비 우선순위=`text-orange-500`, 영양 분석=`text-green-500`
- `Home.tsx` — 레시피 추천=액센트, 식단 추천(Calendar) `text-accent`→`text-blue-500` (나의 맞춤과 일치)

### 브랜드 / 로고

**브랜드 로고**
- `src/assets/logo_full.png`(아이콘+워드마크 락업), `logo_icon.png`(아이콘 단독) — 투명 배경본
- 로그인 화면: "스마트 냉장고" 텍스트 → 풀 로고. 폼 너비 꽉 채움(`w-full`), 로고-폼 간격 `mb-12`→`mb-6`

**카카오 버튼 심볼**
- 빈 갈색 원 → 카카오 말풍선 심볼만(`kakao_symbol.png`, 배경 투명). 버튼 bg `#FEE500`과 자연스럽게 녹아듦. 안 쓰는 `kakao.png` 제거

### 로그인 화면 정리

- 입력칸 테두리 가독성: 아이디/비밀번호 → `bg-card border-2 border-border-strong` 통일 (비번칸은 border 자체가 없었음)
- 소셜 버튼: 가운데 정렬 유지, 카카오 심볼 크게(`w-10`), 구글 아이콘 위치 미세 보정(`mr-2.5`)

### 계정 관리

**비밀번호 변경 위치 이동**
- MyCustom 하단(회원 탈퇴 위) → 회원 카드 탭 시 프로필 수정(`ProfileComplete`, `/profile/complete`) 하단으로
- 수정 모드 + `profile.provider === 'LOCAL'`일 때만 노출. MyCustom엔 회원 탈퇴만 남음

### 기타

- 기본 테마 = 라이트 확인 (`themeMode.ts` 저장값 없으면 light, `index.html` dark 클래스 없음)

---

## 이전 작업 정리 (2026-05-15)

### 계정 관리

**비로그인 게스트 모드**
- `Login.tsx` 로그인 버튼 바로 아래 "로그인 없이 둘러보기"
- `utils/guestMode.ts` — `isGuest()` / `setGuest()` / `clearGuest()` (localStorage)
- `store/localIngredientStore.ts` — 로컬 식재료 CRUD. id는 `local-N` 문자열로 충돌 회피
- 자동 분기 — `ingredientStore` / `fridgeStore`가 `isGuest()` 검사 후 로컬/서버 라우팅, 호출자(`useIngredients` 등)는 변경 없음
- 공통 잠금 화면 `components/GuestBlocked.tsx` — 9개 페이지에서 진입 시 표시
- MyCustom 게스트 변형 — `/user/me` 호출 없이 가입/로그인 CTA
- 마이그레이션 — 로그인/OAuth 콜백 시 `utils/ingredientMigration.ts`의 `promptAndMigrate`가 `/api/ingredients/import` 호출

**회원가입 인라인 이메일 인증 (`SignUp.tsx`)**
- 이메일 옆 "인증번호 받기" → 6자리 코드 메일
- 코드 입력 + "확인" → "인증완료" 뱃지 (이메일 입력칸도 disabled)
- 이메일 변경 시 `handleChange`에서 인증 상태 자동 무효화
- 백엔드: `POST /user/email/send-code`, `POST /user/email/verify-code`

**회원가입 후 username 자동 채우기**
- `navigate('/login', { state: { username } })` → Login의 `formData.username` 초기값으로 자동

**비밀번호 변경 (`/change-password`)**
- `pages/ChangePassword.tsx` — 현재 비번 + 새 비번(확인) → `POST /user/me/password`
- Root 하위라 로그인 가드됨
- MyCustom의 회원 탈퇴 위, `profile.provider === 'LOCAL'`일 때만 노출
- `userStore.UserProfile`에 `provider` 필드 추가

**죽은 매직 링크 흔적 정리**
- `pages/VerifyEmail.tsx` + 라우트 삭제
- `Login.tsx`의 `pendingVerification` 상태 + 노란 배너 제거
- `MyCustom.tsx`의 `EmailVerificationBanner` 제거

---

### 식재료 / 장보기

**다중 선택 일괄 삭제 (식재료 + 장보기)**
- 두 페이지 모두 우측 `CheckSquare` 버튼으로 선택 모드 진입, 카드 클릭으로 토글, 액션 바 "전체 선택 + N개 삭제"
- `ingredientStore.bulkDeleteIngredients(ids)` — 게스트 로컬 순차 / 로그인 `/api/ingredients/bulk-delete`
- `ingredientStore.bulkDeleteShoppingItems(ids)` — `/api/shopping-list/bulk-delete`

**장보기 자동 제안 ("이건 어때요?")**
- ShoppingList 상단 lime 톤 가로 스크롤 chip — 자주 비우는데 없는 식재료
- 각 chip 탭 시 1개 단위 추가, 추가 후 `shoppingList.length` 변경 → `useEffect`로 제안 자동 재요청
- `fridgeStore` 구독으로 냉장고 전환 시 즉시 갱신

**레시피 부족 재료 자동 다이얼로그**
- `RecipeDetail` 진입 시 부족 재료가 있고 장보기에도 없으면 모달 자동 노출
- 부족 재료 목록 미리보기 + "장보기에 추가" / "괜찮아요"
- 같은 세션 동안 같은 레시피 다시 봐도 안 묻도록 sessionStorage 기록
- 하단 버튼도 `ingredientStore.bulkAddShoppingItems`로 통일 — 단건 N번 호출 → 단일 요청

---

### 레시피 즐겨찾기
- `Recipes.tsx` 카드 우측 상단에 `Heart` 아이콘 (Link 안이라 `e.preventDefault + stopPropagation`)
- 필터 chips에 "즐겨찾기" 추가 — `match.recipe.favorite`으로 필터
- `RecipeDetail.tsx` 헤더 우측에 하트 토글
- `recipeStore.toggleFavorite` — 캐시 즉시 동기화 + listeners 알림
- `Recipe` 타입에 `favorite?: boolean`

---

### 알림

**알림 탭 → 정확한 식재료 카드로 스크롤 + 강조**
- `NotificationCenter` onTap이 `"ingredient:{id}"` 패턴 인식 → `/ingredients?highlight={id}`로 navigate
- `Ingredients.tsx`가 `useSearchParams`로 `highlight` 읽고 해당 카드에 ref 설정
- 진입 직후 `scrollIntoView` + 노란 ring으로 2.6초간 강조 후 fade-out

**알림 배지 실시간 갱신 (polling + visibility)**
- `store/notificationStore.ts` — 전역 unread count store
- Root에서 로그인 시 `start()` / 로그아웃 시 `stop() + reset()`
- 탭 visible일 때 30초 간격 + `visibilitychange` 시 즉시 refresh
- MyCustom이 `useSyncExternalStore`로 구독
- NotificationCenter 진입 직후 read-all + `store.reset()`

---

### 시각화

**가족 활동 통계 차트 (`FamilyActivity.tsx`)**
- recharts 사용 (`MealPlan`, `NutritionAnalysis`와 동일)
- 멤버별 활동 — `BarChart` + Bar 2개 (추가/비움)
- 자주 추가/비운 TOP5 — `PieChart` + 색깔 범례 5단계 (`PIE_COLORS` / `PIE_COLORS_ORANGE`)
- 기존 멤버 행/랭크 리스트(progress bar)는 그대로 유지

**우선순위 화면: 막대 → 도넛 (`Priority.tsx`)**
- 위험/주의/안전 비율을 `PieChart`로 시각화 (가운데 총 개수)
- stat box에 개수 + % 함께 노출
- 0인 카테고리 자동 제외해 슬라이스 깔끔하게

---

### 디자인 시스템 / 다크모드 (외주 디자인 적용)

**토큰 시스템 — `styles/theme.css` 단일 소스**
- `:root`(라이트) / `.dark` 두 블록 + `@theme inline` 매핑으로 시맨틱 토큰 운용
- 다크 팔레트: 배경 `#08090A` · 카드 `#191C20` · 표면 `#23272D` · 보더 `rgba(255,255,255,.05/.10)`
- `--primary` = 라이트 라임 `#CDFF00` / 다크 off-white `#F2F3EE` (primary CTA 색, 네온 제거)
- `--accent` = sky `#8BCEEA` — AI·추천·진행바·활성탭·선택표시 전용 (CTA엔 안 씀)
- `--status-{danger,warning,safe}` + `-bg`, `--chart-1~5` 다크 튜닝값
- `tailwind.css`의 임시 accent override 제거 — theme.css가 유일 소스
- 다크모드 전제: 페이지가 시맨틱 토큰을 써야 효과 → raw `dark:bg-gray-*` 전부 토큰화

**페이지 전면 토큰화**
- `bg-white→bg-background`, `bg-gray-50→bg-card`, `text-gray-*→text-muted-foreground`,
  `border-gray-*→border-border`, 검정 CTA→`bg-foreground/text-background`
- primary 버튼: `bg-[var(--primary)]` + 반드시 `color:var(--primary-foreground)`
  (안 주면 다크에서 off-white 배경+off-white 글자 = 안 보임. 전 버튼 수정 완료)
- 못생긴 보라/주황/초록 그라데이션 카드 13곳 → `bg-card border border-border`
  (Home 상태·Priority 분석 카드엔 은은한 sky glow, 알림 배너는 좌측 컬러 레일)
- 상태 행/배지 → `var(--status-*-bg)` + `var(--status-*)`

**테마 토글**
- `utils/themeMode.ts` — `'light' | 'dark'` 만 (system 제거). 기존 `'system'` 저장값은
  최초 1회 OS 설정 따라 light/dark로 확정 후 저장(마이그레이션). 기본 라이트
- MyCustom 토글 칩 2개(라이트/다크), `main.tsx`에서 `themeModeStore.init()`
- `@custom-variant dark (&:where(.dark, .dark *))` — `.dark` 엘리먼트 자체 포함

**컴포넌트 다듬기**
- `FridgeSelector` 드롭다운: `bg-popover text-popover-foreground` (이전 `bg-white` 고정 →
  다크에서 흰바탕+밝은글자 안보이던 버그), 선택/체크 표시 `text-accent`
- MyCustom 맞춤기능 4카드 아이콘 전부 `text-accent`(sky)
- Priority "외 N개 더 보기" → `/ingredients` 링크(sky)
- `Root` 하단 네비 활성 탭 `text-accent`(sky)

> 참고: 외주 README의 "theme.css만 바꾸면 80%" 전제는 이 코드베이스엔 안 맞았음
> (페이지가 raw gray 사용, 시맨틱 토큰 미사용). 토큰 교체 + 페이지 전환을 같이 해야 효과.

---

### 기타
- `main.tsx`에서 MSW dev 모킹 import 제거 (`msw` 패키지 미설치 + 백엔드 연동 완료 상태)

---

## 이전 작업 정리 (2026-05-14)

**식재료 검색 + 인앱 알림 센터 + 가족 활동 통계.**

1. **이름 검색 + 만료된 것만 보기 토글** — `Ingredients.tsx`
2. **인앱 알림 센터** — `/notifications` 신규 페이지
3. **가족 활동 통계** — `/family-activity` 신규 페이지

> 앱(Flutter)에도 동일하게 들어감 — [Naengbuhae_App README](https://github.com/MONBRUNO/Naengbuhae_App)

---

### 1) 식재료 검색 + 만료 토글

`Smart Ingredient Management App/src/app/pages/Ingredients.tsx`에 다음 두 가지 추가:

- **이름 검색창** — 카테고리/보관/정렬 필터 윗쪽에 `<input type="text">` + `Search` 아이콘 + clear `X` 버튼. 대소문자 무관 부분 일치 (`name.toLowerCase().includes(query)`)
- **만료된 것만 보기 토글** — 필터 row 바로 아래 체크 chip. on 시 `calculateDDay(item.expirationDate) < 0` 항목만 노출

`filtered` 파이프라인에 두 조건을 카테고리/보관 다음 단계로 끼워 넣었음. 빈 상태 메시지도 분기 갱신.

---

### 2) 인앱 알림 센터 — `/notifications`

`NotificationCenter.tsx` 신규. `GET /api/notifications`로 최신 50개 가져오고, 진입 시 `POST /api/notifications/read-all` 자동 호출(본 시점에 읽음 처리).

- 안읽은 항목: lime-50 배경 + 좌측 dot
- 항목 클릭 시 `route` 키로 분기 → `/fridges` / `/ingredients` / `/meal-plan`
- 시간 표시: 분/시간/일 단위, 7일 넘으면 날짜

**진입점**: `/my-custom` 상단 카드. `GET /api/notifications/unread-count`로 빨간 뱃지(99+ 처리).

---

### 3) 가족 활동 통계 — `/family-activity`

`FamilyActivity.tsx` 신규. 현재 선택된 냉장고 기준(`fridgeStore.getSelected()`)으로 `GET /api/fridges/{id}/activity-stats?days=N`.

- 헤더 카드 — lime-yellow 그라데이션 + 전체 추가/비움 카운트
- 기간 chips (7/30/90일) — 변경 시 즉시 refetch
- 멤버별 row — `+N -N` 컬러 뱃지
- 자주 추가/비운 식재료 TOP 5 — 1~5 순위 + 비율 막대바

**진입점**: `/my-custom`의 "가족 활동" 카드.

`useSyncExternalStore`로 `fridgeStore` 구독 — 다른 페이지에서 냉장고 전환하면 이 페이지도 자동 반응.

---

## 더 이전 작업 정리 (2026-05-13)

1. **다중 냉장고 + 가족 공유** — 한 계정이 여러 냉장고를 가지고, 6자리 초대 코드로 다른 사용자를 끌어들임
2. **AI 사진 인식 (Gemini Vision)** — 식재료 단건 인식 + 영수증 OCR. 결과로 폼 자동 채움
3. **카테고리 4개 추가** — 가공식품/음료/조미료/간식. 기존 7개 → 11개
4. **비밀번호 찾기 + 이메일 인증 화면** — 이메일로 받은 링크 기반 reset / verify 흐름

---

### 1) 다중 냉장고 + 초대 코드 — `fridgeStore` / `FridgeSelector` / `FridgeManagement`

**무엇을 바꿨나**: 식재료가 단일 "내 냉장고"에 종속되던 구조 → 한 사용자가 여러 냉장고에 속할 수 있게. 헤더에 냉장고 선택 칩을 두고, 별도 관리 페이지에서 생성/이름변경/멤버초대/나가기 가능.

**왜?**
- 가족이 한 냉장고를 공유하는 시나리오 — 부모/자식이 같은 식재료 목록을 보고 같이 관리
- 회사 탕비실, 자취방 셰어 등도 같은 메커니즘으로 커버
- "오너" 개념 없음 — 멤버는 모두 동등. 누구나 초대 가능, 누구나 떠날 수 있음 (사용자 결정)

**핵심 코드 (fridgeStore)**
```ts
class FridgeStore {
  private listeners: Set<() => void> = new Set();
  private fridgesCache: Fridge[] = [];
  private selectedId: number | null = null;

  // 첫 로그인/리프레시 후 호출. 멤버인 모든 냉장고 가져오기.
  async fetchFridges(): Promise<Fridge[]> { /* GET /api/fridges */ }

  // 헤더 칩에서 선택. localStorage에 저장해 페이지 이동 후에도 유지.
  setSelected(id: number): void {
    this.selectedId = id;
    localStorage.setItem('selectedFridgeId', String(id));
    this.notifyListeners();
  }

  getSelectedId(): number | null { return this.selectedId; }

  async createFridge(name: string): Promise<void> { /* POST /api/fridges */ }
  async rename(id: number, name: string): Promise<void> { /* PATCH */ }
  async deleteFridge(id: number): Promise<void> { /* DELETE */ }
  async issueInvite(id: number): Promise<string> { /* POST /api/fridges/:id/invites */ }
  async joinByCode(code: string): Promise<void> { /* POST /api/fridges/join */ }
  async leave(id: number): Promise<void> { /* POST /api/fridges/:id/leave */ }
  async removeMember(fridgeId: number, userId: number): Promise<void> { /* DELETE */ }
}
```

**초대 코드 정책**
- 한 냉장고당 활성 코드 1개. 24시간 안에 재발급 요청해도 기존 코드를 재사용 (revoke되지 않음 = 안전)
- 24시간 지나면 자동 만료 → 다음 발급 요청 시 새 코드 생성
- 다회용 — 코드 하나로 여러 명이 들어올 수 있음

**관리 페이지 UX**
- 카드 그리드로 냉장고 나열 → 카드 클릭 시 상세 모달
- 상세에서 멤버 목록 + 초대 코드 + 이름변경/삭제/나가기 액션
- `window.prompt` 대신 `TextPromptModal` 컴포넌트 사용 (브라우저 기본 다이얼로그가 못생겨서)

**영향 범위**
- 신규: `store/fridgeStore.ts`, `hooks/useFridges.ts`, `components/FridgeSelector.tsx`, `pages/FridgeManagement.tsx`, `components/TextPromptModal.tsx`
- `Root.tsx` — 로그아웃 시 `fridgeStore.clear()` 추가
- `ingredientStore.ts` — `fetchIngredients`/`addIngredient`가 `fridgeStore.getSelectedId()`를 읽어 쿼리/바디에 `fridgeId` 부착 (동적 import로 순환 의존 회피)

**알아둘 점**
- 백엔드는 OAuth 가입자/일반 가입자 모두 가입 직후 "<이름>의 냉장고"가 자동 생성됨. 프론트는 빈 상태를 따로 처리할 필요 없음
- 멤버 제거 시 본인이 본인을 제거해도 동작 (= "나가기"의 별칭). 별도 분기 안 함
- 단일 냉장고 시절 데이터는 백엔드의 `FridgeMigrationRunner`가 자동 이관 — 프론트는 신경 X

---

### 2) AI 사진 인식 — 단건 / 영수증

**무엇을 바꿨나**: 식재료 추가 화면에 카메라 버튼 추가. 사진 한 장 → Gemini가 보고 `{name, category, storage, quantity, unit, expiryDaysByStorage}` 반환 → 폼 자동 채움. 영수증은 별도 페이지 `AddByReceipt`에서 여러 항목 일괄 인식 → 편집 가능한 리스트 → 일괄 저장.

**왜?**
- 식재료 추가가 가장 자주 일어나는 작업인데 매번 이름/카테고리/유통기한을 손으로 치는 게 마찰
- 보관 방법(냉장/냉동/실온)은 사용자가 모를 수 있음 → AI가 추천하는 게 더 정확. 표시 유통기한을 모델이 알고 있어 폼이 합리적인 기본값으로 prefill됨
- 영수증 한 번에 5~10개씩 사서 일일이 입력하던 흐름을 한 번의 OCR로 단축

**핵심 코드 — multipart 업로드 wrapper**
```ts
// apiUpload — 사진 같은 파일 업로드용. Content-Type은 브라우저가 boundary와 함께
// 자동으로 붙이므로 직접 부착하면 안 됨 (붙이면 boundary 누락으로 400)
export async function apiUpload(path: string, formData: FormData): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const buildAuthOnlyHeaders = (): HeadersInit => {
    const token = readAuth('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  let res = await fetch(url, { method: 'POST', body: formData, headers: buildAuthOnlyHeaders() });

  if (res.status === 401 || res.status === 403) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await fetch(url, { method: 'POST', body: formData, headers: buildAuthOnlyHeaders() });
    } else {
      clearAuth();
      window.location.href = '/login';
    }
  }
  return res;
}
```

**호출 흐름 (단건)**
- 사용자가 사진 선택 → `FormData`에 `image` 키로 첨부
- `apiUpload('/api/ingredients/recognize', formData)` → 백엔드가 Gemini Vision (`gemini-2.5-flash`)에 structured output schema와 함께 요청
- 응답으로 폼 필드 자동 prefill. 사용자가 검토 후 수정 가능

**알아둘 점**
- 사진은 인식용으로만 백엔드에 전달 — 저장은 안 함. `imageUrl` 필드 자체가 없음 (서버 디스크 부담 + 프라이버시 양쪽 고려)
- 단건 응답 구조는 추가 폼과 1:1 매칭 → 매핑 코드 거의 없음
- 영수증 응답은 배열 → 각 항목을 carded list로 렌더, 사용자가 체크박스로 빼거나 수량/카테고리 즉시 수정

**저장 버튼 위치 버그**
- 영수증 페이지의 저장 버튼이 처음엔 `bottom-0`이라 하단 네비게이션과 겹쳤음 — `bottom-16`(네비 위) + `pb-40`(body 패딩)으로 수정

---

### 3) 카테고리 확장 — 7개 → 11개

**무엇을 바꿨나**: 기존 `vegetable/meat/dairy/grain/seafood/fruit/etc`에 `processed/beverage/condiment/snack` 추가. 가공식품(라면/즉석밥/통조림), 음료(우유/주스/물), 조미료(간장/된장/소금), 간식(쿠키/초콜릿).

**왜?**
- AI 인식 결과가 "기타"로 자주 떨어지던 것들이 가공식품/음료/조미료/간식 — 사용자 입장에서 "기타"가 너무 막연
- 카테고리별 색상 배지로 식별 가능해야 한눈에 들어옴

**핵심 코드 (types/ingredient.ts)**
```ts
export type CategoryType =
  | 'vegetable' | 'meat' | 'dairy' | 'grain' | 'seafood' | 'fruit'
  | 'processed' | 'beverage' | 'condiment' | 'snack' | 'etc';
```

**한↔영 매핑 (ingredientStore.ts)**
```ts
const CATEGORY_TO_KO: Record<CategoryType, string> = {
  vegetable: '채소', meat: '육류', dairy: '유제품', grain: '곡물',
  seafood: '해산물', fruit: '과일',
  processed: '가공식품', beverage: '음료', condiment: '조미료', snack: '간식',
  etc: '기타',
};
```

**영향 범위**
- `types/ingredient.ts` — `CategoryType` union 확장
- `ingredientStore.ts` — `CATEGORY_TO_KO` / `CATEGORY_FROM_KO` 양방향 매핑
- 카테고리 셀렉터 / 필터 UI 4개 옵션 추가
- 색상 배지 정의에도 4개 추가 필요 — 카드 컴포넌트 측에서 처리

---

### 4) 비밀번호 재설정 + 이메일 인증 화면

**무엇을 바꿨나**: 로그인 페이지에 "비밀번호를 잊으셨나요?" 링크 추가 → `ForgotPassword.tsx`. 이메일 입력 → 백엔드가 reset 링크 발송 → 사용자가 메일의 링크 클릭 → `ResetPassword.tsx`에서 새 비밀번호 입력. 회원가입 후 자동 발송되는 verification 메일은 `VerifyEmail.tsx`로 처리.

**왜?**
- 실배포 시 필수 기능 — 비밀번호 잊으면 계정 복구 불가능하면 사용자 이탈
- 이메일 인증은 일단 옵트인 (가입 자체는 인증 없이도 가능, 안 한 사용자는 비밀번호 찾기를 못 쓰는 식으로 자연스럽게 유도). 강제 여부는 결정 보류

**화면 흐름**
```
[Login]
  → "비밀번호를 잊으셨나요?" 클릭
  → /forgot-password (이메일 입력)
  → 백엔드: POST /user/password/forgot → 메일 발송
  → 사용자가 메일에서 링크 클릭
  → /reset-password?token=xxx (새 비밀번호 입력)
  → 백엔드: POST /user/password/reset → 완료
  → /login으로

[SignUp]
  → 가입 직후 백엔드가 인증 메일 자동 발송
  → 사용자가 메일에서 링크 클릭
  → /verify-email?token=xxx
  → 백엔드: POST /user/verify-email → emailVerified=true
```

**프로필 페이지에 인증 상태 배너**
- `userStore.UserProfile`에 `emailVerified?: boolean` 추가
- 미인증 사용자에게는 프로필 페이지 상단에 노란 배너 + "다시 보내기" 버튼

**알아둘 점**
- 토큰은 백엔드의 `UserToken` 엔티티에서 `Type.EMAIL_VERIFY` / `Type.PASSWORD_RESET` 두 종류로 관리
- `POST /user/password/forgot`은 존재하지 않는 이메일에도 동일한 응답을 반환 (user enumeration 방지) — 프론트는 "메일을 보냈습니다" 메시지만 표시
- 앱(Flutter) 쪽에서 reset 링크 클릭 시 일단 웹으로 빠짐 — 딥링크는 추후 작업

---

### 5) Git 정리 — feat 브랜치 통합 후 잔재 삭제

- 작업 중이던 `feat/backend-integration`, `feat/kakao-oauth-integration` 두 브랜치의 핵심 코드를 모두 `main`으로 통합
- 로컬 + `monbruno` 원격 + `origin` 원격에서 feat 브랜치 일괄 삭제
- 이후 작업은 `main` 단일 브랜치에서 진행

---

## 더 이전 작업 정리 (2026-05-08)

이번 세션의 큰 줄기:
1. **세션 저장소 정책 정리** — `localStorage` 일변도 → "로그인 상태 유지" 체크박스로 사용자가 직접 선택
2. **저장소 추상화** — `apiClient`에 `saveAuth/clearAuth/readAuth` 헬퍼를 두고 storage 분기를 한 곳에 가둠
3. **프로필 페이지 입력/수정 모드 분기** — 같은 페이지가 신규 정보 입력과 기존 정보 수정 둘 다 처리하도록 텍스트 동적 변경
4. **백엔드 사이드 변경에 따른 영향** — 알레르기 경고 응답 / `POST /api/ingredients` 응답 형태 변경 / refresh token 만료 365일 등

---

### 1) "로그인 상태 유지" 체크박스 + 양쪽 storage 추상화

**무엇을 바꿨나**: Login 화면에 체크박스를 두고, 체크 시 `localStorage`(영구), 미체크 시 `sessionStorage`(세션 종료 시 휘발)에 인증 정보를 저장. OAuth 로그인은 "간편 로그인" 의도라 항상 영구로 간주.

**왜?**
- 이전 단계의 sessionStorage 일변도는 "재부팅 = 로그아웃"을 보장했지만, "기억해줘"라는 정상적 UX 요구를 못 받음
- 표준 패턴: 체크박스 분기. 사용자가 직접 선택
- 양쪽 storage 모두 보고 / 한쪽에만 쓰는 추상화로 application 코드는 storage를 신경 쓰지 않게 함

**핵심 코드 (apiClient.ts)**

```ts
function readAuth(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function writeAuth(key: string, value: string, persistent: boolean): void {
  if (persistent) {
    localStorage.setItem(key, value);
    sessionStorage.removeItem(key);  // 반대쪽 잔재 방지
  } else {
    sessionStorage.setItem(key, value);
    localStorage.removeItem(key);
  }
}

export function saveAuth(data: { token?, refreshToken?, user? }, persistent: boolean) {
  writeAuth('isLoggedIn', 'true', persistent);
  if (data.token) writeAuth('authToken', data.token, persistent);
  // ... 나머지 키도 동일
}

export function clearAuth() {
  // 양쪽 storage 다 정리 — 영구/세션 어느 쪽이든 흔적 제거
  for (const key of AUTH_KEYS) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }
}
```

**refresh 시 토큰 위치 유지 로직**

apiClient의 `refreshAccessToken`은 새로 받은 토큰을 **기존 토큰이 있던 storage 위치 그대로** 저장 (`isPersistent()`로 판단). 사용자가 한 번 정한 영구/세션 모드를 자동 갱신 후에도 유지.

**영향 범위**
- 신규 export: `saveAuth(data, persistent)` — Login/OAuth 콜백에서 사용
- `apiClient.ts` — 양쪽 storage 추상화 + persistent 감지 + refresh 시 위치 유지
- `Login.tsx` — `rememberMe` state + 체크박스 UI + `saveAuth` 호출
- `OAuthCallback.tsx` — `saveAuth(data, true)` (OAuth는 항상 영구)
- `MyCustom.tsx` — 회원 탈퇴 시 `clearAuth()`로 양쪽 storage 정리
- `Root.tsx` — `isLoggedIn` 체크 시 양쪽 storage 모두 봄
- `NutritionAnalysis.tsx` — `userProfile` 읽기 시 양쪽 storage 모두 봄

**알아둘 점**
- 백엔드 refresh token 만료가 14일 → **365일**로 늘어남 (`Naengbuhae_Team_backend` repo). rotation과 합쳐 활성 사용자는 사실상 영구 로그인
- 미체크 시 sessionStorage라 **탭 단위 세션** — 새 탭에선 미로그인 (필요 시 BroadcastChannel로 탭 동기화 가능)
- 체크 + 영구 모드: 디스크에 토큰이 남으므로 공용 PC에선 권장 X. 프론트에서 추후 안내 문구 필요할 수도

---

### 2) 프로필 페이지 — 입력 / 수정 모드 동적 분기

**무엇을 바꿨나**: `ProfileComplete.tsx` 한 페이지가 사용자 상태에 따라 두 가지 모드로 동작하도록.

| 상태 | 헤더 제목 | 본문 헤딩 | 제출 버튼 | 성공 알림 |
|---|---|---|---|---|
| 입력 모드 (소셜 로그인 신규 등) | 프로필 정보 입력 | 맞춤 추천을 위해 | 저장하기 | 저장됐습니다 |
| 수정 모드 (기존 사용자) | 프로필 수정 | 정보를 수정해주세요 | 수정하기 | 수정됐습니다 |

판정 기준은 `MyCustom.tsx`의 `isProfileIncomplete`와 동일: `height/weight/gender/birthDate` 중 하나라도 비어있으면 "입력" 모드.

**부수 수정 — 옛 더러운 데이터 방어**:
- 옛 버전이나 직접 DB 삽입으로 들어간 잘못된 값(`gender="남성"`, `activityLevel="sedentary"` 등)이 폼 prefill 시 그대로 들어가 form-level 검증을 통과하고 백엔드에서 400 터지는 버그가 있었음
- 이제 prefill 시 폼이 허용하는 값 화이트리스트(`VALID_GENDERS`, `VALID_ACTIVITY`, `VALID_DIET_GOAL`)와 비교해 매칭 안 되면 빈 값으로 처리 → 사용자가 다시 선택하도록 강제
- 생년월일 연도도 현재년 ~ 100년 전 범위 외면 빈 값으로

**부수 수정 — 연도 옵션 동적화**:
- `SignUp.tsx` / `ProfileComplete.tsx` 둘 다 `2024`로 하드코딩되어 있던 연도 상한선을 `new Date().getFullYear()`로 변경 — 현재 연도가 2026이라 `2025`/`2026`이 옵션에 없는 문제 해결

---

### 3) 백엔드 사이드 변경에 따른 영향 (참고)

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

### 4) 식재료 카드에 알레르기 경고 배지

**무엇을 바꿨나**: `Ingredients.tsx`의 식재료 카드 이름 옆에 D-day 배지와 함께 빨간 알레르기 배지(`AlertTriangle` 아이콘 + 매칭 키워드) 표시.

- `Ingredient` 타입에 `allergyWarnings?: string[]` 필드 추가
- 백엔드는 이미 응답에 채워주고 있었지만 화면 표시 코드가 없어 안 보였음
- 비어있으면 표시 안 됨, 있으면 "알레르기 땅콩" 형태로 빨간 배지

---

### 5) 레시피 추천 흐름 수정 — 시드 8개가 안 보이던 버그

**문제**: `recipeStore.fetchRecipes()`가 `/api/recipes`(본인 등록한 레시피만)를 호출해서 system 계정 소유의 시드 8개가 결과에 0개로 떴음. "레시피 추천" 화면이 항상 비어있는 상태.

**해결 1**: 호출 엔드포인트를 `/api/recipes/recommendations`로 변경. 응답이 `RecipeMatchResponseDto[]`로 래핑돼있어 `.recipe`만 추출. 프론트는 자체 `matchRecipesWithIngredients`로 매칭 재계산하므로 백엔드의 matchRate는 일단 무시. 알레르기 매칭 레시피는 백엔드에서 자동 필터링됨.

**해결 2**: `Recipes.tsx`의 `useMemo` 의존성 배열에 `recipes`가 빠져있어서, 비동기로 로드된 레시피가 `matches`에 반영 안 되던 React 버그. `[ingredients]` → `[recipes, ingredients]`로 수정. 이전엔 `/api/recipes`가 0개라 마스킹돼있었던 것.

---

### 6) "만들 수 있는 요리" 필터 완화

**문제**: `matchRate >= 100` (필수+선택 재료 모두 보유) 조건이 너무 빡빡해서 대부분의 레시피가 안 보였음.

**해결**: `m.hasIngredients.length > 0` (보유 재료가 1개라도 들어가는 레시피)로 완화. 사용자가 냉장고 재료를 활용할 의도 — "이거 몇 개만 더 사면 만들 수 있겠다" 까지 보여줌.

---

## 더 이전 작업 정리 (2026-05-07)

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
