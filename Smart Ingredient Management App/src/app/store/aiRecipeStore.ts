// AI 추천 결과를 localStorage에 누적 저장.
// AI 응답엔 id가 없어 클라이언트에서 생성. 즐겨찾기/삭제는 이 id 기준.
//
// 메인 Recipes 페이지가 이걸 읽어 일반 레시피 목록 위에 노출 → 한번 받은 추천이
// 페이지 이탈로 날아가지 않음.

export interface SavedAiRecipe {
  id: string;
  dish_name: string;
  additional_ingredients: string[];
  health_benefits: string;
  recipe_tip: string;
  favorite: boolean;
  createdAt: number;
}

const KEY = 'ai-recipes';

interface RawAiRecipe {
  dish_name: string;
  additional_ingredients: string[];
  health_benefits: string;
  recipe_tip: string;
}

export function getAllAiRecipes(): SavedAiRecipe[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedAiRecipe[];
  } catch {
    return [];
  }
}

// 새 추천 결과 N개를 기존 목록 맨 앞에 prepend. 같은 dish_name이 이미 있어도 그냥 새로 누적.
export function saveAiRecipes(recipes: RawAiRecipe[]): SavedAiRecipe[] {
  if (typeof window === 'undefined') return [];
  const existing = getAllAiRecipes();
  const now = Date.now();
  const newOnes: SavedAiRecipe[] = recipes.map((r, i) => ({
    id: `ai-${now}-${i}`,
    dish_name: r.dish_name,
    additional_ingredients: r.additional_ingredients ?? [],
    health_benefits: r.health_benefits ?? '',
    recipe_tip: r.recipe_tip ?? '',
    favorite: false,
    createdAt: now,
  }));
  const merged = [...newOnes, ...existing];
  localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}

export function getAiRecipe(id: string): SavedAiRecipe | null {
  return getAllAiRecipes().find((r) => r.id === id) ?? null;
}

export function toggleAiRecipeFavorite(id: string): SavedAiRecipe | null {
  if (typeof window === 'undefined') return null;
  const all = getAllAiRecipes();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], favorite: !all[idx].favorite };
  localStorage.setItem(KEY, JSON.stringify(all));
  return all[idx];
}

export function removeAiRecipe(id: string): void {
  if (typeof window === 'undefined') return;
  const all = getAllAiRecipes().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}
