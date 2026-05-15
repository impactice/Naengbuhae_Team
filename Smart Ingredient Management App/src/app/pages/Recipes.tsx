import { useState, useMemo } from 'react';
import { useIngredients } from '../hooks/useIngredients';
import { useRecipes } from '../hooks/useRecipes';
import { matchRecipesWithIngredients, getDifficultyLabel } from '../utils/recipeMatch';
import { Link } from 'react-router';
import { ChefHat, Clock, Users, ArrowLeft, Sparkles, X, ChevronRight, Check, Heart } from 'lucide-react';
import { isGuest } from '../utils/guestMode';
import GuestBlocked from '../components/GuestBlocked';

// ─────────────────────────────────────────────────────────────────────────────
// 요리 스타일 옵션 목록
// TODO: 백엔드 연동 시 이 목록을 서버에서 가져올 수도 있음 (현재는 하드코딩)
// ─────────────────────────────────────────────────────────────────────────────
const CUISINE_STYLES = [
  { id: 'korean',    label: '한식',   emoji: '🍚' },
  { id: 'chinese',   label: '중식',   emoji: '🥢' },
  { id: 'japanese',  label: '일식',   emoji: '🍣' },
  { id: 'western',   label: '양식',   emoji: '🍝' },
  { id: 'southeast', label: '동남아식', emoji: '🍜' },
  { id: 'indian',    label: '인도식', emoji: '🍛' },
  { id: 'fusion',    label: '퓨전',   emoji: '✨' },
  { id: 'diet',      label: '다이어트', emoji: '🥗' },
  { id: 'soup',      label: '국/탕/찌개', emoji: '🍲' },
  { id: 'snack',     label: '간식/디저트', emoji: '🧁' },
];

// ─────────────────────────────────────────────────────────────────────────────
// AI 추천 모달 컴포넌트
// step 1: 식재료 다중 선택 (현재 냉장고에 있는 재료 목록 표시)
// step 2: 요리 스타일 선택 (다중 선택 가능)
// step 3: 백엔드로 POST 전송
//
// TODO: 백엔드 연동 시
//   - step 1의 ingredientOptions를 /ingredient/list API로 교체
//   - sendToBackend() 함수의 fetch URL을 실제 AI 추천 엔드포인트로 교체
//   - 응답 처리 로직 추가 (추천 결과를 레시피 목록에 표시 등)
// ─────────────────────────────────────────────────────────────────────────────
function AIRecommendModal({
  onClose,
  ingredientOptions,
}: {
  onClose: () => void;
  ingredientOptions: string[];
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const toggleIngredient = (name: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const toggleStyle = (id: string) => {
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  // ─────────────────────────────────────────────
  // TODO: 실제 백엔드 AI 추천 API 연동 시 이 함수를 수정하세요.
  //   현재: 가짜 2초 딜레이 후 성공 처리
  //   연동 후 예시:
  //     const res = await apiFetch('/recipe/ai-recommend', {
  //       method: 'POST',
  //       body: JSON.stringify({ ingredients: selectedIngredients, styles: selectedStyles }),
  //     });
  //     const data = await res.json();
  //     // data.recipes 를 상위 컴포넌트로 전달하거나 navigate('/recipes?ai=1') 등
  // ─────────────────────────────────────────────
  const sendToBackend = async () => {
    setIsLoading(true);
    try {
      console.log('[AI 추천 요청]', {
        ingredients: selectedIngredients,
        styles: selectedStyles,
      });

      // TODO: 아래 fetch를 실제 엔드포인트로 교체 (현재는 백엔드 없이 개발 중이므로 mock)
      await fetch('http://localhost:8080/recipe/ai-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: selectedIngredients,
          cuisineStyles: selectedStyles,
        }),
      }).catch(() => {
        // 백엔드 없어도 UI 흐름 확인 가능하도록 에러 무시 (개발용)
        // TODO: 실제 연동 시 이 catch 제거하고 에러 처리 추가
      });

      setIsDone(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 모달 오버레이
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* 모달 바디 — 하단 시트 스타일 */}
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 dark:text-gray-100 rounded-t-3xl flex flex-col"
        style={{ maxHeight: '88vh' }}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: '#7A9600' }} />
            <span className="text-base" style={{ fontWeight: 700 }}>
              AI 레시피 추천
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="flex items-center gap-2 px-5 pb-3">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full text-xs"
            style={{
              backgroundColor: step >= 1 ? '#CDFF00' : '#F3F4F6',
              fontWeight: 700,
              color: step >= 1 ? '#000' : '#9CA3AF',
            }}
          >
            1
          </div>
          <div className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: step >= 2 ? '#CDFF00' : '#E5E7EB' }} />
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full text-xs"
            style={{
              backgroundColor: step >= 2 ? '#CDFF00' : '#F3F4F6',
              fontWeight: 700,
              color: step >= 2 ? '#000' : '#9CA3AF',
            }}
          >
            2
          </div>
        </div>

        {/* ── STEP 1: 식재료 선택 ── */}
        {step === 1 && !isDone && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-5 pb-2">
              <p className="text-sm" style={{ fontWeight: 600 }}>사용할 식재료를 선택하세요</p>
              <p className="text-xs text-gray-400 mt-0.5">중복 선택 가능 · {selectedIngredients.length}개 선택됨</p>
            </div>

            {/* 식재료 그리드 — 스크롤 */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {ingredientOptions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm">등록된 식재료가 없습니다</p>
                  <p className="text-xs text-gray-300 mt-1">
                    {/* TODO: 백엔드 연동 시 실제 냉장고 식재료 목록이 여기에 표시됩니다 */}
                    식재료를 먼저 추가해주세요
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {ingredientOptions.map((name) => {
                    const isSelected = selectedIngredients.includes(name);
                    return (
                      <button
                        key={name}
                        onClick={() => toggleIngredient(name)}
                        className="relative py-3 px-2 rounded-xl border-2 text-sm transition-all active:scale-95"
                        style={{
                          borderColor: isSelected ? '#CDFF00' : '#E5E7EB',
                          backgroundColor: isSelected ? '#CDFF0015' : '#F9FAFB',
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#3D5A00' : '#374151',
                        }}
                      >
                        {isSelected && (
                          <span
                            className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: '#CDFF00' }}
                          >
                            <Check className="w-2.5 h-2.5" style={{ color: '#3D5A00' }} />
                          </span>
                        )}
                        {name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 다음 버튼 */}
            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setStep(2)}
                disabled={selectedIngredients.length === 0}
                className="w-full py-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  backgroundColor: selectedIngredients.length > 0 ? '#CDFF00' : '#F3F4F6',
                  color: selectedIngredients.length > 0 ? '#000' : '#9CA3AF',
                  fontWeight: 600,
                }}
              >
                다음
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: 요리 스타일 선택 ── */}
        {step === 2 && !isDone && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-5 pb-2">
              <p className="text-sm" style={{ fontWeight: 600 }}>원하는 요리 스타일을 선택하세요</p>
              <p className="text-xs text-gray-400 mt-0.5">중복 선택 가능 · 선택 없으면 전체 스타일 추천</p>
            </div>

            {/* 스타일 그리드 — 스크롤 */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <div className="grid grid-cols-2 gap-2">
                {CUISINE_STYLES.map(({ id, label, emoji }) => {
                  const isSelected = selectedStyles.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleStyle(id)}
                      className="flex items-center gap-3 py-3.5 px-4 rounded-xl border-2 transition-all active:scale-95"
                      style={{
                        borderColor: isSelected ? '#CDFF00' : '#E5E7EB',
                        backgroundColor: isSelected ? '#CDFF0015' : '#F9FAFB',
                      }}
                    >
                      <span className="text-xl">{emoji}</span>
                      <span
                        className="text-sm"
                        style={{
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#3D5A00' : '#374151',
                        }}
                      >
                        {label}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 ml-auto" style={{ color: '#7A9600' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="py-4 px-5 rounded-xl text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                style={{ fontWeight: 600 }}
              >
                이전
              </button>
              <button
                onClick={sendToBackend}
                disabled={isLoading}
                className="flex-1 py-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  backgroundColor: '#CDFF00',
                  fontWeight: 700,
                  color: '#000',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI 추천 받기
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── 완료 상태 ── */}
        {isDone && (
          <div className="flex flex-col items-center justify-center flex-1 px-5 pb-10">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: '#CDFF0030' }}
            >
              <Sparkles className="w-8 h-8" style={{ color: '#7A9600' }} />
            </div>
            <p className="text-base text-center" style={{ fontWeight: 700 }}>
              AI 추천 요청을 전송했어요!
            </p>
            <p className="text-sm text-gray-400 text-center mt-1">
              {/* TODO: 백엔드 연동 후 실제 추천 결과 표시 로직으로 교체 */}
              백엔드 연동 후 추천 결과가 여기에 표시됩니다
            </p>
            <div className="mt-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl w-full">
              <p className="text-xs text-gray-500 mb-1" style={{ fontWeight: 600 }}>전송된 데이터</p>
              <p className="text-xs text-gray-400">식재료: {selectedIngredients.join(', ')}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                스타일: {selectedStyles.length > 0
                  ? CUISINE_STYLES.filter((c) => selectedStyles.includes(c.id)).map((c) => c.label).join(', ')
                  : '전체'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-5 w-full py-4 rounded-xl text-sm"
              style={{ backgroundColor: '#CDFF00', fontWeight: 700 }}
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 Recipes 페이지
// ─────────────────────────────────────────────────────────────────────────────
export default function Recipes() {
  const { ingredients } = useIngredients();
  const { recipes, loading, toggleFavorite } = useRecipes();
  const [filterMode, setFilterMode] = useState<'all' | 'makeable' | 'favorites'>('all');
  const [showAIModal, setShowAIModal] = useState(false);

  const matches = useMemo(
    () => matchRecipesWithIngredients(recipes, ingredients),
    [recipes, ingredients]
  );

  // 필터 적용 — "만들 수 있는 요리" 또는 "즐겨찾기만"
  const filteredMatches = filterMode === 'makeable'
    ? matches.filter((m) => m.hasIngredients.length > 0)
    : filterMode === 'favorites'
    ? matches.filter((m) => m.recipe.favorite)
    : matches;

  const makeableCount = matches.filter((m) => m.hasIngredients.length > 0).length;

  // ─────────────────────────────────────────────
  // AI 추천 모달에 전달할 식재료 이름 목록
  // TODO: 백엔드 연동 시 ingredients 대신 /ingredient/list API 응답으로 교체 가능
  //       현재는 ingredientStore(로컬 상태)에서 가져온 이름 목록 사용
  // ─────────────────────────────────────────────
  const ingredientNames = useMemo(
    () => ingredients.map((i) => i.name),
    [ingredients]
  );

  if (isGuest()) return <GuestBlocked feature="맞춤 레시피" />;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">레시피를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-4">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <Link to="/" className="p-1">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl" style={{ fontWeight: 700 }}>
            레시피 추천
          </h1>
        </div>
        <p className="text-sm text-gray-500 ml-10">
          보유 식재료로 만들 수 있는 요리 {makeableCount}개
        </p>
      </div>

      {/* 필터 + AI 추천 버튼 */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-2">
          {/* 기존 필터 버튼들 */}
          <FilterButton
            active={filterMode === 'all'}
            onClick={() => setFilterMode('all')}
          >
            전체 레시피
          </FilterButton>
          <FilterButton
            active={filterMode === 'makeable'}
            onClick={() => setFilterMode('makeable')}
          >
            만들 수 있는 요리
          </FilterButton>
          <FilterButton
            active={filterMode === 'favorites'}
            onClick={() => setFilterMode('favorites')}
          >
            <Heart className="w-3.5 h-3.5 inline -mt-0.5 mr-0.5" fill={filterMode === 'favorites' ? 'currentColor' : 'none'} />
            즐겨찾기
          </FilterButton>

          {/* AI 추천 버튼 — 필터 버튼 오른쪽에 자연스럽게 배치 */}
          <button
            onClick={() => setShowAIModal(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all active:scale-95 whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #CDFF00 0%, #A8D400 100%)',
              fontWeight: 700,
              color: '#1A3300',
              boxShadow: '0 2px 8px rgba(205,255,0,0.4)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI 추천
          </button>
        </div>
      </div>

      {/* 재료 부족 안내 */}
      {ingredients.length === 0 && (
        <div className="mx-5 mb-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-4 border border-yellow-100 dark:border-yellow-800/50">
          <p className="text-sm" style={{ fontWeight: 600 }}>
            등록된 식재료가 없습니다
          </p>
          <p className="text-xs text-gray-600 mt-1">
            식재료를 등록하면 맞춤 레시피를 추천해드려요
          </p>
        </div>
      )}

      {/* 레시피 목록 */}
      <div className="px-5">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">
              {filterMode === 'makeable'
                ? '현재 만들 수 있는 요리가 없습니다'
                : '레시피가 없습니다'}
            </p>
            {filterMode === 'makeable' && (
              <p className="text-xs text-gray-400 mt-1">
                식재료를 추가하면 더 많은 레시피를 만들 수 있어요
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map((match) => (
              <Link
                key={match.recipe.id}
                to={`/recipe/${match.recipe.id}`}
              >
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base" style={{ fontWeight: 600 }}>
                          {match.recipe.name}
                        </h3>
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor:
                              match.matchRate >= 100
                                ? '#CDFF0020'
                                : match.matchRate >= 50
                                ? '#FFD60A20'
                                : '#FF3B3020',
                            color:
                              match.matchRate >= 100
                                ? '#7A9600'
                                : match.matchRate >= 50
                                ? '#B38C00'
                                : '#D4183D',
                            fontWeight: 600,
                          }}
                        >
                          {match.matchRate}% 매칭
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {match.recipe.category}
                      </p>
                    </div>
                    {/* 하트 — Link 안이라 클릭 시 stopPropagation + preventDefault 필요 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void toggleFavorite(match.recipe.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white"
                      aria-label="즐겨찾기"
                    >
                      <Heart
                        className={`w-5 h-5 ${match.recipe.favorite ? 'text-red-500' : 'text-gray-300'}`}
                        fill={match.recipe.favorite ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{match.recipe.cookingTime}분</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{match.recipe.servings}인분</span>
                    </div>
                    <span>{getDifficultyLabel(match.recipe.difficulty)}</span>
                  </div>

                  {/* 재료 현황 */}
                  <div className="space-y-1.5">
                    {match.hasIngredients.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-green-600 flex-shrink-0" style={{ fontWeight: 600 }}>
                          보유:
                        </span>
                        <span className="text-xs text-gray-600 flex-1">
                          {match.hasIngredients.join(', ')}
                        </span>
                      </div>
                    )}
                    {match.missingIngredients.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-red-600 flex-shrink-0" style={{ fontWeight: 600 }}>
                          부족:
                        </span>
                        <span className="text-xs text-gray-600 flex-1">
                          {match.missingIngredients.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 영양 정보 미리보기 */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>{match.recipe.nutrition.calories}kcal</span>
                      <span>단백질 {match.recipe.nutrition.protein}g</span>
                      <span>탄수화물 {match.recipe.nutrition.carbs}g</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* AI 추천 모달 */}
      {showAIModal && (
        <AIRecommendModal
          onClose={() => setShowAIModal(false)}
          ingredientOptions={ingredientNames}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 공용 필터 버튼 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
        active ? 'text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
      }`}
      style={{
        backgroundColor: active ? '#CDFF00' : undefined,
        fontWeight: active ? 600 : 500,
      }}
    >
      {children}
    </button>
  );
}