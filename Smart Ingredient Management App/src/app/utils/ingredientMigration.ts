import { localIngredientStore } from '../store/localIngredientStore';
import { apiFetch } from './apiClient';

// 게스트 → 로그인 전환 시점에 로컬 식재료를 서버로 옮기는 헬퍼.
// 로그인/소셜 콜백 직후 호출. 사용자가 거부하면 로컬 데이터는 그대로 둔다.

const STORAGE_TO_KO: Record<string, string> = {
  refrigerated: '냉장',
  frozen: '냉동',
  room: '실온',
};

const CATEGORY_TO_KO: Record<string, string> = {
  vegetable: '채소',
  meat: '육류',
  dairy: '유제품',
  grain: '곡물',
  seafood: '해산물',
  fruit: '과일',
  processed: '가공식품',
  beverage: '음료',
  condiment: '조미료',
  snack: '간식',
  etc: '기타',
};

export async function promptAndMigrate(): Promise<void> {
  const items = localIngredientStore.list();
  if (items.length === 0) return;

  const agreed = window.confirm(
    `비로그인 상태에서 추가한 식재료 ${items.length}개가 있어요.\n계정으로 옮기시겠습니까?`,
  );
  if (!agreed) return;

  // 서버는 한글 카테고리/보관을 받는다 — ingredientStore.mapToBackend와 같은 변환 적용.
  const payload = items.map((i) => ({
    name: i.name,
    category: CATEGORY_TO_KO[i.category] ?? i.category,
    quantity: i.quantity,
    unit: i.unit,
    storage: STORAGE_TO_KO[i.storage] ?? i.storage,
    purchaseDate: i.purchaseDate.toISOString().split('T')[0],
    expirationDate: i.expirationDate.toISOString().split('T')[0],
  }));

  try {
    const res = await apiFetch('/api/ingredients/import', {
      method: 'POST',
      body: JSON.stringify({ items: payload }),
    });
    if (res.ok) {
      localIngredientStore.clear();
      alert(`식재료 ${items.length}개를 옮겼어요`);
    } else {
      alert(`이전 실패 (${res.status}) — 로컬 데이터는 유지됩니다`);
    }
  } catch {
    alert('이전 실패 — 로컬 데이터는 유지됩니다');
  }
}
