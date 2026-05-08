import { useState, useEffect } from 'react';
import { ingredientStore } from '../store/ingredientStore';
import { Ingredient, ShoppingItem } from '../types/ingredient';

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIngredients = async () => {
      setLoading(true);
      await ingredientStore.fetchIngredients();
      setIngredients(ingredientStore.getIngredients());
      setLoading(false);
    };

    loadIngredients();

    const unsubscribe = ingredientStore.subscribe(() => {
      setIngredients(ingredientStore.getIngredients());
    });

    return unsubscribe;
  }, []);

  return {
    ingredients,
    loading,
    addIngredient: (ingredient: Omit<Ingredient, 'id'>) =>
      ingredientStore.addIngredient(ingredient),
    updateIngredient: (id: string, updates: Partial<Ingredient>) =>
      ingredientStore.updateIngredient(id, updates),
    deleteIngredient: (id: string) => ingredientStore.deleteIngredient(id),
  };
}

export function useShoppingList() {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShoppingList = async () => {
      setLoading(true);
      await ingredientStore.fetchShoppingList();
      setShoppingList(ingredientStore.getShoppingList());
      setLoading(false);
    };

    loadShoppingList();

    const unsubscribe = ingredientStore.subscribe(() => {
      setShoppingList(ingredientStore.getShoppingList());
    });

    return unsubscribe;
  }, []);

  return {
    shoppingList,
    loading,
    addShoppingItem: (name: string, quantity: number, unit: string) =>
      ingredientStore.addShoppingItem(name, quantity, unit),
    toggleShoppingItem: (id: string) => ingredientStore.toggleShoppingItem(id),
    deleteShoppingItem: (id: string) => ingredientStore.deleteShoppingItem(id),
    transferShoppingItemToIngredient: (id: string) =>
      ingredientStore.transferShoppingItemToIngredient(id),
  };
}
