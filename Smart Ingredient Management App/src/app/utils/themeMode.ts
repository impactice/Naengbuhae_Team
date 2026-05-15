// 사용자 테마 모드(system/light/dark) 관리.
// - localStorage에 저장
// - prefers-color-scheme media query를 listen해서 system 모드일 때 자동 반영
// - <html> 루트에 'dark' 클래스를 토글
// - 컴포넌트는 useSyncExternalStore로 현재 모드 구독

export type ThemeMode = 'system' | 'light' | 'dark';
const KEY = 'theme_mode';

class ThemeModeStore {
  private listeners: Set<() => void> = new Set();
  private mode: ThemeMode = 'system';
  private mql: MediaQueryList | null = null;
  private initialized = false;

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;
    const saved = localStorage.getItem(KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      this.mode = saved;
    }
    this.mql = window.matchMedia('(prefers-color-scheme: dark)');
    this.mql.addEventListener('change', this.onSystemChange);
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

  private onSystemChange = () => {
    if (this.mode === 'system') this.apply();
  };

  // mode 또는 시스템 변경 시 <html>에 dark 클래스 토글.
  private apply() {
    if (typeof document === 'undefined') return;
    const wantDark = this.mode === 'dark' ||
      (this.mode === 'system' && this.mql?.matches === true);
    document.documentElement.classList.toggle('dark', wantDark);
  }
}

export const themeModeStore = new ThemeModeStore();
