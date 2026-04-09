export type StorageType = 'refrigerated' | 'frozen' | 'room';
export type CategoryType = 'vegetable' | 'meat' | 'dairy' | 'grain' | 'seafood' | 'fruit' | 'etc';

export interface Ingredient {
  id: string;
  name: string;
  category: CategoryType;
  quantity: number;
  unit: string;
  storage: StorageType;
  expiryDate: Date;
  purchaseDate: Date;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
}
