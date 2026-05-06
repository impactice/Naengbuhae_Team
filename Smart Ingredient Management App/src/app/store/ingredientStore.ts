import { Ingredient, ShoppingItem, StorageType, CategoryType } from '../types/ingredient';

const API_BASE_URL = 'http://localhost:8080/api';

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
  '기타': 'etc',
};

// 인증 헤더 가져오기
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

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
function mapToBackend(ingredient: Omit<Ingredient, 'id'>) {
  return {
    name: ingredient.name,
    category: CATEGORY_TO_KO[ingredient.category] || ingredient.category,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    storage: STORAGE_TO_KO[ingredient.storage] || ingredient.storage,
    purchaseDate: ingredient.purchaseDate.toISOString().split('T')[0],
    expirationDate: ingredient.expirationDate.toISOString().split('T')[0],
  };
}

class IngredientStore {
  private listeners: Set<() => void> = new Set();
  private ingredientsCache: Ingredient[] = [];
  private shoppingListCache: ShoppingItem[] = [];

  // 식재료 가져오기
  async fetchIngredients(): Promise<Ingredient[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/ingredients`, {
        headers: getAuthHeaders(),
      });

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

  // 식재료 추가
  async addIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/ingredients`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(mapToBackend(ingredient)),
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

      const response = await fetch(`${API_BASE_URL}/ingredients/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
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
    try {
      const response = await fetch(`${API_BASE_URL}/ingredients/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

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

  // 장보기 리스트 가져오기
  async fetchShoppingList(): Promise<ShoppingItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/shopping-list`, {
        headers: getAuthHeaders(),
      });

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
      const response = await fetch(`${API_BASE_URL}/shopping-list`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
      const response = await fetch(`${API_BASE_URL}/shopping-list/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });

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

  // 장보기 항목 삭제
  async deleteShoppingItem(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/shopping-list/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

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

  // 장보기 → 냉장고 이관
  async transferShoppingItemToIngredient(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/shopping-list/${id}/transfer`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

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
