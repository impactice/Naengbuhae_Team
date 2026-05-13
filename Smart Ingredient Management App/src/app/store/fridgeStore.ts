import { apiFetch } from '../utils/apiClient';

// 백엔드 응답 모양 그대로 보관 (members 배열, isOwner 포함).
export interface FridgeMember {
  username: string;
  name: string;
  isOwner: boolean;
}

export interface Fridge {
  id: number;
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
  private selectedId: number | null = null;

  constructor() {
    // 초기 선택값 복원 (localStorage)
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(SELECTED_FRIDGE_KEY);
      if (raw) this.selectedId = parseInt(raw, 10);
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

  getSelectedId(): number | null {
    return this.getSelected()?.id ?? null;
  }

  async fetch(): Promise<Fridge[]> {
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

  select(id: number) {
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
      localStorage.setItem(SELECTED_FRIDGE_KEY, String(this.selectedId));
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

  async rename(id: number, name: string): Promise<void> {
    const res = await apiFetch(`/api/fridges/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error(await this.errMsg(res) ?? '변경 실패');
    await this.fetch();
  }

  async remove(id: number): Promise<void> {
    const res = await apiFetch(`/api/fridges/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await this.errMsg(res) ?? '삭제 실패');
    await this.fetch();
  }

  async createInvite(id: number): Promise<string> {
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

  async removeMember(fridgeId: number, username: string): Promise<void> {
    const res = await apiFetch(`/api/fridges/${fridgeId}/members/${username}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await this.errMsg(res) ?? '실패');
    await this.fetch();
  }

  async leave(fridgeId: number): Promise<void> {
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
