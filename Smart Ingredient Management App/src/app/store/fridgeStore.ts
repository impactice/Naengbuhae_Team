import { apiFetch } from '../utils/apiClient';
import { isGuest } from '../utils/guestMode';

// 백엔드 응답 모양 그대로 보관 (members 배열, isOwner 포함).
export interface FridgeMember {
  username: string;
  name: string;
  isOwner: boolean;
}

export interface Fridge {
  // 백엔드 Fridge id가 Long → UUID(문자열) 마이그레이션됨(IDOR 방어). 앱과 동일하게 string.
  id: string;
  name: string;
  ownerUsername: string;
  isOwner: boolean;
  members: FridgeMember[];
}

const SELECTED_FRIDGE_KEY = 'selected_fridge_id';

// 전역 냉장고 상태. 모든 메인 페이지가 같은 냉장고를 보고 있어야 하므로 싱글톤 store로 관리.
// 변경 시 listeners 알림 → useFridges 훅이 react setState로 받음.
class FridgeStore {
  private listeners: Set<() => void> = new Set();
  private fridges: Fridge[] = [];
  private selectedId: string | null = null;

  constructor() {
    // 초기 선택값 복원 (localStorage). UUID 문자열이라 parseInt 금지 — raw 그대로.
    // 과거 숫자(legacy) 저장값은 백엔드에 더 이상 매칭 안 되니 그대로 두고 fetch() 시 정리됨.
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(SELECTED_FRIDGE_KEY);
      if (raw) this.selectedId = raw;
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getFridges(): Fridge[] {
    return this.fridges;
  }

  getSelected(): Fridge | null {
    return this.fridges.find((f) => f.id === this.selectedId) ?? this.fridges[0] ?? null;
  }

  getSelectedId(): string | null {
    return this.getSelected()?.id ?? null;
  }

  async fetch(): Promise<Fridge[]> {
    // 게스트는 서버 호출 없이 가상 냉장고 1개만 들고 다닌다. 앱과 동일하게 'guest' sentinel.
    if (isGuest()) {
      const guestFridge: Fridge = {
        id: 'guest',
        name: '내 냉장고',
        ownerUsername: '',
        isOwner: true,
        members: [],
      };
      this.fridges = [guestFridge];
      this.selectedId = 'guest';
      this.notify();
      return this.fridges;
    }
    try {
      const res = await apiFetch('/api/fridges');
      if (!res.ok) return this.fridges;
      const list = (await res.json()) as Fridge[];
      this.fridges = list;
      // 저장된 선택이 더 이상 유효하지 않으면 첫 번째로
      if (this.selectedId == null || !list.some((f) => f.id === this.selectedId)) {
        this.selectedId = list[0]?.id ?? null;
        this.persist();
      }
      this.notify();
      return list;
    } catch {
      return this.fridges;
    }
  }

  select(id: string) {
    if (!this.fridges.some((f) => f.id === id)) return;
    this.selectedId = id;
    this.persist();
    this.notify();
  }

  private persist() {
    if (typeof window === 'undefined') return;
    if (this.selectedId == null) {
      localStorage.removeItem(SELECTED_FRIDGE_KEY);
    } else {
      localStorage.setItem(SELECTED_FRIDGE_KEY, this.selectedId);
    }
  }

  // 로그아웃/탈퇴 시
  clear() {
    this.fridges = [];
    this.selectedId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SELECTED_FRIDGE_KEY);
    }
    this.notify();
  }

  // ===== 관리 API =====

  async create(name: string): Promise<void> {
    const res = await apiFetch('/api/fridges', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(await this.errMsg(res) ?? '생성 실패');
    await this.fetch();
  }

  async rename(id: string, name: string): Promise<void> {
    const res = await apiFetch(`/api/fridges/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(await this.errMsg(res) ?? '변경 실패');
    await this.fetch();
  }

  async remove(id: string): Promise<void> {
    const res = await apiFetch(`/api/fridges/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await this.errMsg(res) ?? '삭제 실패');
    await this.fetch();
  }

  async createInvite(id: string): Promise<string> {
    const res = await apiFetch(`/api/fridges/${id}/invites`, { method: 'POST' });
    if (!res.ok) throw new Error(await this.errMsg(res) ?? '코드 발급 실패');
    const data = await res.json();
    return data.code as string;
  }

  async join(code: string): Promise<void> {
    const res = await apiFetch('/api/fridges/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    if (!res.ok) throw new Error(await this.errMsg(res) ?? '가입 실패');
    await this.fetch();
  }

  async removeMember(fridgeId: string, username: string): Promise<void> {
    const res = await apiFetch(`/api/fridges/${fridgeId}/members/${username}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await this.errMsg(res) ?? '실패');
    await this.fetch();
  }

  async leave(fridgeId: string): Promise<void> {
    const res = await apiFetch(`/api/fridges/${fridgeId}/leave`, { method: 'POST' });
    if (!res.ok) throw new Error(await this.errMsg(res) ?? '실패');
    await this.fetch();
  }

  private async errMsg(res: Response): Promise<string | null> {
    try {
      const data = await res.json();
      return data?.message ?? data?.error ?? null;
    } catch {
      return null;
    }
  }
}

export const fridgeStore = new FridgeStore();
