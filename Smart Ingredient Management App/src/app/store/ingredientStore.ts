import { Ingredient, ShoppingItem, StorageType, CategoryType } from '../types/ingredient';
import { apiFetch } from '../utils/apiClient';
import { isGuest } from '../utils/guestMode';
import { localIngredientStore } from './localIngredientStore';

// 영어 키 → 한글 매핑 (프론트 → 백엔드)
const STORAGE_TO_KO: Record<StorageType, string> = {
  refrigerated: '냉장',
  frozen: '냉동',
  room: '실온',
};

const CATEGORY_TO_KO: Record<CategoryType, string> = {
  'vegetable': '채소',
  'meat': '육류',
  'dairy': '유제품',
  'grain': '곡물',
  'seafood': '해산물',
  'fruit': '과일',
  'processed': '가공식품',
  'beverage': '음료',
  'condiment': '조미료',
  'snack': '간식',
  'etc': '기타',
};

// 한글 → 영어 키 매핑 (백엔드 → 프론트)
const STORAGE_FROM_KO: Record<string, StorageType> = {
  '냉장': 'refrigerated',
  '냉동': 'frozen',
  '실온': 'room',
};

const CATEGORY_FROM_KO: Record<string, CategoryType> = {
  '채소': 'vegetable',
  '육류': 'meat',
  '유제품': 'dairy',
  '곡물': 'grain',
  '해산물': 'seafood',
  '과일': 'fruit',
  '가공식품': 'processed',
  '음료': 'beverage',
  '조미료': 'condiment',
  '간식': 'snack',
  '기타': 'etc',
};

// 백엔드 → 프론트 변환
function mapFromBackend(item: any): Ingredient {
  return {
    ...item,
    storage: STORAGE_FROM_KO[item.storage] || item.storage,
    category: CATEGORY_FROM_KO[item.category] || item.category,
    expirationDate: new Date(item.expirationDate),
    purchaseDate: new Date(item.purchaseDate),
  };
}

// 프론트 → 백엔드 변환
function mapToBackend(ingredient: Omit<Ingredient, 'id'>, fridgeId?: string | null) {
  const body: Record<string, unknown> = {
    name: ingredient.name,
    category: CATEGORY_TO_KO[ingredient.category] || ingredient.category,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    storage: STORAGE_TO_KO[ingredient.storage] || ingredient.storage,
    purchaseDate: ingredient.purchaseDate.toISOString().split('T')[0],
    expirationDate: ingredient.expirationDate.toISOString().split('T')[0],
  };
  if (fridgeId != null) body.fridgeId = fridgeId;
  return body;
}

class IngredientStore {
  private listeners: Set<() => void> = new Set();
  private ingredientsCache: Ingredient[] = [];
  private shoppingListCache: ShoppingItem[] = [];

  // 식재료 가져오기. fridgeStore에서 현재 선택된 냉장고의 id를 가져와 쿼리에 부착.
  async fetchIngredients(): Promise<Ingredient[]> {
    // 게스트: 로컬 저장소에서 동기적으로 읽음
    if (isGuest()) {
      this.ingredientsCache = localIngredientStore.list();
      this.notifyListeners();
      return this.ingredientsCache;
    }
    try {
      // 동적 import로 순환 의존 방지
      const { fridgeStore } = await import('./fridgeStore');
      const fridgeId = fridgeStore.getSelectedId();
      const path = fridgeId != null
        ? `/api/ingredients?fridgeId=${fridgeId}`
        : '/api/ingredients';
      const response = await apiFetch(path);

      if (response.ok) {
        const data = await response.json();
        this.ingredientsCache = data.map((item: any) => mapFromBackend(item));
        this.notifyListeners();
        return this.ingredientsCache;
      } else {
        console.warn('식재료 조회 실패:', response.status);
      }
    } catch (error) {
      console.warn('백엔드 서버에 연결할 수 없습니다. 로컬 데이터를 사용합니다.', error);
      // 백엔드 연결 실패 시 빈 배열 유지
    }
    return this.ingredientsCache;
  }

  // 캐시된 식재료 반환 (동기)
  getIngredients(): Ingredient[] {
    return this.ingredientsCache;
  }

  // 식재료 추가. fridgeStore의 현재 선택 냉장고에 자동 저장.
  async addIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<void> {
    if (isGuest()) {
      localIngredientStore.add(ingredient);
      this.ingredientsCache = localIngredientStore.list();
      this.notifyListeners();
      return;
    }
    try {
      const { fridgeStore } = await import('./fridgeStore');
      const fridgeId = fridgeStore.getSelectedId();
      const response = await apiFetch('/api/ingredients', {
        method: 'POST',
        body: JSON.stringify(mapToBackend(ingredient, fridgeId)),
      });

      if (response.ok) {
        await this.fetchIngredients();
      } else {
        const errorText = await response.text();
        console.error('식재료 추가 실패:', response.status, errorText);
        throw new Error(`식재료 추가 실패: ${errorText}`);
      }
    } catch (error) {
      console.error('식재료 추가 오류:', error);
      alert('식재료 추가 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
      throw error;
    }
  }

  // 식재료 수정
  async updateIngredient(id: string, updates: Partial<Ingredient>): Promise<void> {
    if (isGuest()) {
      localIngredientStore.update(id, updates);
      this.ingredientsCache = localIngredientStore.list();
      this.notifyListeners();
      return;
    }
    try {
      const updateData: any = { ...updates };

      // 카테고리 매핑
      if (updates.category) {
        updateData.category = CATEGORY_TO_KO[updates.category] || updates.category;
      }

      // 보관방법 매핑
      if (updates.storage) {
        updateData.storage = STORAGE_TO_KO[updates.storage] || updates.storage;
      }

      // 날짜 변환
      if (updates.purchaseDate) {
        updateData.purchaseDate = updates.purchaseDate.toISOString().split('T')[0];
      }
      if (updates.expirationDate) {
        updateData.expirationDate = updates.expirationDate.toISOString().split('T')[0];
      }

      const response = await apiFetch(`/api/ingredients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        await this.fetchIngredients();
      } else {
        throw new Error('식재료 수정 실패');
      }
    } catch (error) {
      console.error('식재료 수정 오류:', error);
      throw error;
    }
  }

  // 식재료 삭제
  async deleteIngredient(id: string): Promise<void> {
    if (isGuest()) {
      localIngredientStore.remove(id);
      this.ingredientsCache = localIngredientStore.list();
      this.notifyListeners();
      return;
    }
    try {
      const response = await apiFetch(`/api/ingredients/${id}`, { method: 'DELETE' });

      if (response.ok) {
        await this.fetchIngredients();
      } else {
        const errorText = await response.text();
        console.error('식재료 삭제 실패:', response.status, errorText);
        throw new Error(`식재료 삭제 실패: ${errorText}`);
      }
    } catch (error) {
      console.error('식재료 삭제 오류:', error);
      alert('식재료 삭제 중 오류가 발생했습니다.');
      throw error;
    }
  }

  // 다중 선택 일괄 삭제. 게스트는 로컬에서 하나씩, 로그인이면 단일 요청으로 묶어 보낸다.
  async bulkDeleteIngredients(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    if (isGuest()) {
      ids.forEach((id) => localIngredientStore.remove(id));
      this.ingredientsCache = localIngredientStore.list();
      this.notifyListeners();
      return ids.length;
    }
    try {
      const response = await apiFetch('/api/ingredients/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: ids.map((id) => Number(id)) }),
      });
      if (response.ok) {
        await this.fetchIngredients();
        return ids.length;
      }
      const errorText = await response.text();
      throw new Error(`일괄 삭제 실패: ${errorText}`);
    } catch (error) {
      console.error('일괄 삭제 오류:', error);
      alert('일괄 삭제 중 오류가 발생했습니다.');
      throw error;
    }
  }

  // 장보기 리스트 가져오기
  async fetchShoppingList(): Promise<ShoppingItem[]> {
    try {
      const response = await apiFetch('/api/shopping-list');

      if (response.ok) {
        const data = await response.json();
        this.shoppingListCache = data;
        this.notifyListeners();
        return this.shoppingListCache;
      } else {
        console.warn('장보기 리스트 조회 실패:', response.status);
      }
    } catch (error) {
      console.warn('백엔드 서버에 연결할 수 없습니다. 로컬 데이터를 사용합니다.', error);
    }
    return this.shoppingListCache;
  }

  // 캐시된 장보기 리스트 반환 (동기)
  getShoppingList(): ShoppingItem[] {
    return this.shoppingListCache;
  }

  // 장보기 항목 추가
  async addShoppingItem(name: string, quantity: number, unit: string): Promise<void> {
    try {
      const response = await apiFetch('/api/shopping-list', {
        method: 'POST',
        body: JSON.stringify({ name, quantity, unit, checked: false }),
      });

      if (response.ok) {
        await this.fetchShoppingList();
      } else {
        const errorText = await response.text();
        console.error('장보기 항목 추가 실패:', response.status, errorText);
        throw new Error(`장보기 항목 추가 실패: ${errorText}`);
      }
    } catch (error) {
      console.error('장보기 항목 추가 오류:', error);
      alert('장보기 항목 추가 중 오류가 발생했습니다.');
      throw error;
    }
  }

  // 장보기 항목 토글
  async toggleShoppingItem(id: string): Promise<void> {
    try {
      const response = await apiFetch(`/api/shopping-list/${id}/toggle`, { method: 'PATCH' });

      if (response.ok) {
        await this.fetchShoppingList();
      } else {
        const errorText = await response.text();
        console.error('장보기 항목 토글 실패:', response.status, errorText);
        throw new Error(`장보기 항목 토글 실패: ${errorText}`);
      }
    } catch (error) {
      console.error('장보기 항목 토글 오류:', error);
      alert('장보기 항목 토글 중 오류가 발생했습니다.');
      throw error;
    }
  }

  // 장보기 항목 수량 업데이트 — [-/+] 카운터에서 호출
  // refetch 안 하고 cache의 해당 항목만 patch — 정렬 흔들리지 않게 (추가 순서 유지)
  async updateShoppingItemQuantity(id: string, quantity: number): Promise<void> {
    try {
      const response = await apiFetch(`/api/shopping-list/${id}/quantity`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || '수량 변경 실패');
      }
      // 백엔드가 응답으로 갱신된 항목 반환 → 그 quantity로 cache 항목만 패치 (순서 유지)
      const updated = await response.json();
      const newQty = (updated?.quantity as number) ?? quantity;
      this.shoppingListCache = this.shoppingListCache.map((it) =>
        it.id === id ? { ...it, quantity: newQty } : it,
      );
      this.notifyListeners();
    } catch (error) {
      console.error('수량 변경 오류:', error);
      alert('수량 변경 중 오류가 발생했습니다.');
      throw error;
    }
  }

  // 장보기 항목 삭제
  async deleteShoppingItem(id: string): Promise<void> {
    try {
      const response = await apiFetch(`/api/shopping-list/${id}`, { method: 'DELETE' });

      if (response.ok) {
        await this.fetchShoppingList();
      } else {
        const errorText = await response.text();
        console.error('장보기 항목 삭제 실패:', response.status, errorText);
        throw new Error(`장보기 항목 삭제 실패: ${errorText}`);
      }
    } catch (error) {
      console.error('장보기 항목 삭제 오류:', error);
      alert('장보기 항목 삭제 중 오류가 발생했습니다.');
      throw error;
    }
  }

  // 장보기 일괄 추가 — 레시피 상세 "부족한 재료 한 번에 담기"용.
  // 백엔드가 같은 이름 중복은 자동으로 건너뛰고 실제 추가된 개수를 반환.
  async bulkAddShoppingItems(items: { name: string; quantity: number; unit: string }[]): Promise<void> {
    if (items.length === 0) return;
    try {
      const response = await apiFetch('/api/shopping-list/bulk-add', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
      if (response.ok) {
        await this.fetchShoppingList();
      } else {
        const errorText = await response.text();
        throw new Error(`장보기 일괄 추가 실패: ${errorText}`);
      }
    } catch (error) {
      console.error('장보기 일괄 추가 오류:', error);
      alert('일괄 추가 중 오류가 발생했습니다.');
      throw error;
    }
  }

  // 장보기 일괄 삭제. 본인 소유 항목만 서버에서 삭제, 그 외 id는 무시.
  async bulkDeleteShoppingItems(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    try {
      const response = await apiFetch('/api/shopping-list/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: ids.map((id) => Number(id)) }),
      });
      if (response.ok) {
        await this.fetchShoppingList();
        return ids.length;
      }
      const errorText = await response.text();
      throw new Error(`장보기 일괄 삭제 실패: ${errorText}`);
    } catch (error) {
      console.error('장보기 일괄 삭제 오류:', error);
      alert('일괄 삭제 중 오류가 발생했습니다.');
      throw error;
    }
  }

  // 장보기 → 냉장고 이관
  async transferShoppingItemToIngredient(id: string): Promise<void> {
    try {
      const response = await apiFetch(`/api/shopping-list/${id}/transfer`, { method: 'POST' });

      if (response.ok) {
        await Promise.all([this.fetchShoppingList(), this.fetchIngredients()]);
        return;
      }

      const errorText = await response.text();
      throw new Error(errorText || '장보기 항목 이관 실패');
    } catch (error) {
      console.error('장보기 항목 이관 오류:', error);
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
}

export const ingredientStore = new IngredientStore();
