import { Recipe } from '../types/recipe';
import { recipes as fallbackRecipes } from '../data/recipes';

const API_BASE_URL = 'http://localhost:8080/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

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
  };
}

class RecipeStore {
  private listeners: Set<() => void> = new Set();
  private recipesCache: Recipe[] = [];

  async fetchRecipes(): Promise<Recipe[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.recipesCache = Array.isArray(data) ? data.map(normalizeRecipe) : [];
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

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const recipeStore = new RecipeStore();
