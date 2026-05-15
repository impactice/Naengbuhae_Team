import { Recipe } from '../types/recipe';
import { recipes as fallbackRecipes } from '../data/recipes';
import { apiFetch } from '../utils/apiClient';

function normalizeRecipe(raw: any): Recipe {
  return {
    id: String(raw.id ?? raw.recipeId ?? ''),
    name: String(raw.name ?? ''),
    category: String(raw.category ?? '기타'),
    difficulty: raw.difficulty === 'hard' || raw.difficulty === 'medium' ? raw.difficulty : 'easy',
    cookingTime: Number(raw.cookingTime ?? 0),
    servings: Number(raw.servings ?? 1),
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients.map((ing: any) => ({
          name: String(ing.name ?? ''),
          quantity: Number(ing.quantity ?? 0),
          unit: String(ing.unit ?? ''),
          required: ing.required !== false,
        }))
      : [],
    steps: Array.isArray(raw.steps) ? raw.steps.map((step: any) => String(step)) : [],
    nutrition: {
      calories: Number(raw.nutrition?.calories ?? 0),
      protein: Number(raw.nutrition?.protein ?? 0),
      carbs: Number(raw.nutrition?.carbs ?? 0),
      fat: Number(raw.nutrition?.fat ?? 0),
      sodium: Number(raw.nutrition?.sodium ?? 0),
    },
    imageUrl: raw.imageUrl ? String(raw.imageUrl) : undefined,
    favorite: raw.favorite === true,
  };
}

class RecipeStore {
  private listeners: Set<() => void> = new Set();
  private recipesCache: Recipe[] = [];

  async fetchRecipes(): Promise<Recipe[]> {
    try {
      // /api/recipes는 본인이 등록한 레시피만 반환 → 시드 8개는 system 계정 소유라 안 보임.
      // /api/recipes/recommendations는 모든 시드 + 매칭률 + 알레르기 필터까지 적용해서 반환.
      // 응답 형태: [{ recipe, matchRate, hasIngredients, missingIngredients, ... }, ...]
      // 프론트는 자체 matchRecipesWithIngredients로 매칭을 다시 계산하므로 recipe만 추출해서 사용.
      const response = await apiFetch('/api/recipes/recommendations');

      if (response.ok) {
        const data = await response.json();
        const recipes = Array.isArray(data) ? data.map((m: any) => m.recipe ?? m) : [];
        this.recipesCache = recipes.map(normalizeRecipe);
      } else {
        console.warn('레시피 조회 실패:', response.status);
        this.recipesCache = fallbackRecipes;
      }
    } catch (error) {
      console.warn('레시피 API 연결 실패, 정적 데이터로 대체합니다.', error);
      this.recipesCache = fallbackRecipes;
    }

    this.notifyListeners();
    return this.recipesCache;
  }

  getRecipes(): Recipe[] {
    return this.recipesCache;
  }

  // 즐겨찾기 토글 — 백엔드가 새 상태(true/false) 반환. 캐시 즉시 동기화.
  async toggleFavorite(recipeId: string): Promise<boolean | null> {
    try {
      const res = await apiFetch(`/api/recipes/${recipeId}/favorite/toggle`, { method: 'POST' });
      if (!res.ok) return null;
      const data = (await res.json()) as { favorite: boolean };
      this.recipesCache = this.recipesCache.map((r) =>
        r.id === recipeId ? { ...r, favorite: data.favorite } : r,
      );
      this.notifyListeners();
      return data.favorite;
    } catch {
      return null;
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const recipeStore = new RecipeStore();
