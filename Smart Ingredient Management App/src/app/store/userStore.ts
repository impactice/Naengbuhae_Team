import { apiFetch } from '../utils/apiClient';

export interface UserProfile {
  username: string;
  email: string;
  name: string;
  gender: string;
  birthDate: string;
  height: number;
  weight: number;
  activityLevel: string;
  dietGoal: string;
  allergies?: string;
  recommendedCalories?: number;
  emailVerified?: boolean;
}

class UserStore {
  private listeners: Set<() => void> = new Set();
  private userProfileCache: UserProfile | null = null;

  // 사용자 프로필 가져오기
  async fetchUserProfile(): Promise<UserProfile | null> {
    try {
      const response = await apiFetch('/user/me');

      if (response.ok) {
        const data = await response.json();
        this.userProfileCache = data;
        this.notifyListeners();
        return this.userProfileCache;
      } else {
        console.warn('사용자 프로필 조회 실패:', response.status);
      }
    } catch (error) {
      console.warn('백엔드 서버에 연결할 수 없습니다.', error);
    }
    return this.userProfileCache;
  }

  // 캐시된 사용자 프로필 반환 (동기)
  getUserProfile(): UserProfile | null {
    return this.userProfileCache;
  }

  // 사용자 프로필 업데이트
  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      const response = await apiFetch('/user/me', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await this.fetchUserProfile();
      } else {
        const errorText = await response.text();
        console.error('프로필 업데이트 실패:', response.status, errorText);
        throw new Error(`프로필 업데이트 실패: ${errorText}`);
      }
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      alert('프로필 업데이트 중 오류가 발생했습니다.');
      throw error;
    }
  }

  // 구독
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // 리스너 알림
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  // 회원 탈퇴 — DELETE /user/me
  async deleteAccount(): Promise<void> {
    const response = await apiFetch('/user/me', { method: 'DELETE' });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `회원 탈퇴 실패 (${response.status})`);
    }
  }

  // 캐시 초기화
  clearCache(): void {
    this.userProfileCache = null;
    this.notifyListeners();
  }
}

export const userStore = new UserStore();
