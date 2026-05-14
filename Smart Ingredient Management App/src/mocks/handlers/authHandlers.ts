// ============================================================
// [MSW 모킹용 파일] authHandlers.ts
// 백엔드 없이 프론트엔드 개발할 때만 사용합니다.
// 실제 백엔드 연동 후에는 이 파일 전체 + src/mocks/ 폴더를 삭제하세요.
// ============================================================

import { http, HttpResponse } from 'msw';

// ─────────────────────────────────────────────
// 가상(Mock) 계정 정보
// TODO: 백엔드 연동 시 아래 계정 정보는 의미 없어집니다. 삭제 가능.
// ─────────────────────────────────────────────
const MOCK_USER = {
  username: 'd23',
  password: 'd3d3',
  // 로그인 성공 시 응답에 포함될 유저 정보
  profile: {
    username: 'd23',
    email: 'dev@naengbuhae.test',
    name: '개발자',
    gender: 'male',
    birthDate: '1995-01-01',
    height: 175,
    weight: 70,
    activityLevel: 'moderate',
    dietGoal: 'maintain',
    allergies: '',
    recommendedCalories: 2200,
    emailVerified: true,
  },
};

// 가짜 JWT 토큰 (실제 JWT 형식이지만 서명은 유효하지 않음 — dev 전용)
// TODO: 백엔드 연동 시 실제 서버가 토큰을 발급하므로 이 값들은 삭제 가능.
const MOCK_TOKEN = 'mock-access-token-for-dev';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token-for-dev';

// ─────────────────────────────────────────────
// POST /user/login  — 로그인
// 실제 백엔드 엔드포인트: POST http://localhost:8080/user/login
// ─────────────────────────────────────────────
const loginHandler = http.post('http://localhost:8080/user/login', async ({ request }) => {
  const body = (await request.json()) as { username: string; password: string };

  // 가상 계정과 일치하는지 확인
  if (body.username === MOCK_USER.username && body.password === MOCK_USER.password) {
    // 로그인 성공 응답 — 실제 백엔드 LoginResponse 형식 그대로 반환
    return HttpResponse.json({
      success: true,
      message: '로그인 성공',
      token: MOCK_TOKEN,
      refreshToken: MOCK_REFRESH_TOKEN,
      user: MOCK_USER.profile,
    });
  }

  // 로그인 실패 — 백엔드가 success:false + HTTP 200으로 응답하는 방식과 동일하게 맞춤
  return HttpResponse.json(
    { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' },
    { status: 200 },
  );
});

// ─────────────────────────────────────────────
// POST /user/token/refresh  — 토큰 재발급
// 실제 백엔드 엔드포인트: POST http://localhost:8080/user/token/refresh
// ─────────────────────────────────────────────
const tokenRefreshHandler = http.post(
  'http://localhost:8080/user/token/refresh',
  async ({ request }) => {
    const body = (await request.json()) as { refreshToken: string };

    if (body.refreshToken === MOCK_REFRESH_TOKEN) {
      // 재발급 성공
      return HttpResponse.json({
        token: MOCK_TOKEN,
        refreshToken: MOCK_REFRESH_TOKEN,
      });
    }

    // 유효하지 않은 refresh token
    return HttpResponse.json({ message: '유효하지 않은 토큰입니다.' }, { status: 401 });
  },
);

// ─────────────────────────────────────────────
// POST /user/logout  — 로그아웃
// 실제 백엔드 엔드포인트: POST http://localhost:8080/user/logout
// ─────────────────────────────────────────────
const logoutHandler = http.post('http://localhost:8080/user/logout', () => {
  // 백엔드에 refresh token 폐기 요청 — dev에서는 그냥 성공으로 처리
  return HttpResponse.json({ success: true, message: '로그아웃 되었습니다.' });
});

// ─────────────────────────────────────────────
// GET /user/me  — 내 프로필 조회
// 실제 백엔드 엔드포인트: GET http://localhost:8080/user/me
// ─────────────────────────────────────────────
const getMeHandler = http.get('http://localhost:8080/user/me', ({ request }) => {
  const auth = request.headers.get('Authorization');

  // 토큰이 없으면 401
  if (!auth || !auth.includes(MOCK_TOKEN)) {
    return HttpResponse.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  return HttpResponse.json(MOCK_USER.profile);
});

// ─────────────────────────────────────────────
// PUT /user/me  — 프로필 업데이트
// 실제 백엔드 엔드포인트: PUT http://localhost:8080/user/me
// ─────────────────────────────────────────────
const updateMeHandler = http.put('http://localhost:8080/user/me', async ({ request }) => {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.includes(MOCK_TOKEN)) {
    return HttpResponse.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const updates = await request.json();
  // 실제로는 서버에서 저장하지만 dev에서는 그냥 성공 응답
  return HttpResponse.json({ ...MOCK_USER.profile, ...(updates as object) });
});

// 모든 auth 핸들러 export
export const authHandlers = [
  loginHandler,
  tokenRefreshHandler,
  logoutHandler,
  getMeHandler,
  updateMeHandler,
];
