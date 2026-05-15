import { useParams, useNavigate, Link } from 'react-router';
import { useIngredients, useShoppingList } from '../hooks/useIngredients';
import { useRecipes } from '../hooks/useRecipes';
import { matchRecipesWithIngredients, getDifficultyLabel } from '../utils/recipeMatch';
import { ArrowLeft, Clock, Users, Plus, Check, ShoppingCart, Heart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { isGuest } from '../utils/guestMode';
import GuestBlocked from '../components/GuestBlocked';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ingredients } = useIngredients();
  const { recipes, loading, toggleFavorite } = useRecipes();
  const { shoppingList, addShoppingItem, bulkAddShoppingItems } = useShoppingList();

  const recipe = recipes.find((r) => r.id === id);

  const match = useMemo(() => {
    if (!recipe) return null;
    const matches = matchRecipesWithIngredients([recipe], ingredients);
    return matches[0];
  }, [recipe, ingredients]);

  // 진입 시 부족한 재료가 있고, 아직 장보기에 안 들어간 항목이 있으면 다이얼로그 자동 노출.
  // 한 세션 동안 같은 레시피를 다시 봐도 안 묻도록 sessionStorage에 기록.
  const missingNotInList = useMemo(() => {
    if (!recipe || !match) return [];
    return match.missingIngredients
      .map((name) => recipe.ingredients.find((i) => i.name === name))
      .filter((i): i is NonNullable<typeof i> => !!i)
      .filter((i) => !shoppingList.some((s) => s.name === i.name));
  }, [recipe, match, shoppingList]);

  const [askDialog, setAskDialog] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!recipe) return;
    if (missingNotInList.length === 0) return;
    if (sessionStorage.getItem(`recipe-ask-${recipe.id}`) === 'done') return;
    setAskDialog(true);
  }, [recipe, missingNotInList.length]);

  const dismissDialog = () => {
    if (recipe) sessionStorage.setItem(`recipe-ask-${recipe.id}`, 'done');
    setAskDialog(false);
  };

  const handleBulkAdd = async () => {
    if (adding) return;
    setAdding(true);
    try {
      await bulkAddShoppingItems(
        missingNotInList.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
      );
      dismissDialog();
      alert(`${missingNotInList.length}개 재료를 장보기 리스트에 추가했어요`);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">레시피를 불러오는 중...</p>
      </div>
    );
  }

  if (!recipe || !match) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">레시피를 찾을 수 없습니다</p>
          <button
            onClick={() => navigate('/recipes')}
            className="px-6 py-3 rounded-xl"
            style={{ backgroundColor: '#CDFF00', fontWeight: 600 }}
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const handleAddToShoppingList = (name: string, quantity: number, unit: string) => {
    addShoppingItem(name, quantity, unit);
    alert(`${name}을(를) 장보기 리스트에 추가했습니다`);
  };

  if (isGuest()) return <GuestBlocked feature="레시피 상세" />;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-20">
      {/* 진입 시 자동 다이얼로그 — 부족한 재료가 있을 때 한 번만 묻기 */}
      {askDialog && recipe && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-5 h-5 text-lime-700" />
                <h3 className="text-base" style={{ fontWeight: 700 }}>
                  부족한 재료 {missingNotInList.length}개가 있어요
                </h3>
              </div>
              <p className="text-sm text-gray-600">장보기 리스트에 한 번에 추가할까요?</p>
            </div>
            <div className="px-5 pb-3 max-h-48 overflow-y-auto">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-1.5">
                {missingNotInList.map((i) => (
                  <div key={i.name} className="flex items-center justify-between text-sm">
                    <span style={{ fontWeight: 600 }}>{i.name}</span>
                    <span className="text-gray-500 text-xs">{i.quantity}{i.unit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                type="button"
                onClick={dismissDialog}
                disabled={adding}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm disabled:opacity-50"
                style={{ fontWeight: 600 }}
              >
                괜찮아요
              </button>
              <button
                type="button"
                onClick={handleBulkAdd}
                disabled={adding}
                className="flex-1 py-3 rounded-xl text-sm disabled:opacity-50"
                style={{ backgroundColor: '#CDFF00', fontWeight: 700 }}
              >
                {adding ? '추가 중...' : '장보기에 추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl flex-1" style={{ fontWeight: 700 }}>
          {recipe.name}
        </h1>
        <button
          type="button"
          onClick={() => void toggleFavorite(recipe.id)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="즐겨찾기"
        >
          <Heart
            className={`w-6 h-6 ${recipe.favorite ? 'text-red-500' : 'text-gray-400'}`}
            fill={recipe.favorite ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      {/* 기본 정보 */}
      <div className="px-5 pb-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">{recipe.category}</span>
            <span
              className="px-3 py-1 rounded-lg text-sm"
              style={{
                backgroundColor:
                  match.matchRate >= 100
                    ? '#CDFF00'
                    : match.matchRate >= 50
                    ? '#FFD60A40'
                    : '#FF3B3040',
                fontWeight: 600,
              }}
            >
              {match.matchRate}% 매칭
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span>{recipe.cookingTime}분</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span>{recipe.servings}인분</span>
            </div>
            <span>{getDifficultyLabel(recipe.difficulty)}</span>
          </div>
        </div>
      </div>

      {/* 재료 */}
      <div className="px-5 pb-6">
        <h2 className="text-lg mb-3" style={{ fontWeight: 600 }}>
          필요한 재료
        </h2>
        <div className="space-y-2">
          {recipe.ingredients.map((ingredient, index) => {
            const hasIngredient = match.hasIngredients.includes(ingredient.name);
            const inShoppingList = shoppingList.some(
              (item) => item.name === ingredient.name
            );

            return (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      hasIngredient ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    {hasIngredient && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm ${
                          hasIngredient ? 'text-black' : 'text-gray-600'
                        }`}
                        style={{ fontWeight: hasIngredient ? 600 : 500 }}
                      >
                        {ingredient.name}
                      </span>
                      {ingredient.required && (
                        <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 rounded text-xs" style={{ fontWeight: 600 }}>
                          필수
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {ingredient.quantity}
                      {ingredient.unit}
                    </span>
                  </div>
                </div>
                {!hasIngredient && !inShoppingList && (
                  <button
                    onClick={() =>
                      handleAddToShoppingList(
                        ingredient.name,
                        ingredient.quantity,
                        ingredient.unit
                      )
                    }
                    className="ml-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                )}
                {inShoppingList && (
                  <span className="ml-2 text-xs text-green-600" style={{ fontWeight: 600 }}>
                    리스트 추가됨
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 조리 방법 */}
      <div className="px-5 pb-6">
        <h2 className="text-lg mb-3" style={{ fontWeight: 600 }}>
          조리 방법
        </h2>
        <div className="space-y-3">
          {recipe.steps.map((step, index) => (
            <div key={index} className="flex gap-3">
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{
                  backgroundColor: '#CDFF00',
                  fontWeight: 600,
                }}
              >
                {index + 1}
              </div>
              <p className="flex-1 text-sm text-gray-700 pt-0.5">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 영양 정보 */}
      <div className="px-5 pb-6">
        <h2 className="text-lg mb-3" style={{ fontWeight: 600 }}>
          영양 정보 (1인분 기준)
        </h2>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">칼로리</p>
              <p className="text-lg" style={{ fontWeight: 600 }}>
                {Math.round(recipe.nutrition.calories / recipe.servings)}
                <span className="text-sm text-gray-600 ml-1">kcal</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">단백질</p>
              <p className="text-lg" style={{ fontWeight: 600 }}>
                {Math.round(recipe.nutrition.protein / recipe.servings)}
                <span className="text-sm text-gray-600 ml-1">g</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">탄수화물</p>
              <p className="text-lg" style={{ fontWeight: 600 }}>
                {Math.round(recipe.nutrition.carbs / recipe.servings)}
                <span className="text-sm text-gray-600 ml-1">g</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">지방</p>
              <p className="text-lg" style={{ fontWeight: 600 }}>
                {Math.round(recipe.nutrition.fat / recipe.servings)}
                <span className="text-sm text-gray-600 ml-1">g</span>
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 mb-1">나트륨</p>
              <p className="text-lg" style={{ fontWeight: 600 }}>
                {Math.round(recipe.nutrition.sodium / recipe.servings)}
                <span className="text-sm text-gray-600 ml-1">mg</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-5">
        <div className="max-w-screen-sm mx-auto flex gap-2">
          {missingNotInList.length > 0 && (
            <button
              onClick={handleBulkAdd}
              disabled={adding}
              className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 rounded-xl disabled:opacity-50"
              style={{ fontWeight: 600 }}
            >
              {adding ? '추가 중...' : `부족한 재료 ${missingNotInList.length}개 추가`}
            </button>
          )}
          <Link to="/shopping-list" className="flex-1">
            <button
              className="w-full py-4 rounded-xl"
              style={{ backgroundColor: '#CDFF00', fontWeight: 600 }}
            >
              장보기 리스트 보기
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
