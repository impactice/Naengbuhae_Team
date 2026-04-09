import { useState, useEffect } from 'react';
import { ingredientStore } from '../store/ingredientStore';
import { Ingredient, ShoppingItem } from '../types/ingredient';

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    const loadIngredients = () => {
      setIngredients(ingredientStore.getIngredients());
    };

    loadIngredients();
    const unsubscribe = ingredientStore.subscribe(loadIngredients);
    return unsubscribe;
  }, []);

  return {
    ingredients,
    addIngredient: (ingredient: Omit<Ingredient, 'id'>) =>
      ingredientStore.addIngredient(ingredient),
    updateIngredient: (id: string, updates: Partial<Ingredient>) =>
      ingredientStore.updateIngredient(id, updates),
    deleteIngredient: (id: string) => ingredientStore.deleteIngredient(id),
  };
}

export function useShoppingList() {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    const loadShoppingList = () => {
      setShoppingList(ingredientStore.getShoppingList());
    };

    loadShoppingList();
    const unsubscribe = ingredientStore.subscribe(loadShoppingList);
    return unsubscribe;
  }, []);

  return {
    shoppingList,
    addShoppingItem: (name: string, quantity: number, unit: string) =>
      ingredientStore.addShoppingItem(name, quantity, unit),
    toggleShoppingItem: (id: string) => ingredientStore.toggleShoppingItem(id),
    deleteShoppingItem: (id: string) => ingredientStore.deleteShoppingItem(id),
  };
}
