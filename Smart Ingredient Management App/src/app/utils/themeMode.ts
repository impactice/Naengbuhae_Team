// 사용자 테마 모드(light/dark) 관리.
// - localStorage에 저장
// - <html> 루트에 'dark' 클래스를 토글
// - 컴포넌트는 useSyncExternalStore로 현재 모드 구독
// (system 모드는 제거 — 라이트/다크 명시 선택만)

export type ThemeMode = 'light' | 'dark';
const KEY = 'theme_mode';

class ThemeModeStore {
  private listeners: Set<() => void> = new Set();
  private mode: ThemeMode = 'light';
  private initialized = false;

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') {
      this.mode = saved;
    } else if (saved === 'system') {
      // 기존 'system' 저장값 마이그레이션: 최초 1회 OS 설정으로 확정 후 저장
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.mode = prefersDark ? 'dark' : 'light';
      localStorage.setItem(KEY, this.mode);
    }
    this.apply();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): ThemeMode => this.mode;

  set(mode: ThemeMode) {
    this.mode = mode;
    localStorage.setItem(KEY, mode);
    this.apply();
    this.listeners.forEach((l) => l());
  }

  // <html>에 dark 클래스 토글.
  private apply() {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', this.mode === 'dark');
  }
}

export const themeModeStore = new ThemeModeStore();
