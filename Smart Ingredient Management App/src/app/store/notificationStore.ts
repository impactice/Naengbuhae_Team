import { apiFetch } from '../utils/apiClient';

// 인앱 알림 미확인 개수의 전역 store.
// - Root에서 로그인 진입 시 start() — 30초 polling + visibilitychange로 즉시 refresh
// - 로그아웃/탈퇴 시 stop()
// - 알림 센터 진입 시 read-all 호출 후 reset()으로 0
// - 모든 화면이 useSyncExternalStore로 같은 카운트 구독

const POLL_MS = 30_000;

class NotificationStore {
  private listeners: Set<() => void> = new Set();
  private unread = 0;
  private timer: number | null = null;
  private fetching = false;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): number => this.unread;

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private isLoggedIn(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(sessionStorage.getItem('isLoggedIn') ?? localStorage.getItem('isLoggedIn'));
  }

  async refresh(): Promise<void> {
    if (this.fetching) return;
    if (!this.isLoggedIn()) return;
    this.fetching = true;
    try {
      const res = await apiFetch('/api/notifications/unread-count');
      if (!res.ok) return;
      const data = (await res.json()) as { count?: number };
      const next = data.count ?? 0;
      if (next !== this.unread) {
        this.unread = next;
        this.notify();
      }
    } catch {
      // 네트워크 실패는 무시 — 다음 poll에서 다시 시도
    } finally {
      this.fetching = false;
    }
  }

  private onVisibility = () => {
    if (document.visibilityState === 'visible') {
      void this.refresh();
    }
  };

  start() {
    if (typeof window === 'undefined' || this.timer != null) return;
    void this.refresh();
    this.timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void this.refresh();
    }, POLL_MS);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  stop() {
    if (typeof window === 'undefined') return;
    if (this.timer != null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  reset() {
    if (this.unread !== 0) {
      this.unread = 0;
      this.notify();
    }
  }
}

export const notificationStore = new NotificationStore();
