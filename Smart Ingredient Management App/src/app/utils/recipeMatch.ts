import { Recipe } from '../types/recipe';
import { Ingredient } from '../types/ingredient';

export interface RecipeMatch {
  recipe: Recipe;
  matchRate: number; // 0-100
  missingIngredients: string[];
  hasIngredients: string[];
}

export function matchRecipesWithIngredients(
  recipes: Recipe[],
  ingredients: Ingredient[]
): RecipeMatch[] {
  const ingredientNames = ingredients.map((ing) => 
    ing.name.toLowerCase().trim()
  );

  const matches: RecipeMatch[] = recipes.map((recipe) => {
    const requiredIngredients = recipe.ingredients.filter((ing) => ing.required);
    const allIngredients = recipe.ingredients;

    const hasIngredients: string[] = [];
    const missingIngredients: string[] = [];

    allIngredients.forEach((recipeIng) => {
      const hasIngredient = ingredientNames.some((myIng) =>
        myIng.includes(recipeIng.name.toLowerCase()) ||
        recipeIng.name.toLowerCase().includes(myIng)
      );

      if (hasIngredient) {
        hasIngredients.push(recipeIng.name);
      } else {
        missingIngredients.push(recipeIng.name);
      }
    });

    // 필수 재료가 모두 있는지 확인
    const hasAllRequired = requiredIngredients.every((recipeIng) =>
      ingredientNames.some((myIng) =>
        myIng.includes(recipeIng.name.toLowerCase()) ||
        recipeIng.name.toLowerCase().includes(myIng)
      )
    );

    // 매칭률 계산 (있는 재료 / 전체 재료 * 100)
    const matchRate = Math.round(
      (hasIngredients.length / allIngredients.length) * 100
    );

    return {
      recipe,
      matchRate: hasAllRequired ? matchRate : 0,
      missingIngredients,
      hasIngredients,
    };
  });

  // 매칭률 순으로 정렬
  return matches.sort((a, b) => b.matchRate - a.matchRate);
}

export function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: '쉬움',
    medium: '보통',
    hard: '어려움',
  };
  return labels[difficulty] || difficulty;
}
