import { Ingredient, ShoppingItem, CategoryType, StorageType } from '../types/ingredient';

const API_BASE = 'http://localhost:8080/api/ingredients';
const SHOPPING_LIST_KEY = 'shopping-list';

// 토큰 헤더 헬퍼
function authHeaders(): HeadersInit {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Date → "YYYY-MM-DD" (LocalDate 호환)
function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 백엔드 응답 → 프론트 Ingredient
function mapFromBackend(item: any): Ingredient {
  return {
    id: String(item.id),
    name: item.name,
    category: item.category as CategoryType,
    quantity: item.quantity,
    unit: item.unit,
    storage: item.storage as StorageType,
    expiryDate: new Date(item.expirationDate),
    purchaseDate: new Date(item.purchaseDate),
  };
}

// 프론트 Ingredient → 백엔드 RequestDto
function mapToBackend(ingredient: Omit<Ingredient, 'id'>): any {
  return {
    name: ingredient.name,
    quantity: ingredient.quantity,
    expirationDate: toLocalDateString(ingredient.expiryDate),
    category: ingredient.category,
    unit: ingredient.unit,
    storage: ingredient.storage,
    purchaseDate: toLocalDateString(ingredient.purchaseDate),
  };
}

class IngredientStore {
  private ingredients: Ingredient[] = [];
  private listeners: Set<() => void> = new Set();

  // 백엔드에서 식재료 목록 받아와 캐시 갱신
  async fetchIngredients(): Promise<void> {
    try {
      const res = await fetch(API_BASE, { headers: authHeaders() });
      if (!res.ok) {
        console.error('식재료 조회 실패:', res.status);
        this.ingredients = [];
      } else {
        const data = await res.json();
        this.ingredients = data.map(mapFromBackend);
      }
    } catch (error) {
      console.error('식재료 조회 에러:', error);
      this.ingredients = [];
    }
    this.notifyListeners();
  }

  // 캐시된 데이터 반환 (동기, 페이지에서 사용)
  getIngredients(): Ingredient[] {
    return this.ingredients;
  }

  // 식재료 추가
  async addIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<void> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(mapToBackend(ingredient)),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`식재료 추가 실패: ${text}`);
    }
    await this.fetchIngredients();
  }

  // 식재료 수정
  async updateIngredient(id: string, updates: Partial<Ingredient>): Promise<void> {
    const current = this.ingredients.find((item) => item.id === id);
    if (!current) {
      throw new Error('수정할 식재료를 찾을 수 없습니다.');
    }
    const merged = { ...current, ...updates };
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(mapToBackend(merged)),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`식재료 수정 실패: ${text}`);
    }
    await this.fetchIngredients();
  }

  // 식재료 삭제
  async deleteIngredient(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`식재료 삭제 실패: ${text}`);
    }
    await this.fetchIngredients();
  }

  // 로그아웃 시 캐시 비우기
  clear(): void {
    this.ingredients = [];
    this.notifyListeners();
  }

  // ===== 장보기 리스트 (백엔드 API 없음 → localStorage 유지) =====

  getShoppingList(): ShoppingItem[] {
    const stored = localStorage.getItem(SHOPPING_LIST_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  saveShoppingList(items: ShoppingItem[]): void {
    localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(items));
    this.notifyListeners();
  }

  addShoppingItem(name: string, quantity: number, unit: string): void {
    const items = this.getShoppingList();
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name,
      quantity,
      unit,
      checked: false,
    };
    this.saveShoppingList([...items, newItem]);
  }

  toggleShoppingItem(id: string): void {
    const items = this.getShoppingList();
    const updated = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    this.saveShoppingList(updated);
  }

  deleteShoppingItem(id: string): void {
    const items = this.getShoppingList();
    const filtered = items.filter((item) => item.id !== id);
    this.saveShoppingList(filtered);
  }

  // ===== 구독 패턴 =====

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const ingredientStore = new IngredientStore();
