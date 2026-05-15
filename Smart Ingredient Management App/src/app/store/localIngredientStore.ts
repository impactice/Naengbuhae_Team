import { Ingredient } from '../types/ingredient';

// 게스트 모드 전용 로컬 식재료 저장소.
// localStorage에 JSON으로 저장되며, id는 음수("local-N")로 발급해 서버 id와 절대 충돌하지 않게 한다.
// ingredientStore가 isGuest()일 때 이쪽으로 분기한다.

const KEY = 'guest_ingredients';
const NEXT_ID_KEY = 'guest_ingredients_next_id';

interface StoredItem extends Omit<Ingredient, 'expirationDate' | 'purchaseDate'> {
  expirationDate: string;
  purchaseDate: string;
}

function readAll(): StoredItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as StoredItem[];
  } catch {}
  return [];
}

function writeAll(items: StoredItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}

function nextLocalId(): string {
  const cur = parseInt(localStorage.getItem(NEXT_ID_KEY) ?? '-1', 10);
  localStorage.setItem(NEXT_ID_KEY, String(cur - 1));
  return `local-${cur}`;
}

function hydrate(stored: StoredItem): Ingredient {
  return {
    ...stored,
    expirationDate: new Date(stored.expirationDate),
    purchaseDate: new Date(stored.purchaseDate),
  } as Ingredient;
}

function dehydrate(item: Ingredient): StoredItem {
  return {
    ...item,
    expirationDate: item.expirationDate.toISOString().split('T')[0],
    purchaseDate: item.purchaseDate.toISOString().split('T')[0],
  } as StoredItem;
}

export const localIngredientStore = {
  list(): Ingredient[] {
    return readAll().map(hydrate);
  },

  count(): number {
    return readAll().length;
  },

  add(ingredient: Omit<Ingredient, 'id'>): Ingredient {
    const items = readAll();
    const row = {
      ...ingredient,
      id: nextLocalId(),
    } as Ingredient;
    items.push(dehydrate(row));
    writeAll(items);
    return row;
  },

  update(id: string, updates: Partial<Ingredient>): boolean {
    const items = readAll();
    const idx = items.findIndex((e) => e.id === id);
    if (idx < 0) return false;
    const merged = { ...hydrate(items[idx]), ...updates, id } as Ingredient;
    items[idx] = dehydrate(merged);
    writeAll(items);
    return true;
  },

  remove(id: string): boolean {
    const items = readAll();
    const before = items.length;
    const filtered = items.filter((e) => e.id !== id);
    if (filtered.length === before) return false;
    writeAll(filtered);
    return true;
  },

  clear(): void {
    localStorage.removeItem(KEY);
    localStorage.removeItem(NEXT_ID_KEY);
  },
};
