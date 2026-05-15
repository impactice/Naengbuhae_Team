// 비로그인(게스트) 모드 플래그.
// Root.tsx 가드가 isLoggedIn 외에 이 플래그도 검사 → 토큰 없어도 메인 화면 접근 허용.
// 가입/로그인 성공 시 false로 전환되고 로컬 식재료는 마이그레이션 후 정리.

const KEY = 'isGuest';

export function isGuest(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEY) === 'true';
}

export function setGuest(): void {
  localStorage.setItem(KEY, 'true');
}

export function clearGuest(): void {
  localStorage.removeItem(KEY);
}
