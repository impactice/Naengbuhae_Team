import { useEffect, useState } from 'react';
import { recipeStore } from '../store/recipeStore';
import { Recipe } from '../types/recipe';

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecipes = async () => {
      setLoading(true);
      await recipeStore.fetchRecipes();
      setRecipes(recipeStore.getRecipes());
      setLoading(false);
    };

    loadRecipes();

    const unsubscribe = recipeStore.subscribe(() => {
      setRecipes(recipeStore.getRecipes());
    });

    return unsubscribe;
  }, []);

  return { recipes, loading };
}
