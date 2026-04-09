import { Ingredient, ShoppingItem } from '../types/ingredient';

// 로컬 스토리지 키
const INGREDIENTS_KEY = 'fridge-ingredients';
const SHOPPING_LIST_KEY = 'shopping-list';

// 초기 샘플 데이터
const initialIngredients: Ingredient[] = [
  {
    id: '1',
    name: '우유',
    category: 'dairy',
    quantity: 1,
    unit: '개',
    storage: 'refrigerated',
    expiryDate: new Date(2026, 2, 25), // 2일 후
    purchaseDate: new Date(2026, 2, 18),
  },
  {
    id: '2',
    name: '양상추',
    category: 'vegetable',
    quantity: 1,
    unit: '개',
    storage: 'refrigerated',
    expiryDate: new Date(2026, 2, 24), // 1일 후
    purchaseDate: new Date(2026, 2, 17),
  },
  {
    id: '3',
    name: '닭가슴살',
    category: 'meat',
    quantity: 300,
    unit: 'g',
    storage: 'refrigerated',
    expiryDate: new Date(2026, 2, 26), // 3일 후
    purchaseDate: new Date(2026, 2, 23),
  },
  {
    id: '4',
    name: '계란',
    category: 'etc',
    quantity: 10,
    unit: '개',
    storage: 'refrigerated',
    expiryDate: new Date(2026, 3, 5), // 13일 후
    purchaseDate: new Date(2026, 2, 20),
  },
  {
    id: '5',
    name: '당근',
    category: 'vegetable',
    quantity: 3,
    unit: '개',
    storage: 'refrigerated',
    expiryDate: new Date(2026, 3, 10), // 18일 후
    purchaseDate: new Date(2026, 2, 20),
  },
];

class IngredientStore {
  private listeners: Set<() => void> = new Set();

  // 식재료 가져오기
  getIngredients(): Ingredient[] {
    const stored = localStorage.getItem(INGREDIENTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((item: any) => ({
        ...item,
        expiryDate: new Date(item.expiryDate),
        purchaseDate: new Date(item.purchaseDate),
      }));
    }
    // 초기 데이터 저장
    this.saveIngredients(initialIngredients);
    return initialIngredients;
  }

  // 식재료 저장
  saveIngredients(ingredients: Ingredient[]): void {
    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));
    this.notifyListeners();
  }

  // 식재료 추가
  addIngredient(ingredient: Omit<Ingredient, 'id'>): void {
    const ingredients = this.getIngredients();
    const newIngredient: Ingredient = {
      ...ingredient,
      id: Date.now().toString(),
    };
    this.saveIngredients([...ingredients, newIngredient]);
  }

  // 식재료 수정
  updateIngredient(id: string, updates: Partial<Ingredient>): void {
    const ingredients = this.getIngredients();
    const updated = ingredients.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    this.saveIngredients(updated);
  }

  // 식재료 삭제
  deleteIngredient(id: string): void {
    const ingredients = this.getIngredients();
    const filtered = ingredients.filter((item) => item.id !== id);
    this.saveIngredients(filtered);
  }

  // 장보기 리스트 가져오기
  getShoppingList(): ShoppingItem[] {
    const stored = localStorage.getItem(SHOPPING_LIST_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // 장보기 리스트 저장
  saveShoppingList(items: ShoppingItem[]): void {
    localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(items));
    this.notifyListeners();
  }

  // 장보기 항목 추가
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

  // 장보기 항목 토글
  toggleShoppingItem(id: string): void {
    const items = this.getShoppingList();
    const updated = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    this.saveShoppingList(updated);
  }

  // 장보기 항목 삭제
  deleteShoppingItem(id: string): void {
    const items = this.getShoppingList();
    const filtered = items.filter((item) => item.id !== id);
    this.saveShoppingList(filtered);
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
