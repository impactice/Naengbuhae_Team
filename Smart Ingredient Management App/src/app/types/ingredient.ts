export type StorageType = 'refrigerated' | 'frozen' | 'room';
export type CategoryType =
  | 'vegetable' | 'meat' | 'dairy' | 'grain' | 'seafood' | 'fruit'
  | 'processed' | 'beverage' | 'condiment' | 'snack' | 'etc';

export interface Ingredient {
  id: string;
  name: string;
  category: CategoryType;
  quantity: number;
  unit: string;
  storage: StorageType;
  expirationDate: Date;
  purchaseDate: Date;
  // 사용자 알레르기와 매칭된 키워드. 백엔드가 채워줌. 비어있으면 안전.
  allergyWarnings?: string[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
}
