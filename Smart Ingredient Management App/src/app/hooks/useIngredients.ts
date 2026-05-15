import { useState, useEffect } from 'react';
import { ingredientStore } from '../store/ingredientStore';
import { fridgeStore } from '../store/fridgeStore';
import { Ingredient, ShoppingItem } from '../types/ingredient';

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let lastFridgeId = fridgeStore.getSelectedId();
    const loadIngredients = async () => {
      setLoading(true);
      await ingredientStore.fetchIngredients();
      setIngredients(ingredientStore.getIngredients());
      setLoading(false);
    };

    loadIngredients();

    const unsubIngredient = ingredientStore.subscribe(() => {
      setIngredients(ingredientStore.getIngredients());
    });
    // 냉장고가 바뀌었을 때만 식재료 다시 가져옴 (단순 list 변경엔 반응 X)
    const unsubFridge = fridgeStore.subscribe(() => {
      const id = fridgeStore.getSelectedId();
      if (id !== lastFridgeId) {
        lastFridgeId = id;
        loadIngredients();
      }
    });

    return () => {
      unsubIngredient();
      unsubFridge();
    };
  }, []);

  return {
    ingredients,
    loading,
    addIngredient: (ingredient: Omit<Ingredient, 'id'>) =>
      ingredientStore.addIngredient(ingredient),
    updateIngredient: (id: string, updates: Partial<Ingredient>) =>
      ingredientStore.updateIngredient(id, updates),
    deleteIngredient: (id: string) => ingredientStore.deleteIngredient(id),
    bulkDeleteIngredients: (ids: string[]) => ingredientStore.bulkDeleteIngredients(ids),
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
    bulkDeleteShoppingItems: (ids: string[]) => ingredientStore.bulkDeleteShoppingItems(ids),
    transferShoppingItemToIngredient: (id: string) =>
      ingredientStore.transferShoppingItemToIngredient(id),
  };
}
