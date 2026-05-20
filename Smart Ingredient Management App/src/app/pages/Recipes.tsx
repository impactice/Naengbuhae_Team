import { useState, useMemo } from 'react';
import { useIngredients } from '../hooks/useIngredients';
import { useRecipes } from '../hooks/useRecipes';
import { matchRecipesWithIngredients, getDifficultyLabel } from '../utils/recipeMatch';
import { Link } from 'react-router';
import { ChefHat, Clock, Users, ArrowLeft, Sparkles, X, ChevronRight, Check, Heart } from 'lucide-react';
import { isGuest } from '../utils/guestMode';
import GuestBlocked from '../components/GuestBlocked';
import { apiFetch } from '../utils/apiClient';

// AI 추천 응답 항목 — POST /api/recipes/ai-recommendations 응답 (백엔드가 AI 서버 응답 그대로 전달).
interface AiRecipeResult {
  dish_name: string;
  additional_ingredients: string[];
  health_benefits: string;
  recipe_tip: string;
}

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
  const [aiResults, setAiResults] = useState<AiRecipeResult[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  // 결과 리스트 ↔ 단일 상세 화면 토글. null이면 리스트, 인덱스면 그 상세.
  const [selectedRecipeIdx, setSelectedRecipeIdx] = useState<number | null>(null);
  const [addingToShopping, setAddingToShopping] = useState(false);

  // AI 응답 ingredient 텍스트("신선한 채소 (루꼴라, 시금치 등): 활용법..." 같이 자유 형식)에서
  // 장보기 항목 name으로 쓸 앞부분만 추출. ":" 또는 "(" 앞까지.
  const parseIngredientName = (text: string): string => {
    return text.split(/[:\(（]/)[0].trim();
  };

  const handleAddToShopping = async (rec: AiRecipeResult) => {
    if (addingToShopping) return;
    const items = rec.additional_ingredients
      .map(parseIngredientName)
      .filter((n) => n.length > 0)
      .map((name) => ({ name, quantity: 1, unit: '개' }));
    if (items.length === 0) {
      alert('추가할 재료가 없어요.');
      return;
    }
    if (!confirm(`재료 ${items.length}개를 장보기 리스트에 추가할까요?\n\n${items.map((i) => `· ${i.name}`).join('\n')}`)) return;

    setAddingToShopping(true);
    try {
      const res = await apiFetch('/api/shopping-list/bulk-add', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        alert(`장보기에 ${items.length}개 항목을 추가했어요!`);
      } else {
        alert(`추가 실패 (${res.status})`);
      }
    } catch {
      alert('서버 연결 실패');
    } finally {
      setAddingToShopping(false);
    }
  };

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

  // POST /api/recipes/ai-recommendations — capstone-ai /api/recommend 프록시.
  // 사용자 선택 식재료/스타일을 전달하면 3개 요리 추천이 옴.
  // Gemini 부하/한도 상황에 따라 1~2분 걸릴 수 있음 (UI에 "1~3분 소요" 안내).
  const sendToBackend = async () => {
    setIsLoading(true);
    setAiError(null);
    setAiResults(null);
    setSelectedRecipeIdx(null);
    try {
      // 스타일 id('korean') → 라벨('한식')로 변환해서 AI 서버가 알아보기 쉽게
      const styleLabels = selectedStyles
        .map((id) => CUISINE_STYLES.find((s) => s.id === id)?.label ?? id);

      const res = await apiFetch('/api/recipes/ai-recommendations', {
        method: 'POST',
        body: JSON.stringify({
          ingredients: selectedIngredients,
          styles: styleLabels,
        }),
      });

      if (!res.ok) {
        const msg = res.status === 503 ? 'AI 서버에 연결할 수 없습니다.'
          : res.status === 429 ? '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
          : `추천 실패 (${res.status})`;
        setAiError(msg);
        return;
      }
      const data = (await res.json()) as AiRecipeResult[];
      setAiResults(data ?? []);
      setIsDone(true);
    } catch {
      setAiError('서버 연결 실패');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 모달 오버레이
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={() => { /* 바깥 클릭으로는 닫히지 않게 — Gemini 한도 한정이라 실수로 결과 날리면 손해 큼. X 버튼으로만 */ }}
    >
      {/* 모달 바디 — 하단 시트 스타일 */}
      <div
        className="w-full max-w-md bg-background text-foreground rounded-t-3xl flex flex-col"
        style={{ maxHeight: '88vh' }}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-secondary rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: '#7A9600' }} />
            <span className="text-base" style={{ fontWeight: 700 }}>
              AI 레시피 추천
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-1">
            {/* STEP 1 */}
            <div className="flex items-center gap-2 flex-1">
              <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                style={{
                  backgroundColor: step >= 1 ? 'var(--accent)' : '#F3F4F6',
                  fontWeight: 700,
                  color: step >= 1 ? '#1A3300' : '#9CA3AF',
                }}
              >
                {isDone || step > 1 ? <Check className="w-4 h-4" style={{ color: '#1A3300' }} /> : '1'}
              </div>
              <div>
                <p
                  className="text-xs leading-tight"
                  style={{
                    fontWeight: step === 1 ? 700 : 500,
                    color: step >= 1 ? 'var(--foreground)' : '#9CA3AF',
                  }}
                >
                  식재료 선택
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">사용할 재료 고르기</p>
              </div>
            </div>

            {/* 연결선 */}
            <div
              className="w-8 h-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: step >= 2 ? 'var(--accent)' : '#E5E7EB' }}
            />

            {/* STEP 2 */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <div>
                <p
                  className="text-xs leading-tight text-right"
                  style={{
                    fontWeight: step === 2 ? 700 : 500,
                    color: step >= 2 ? 'var(--foreground)' : '#9CA3AF',
                  }}
                >
                  스타일 선택
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight text-right">요리 스타일 고르기</p>
              </div>
              <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                style={{
                  backgroundColor: step >= 2 ? 'var(--accent)' : '#F3F4F6',
                  fontWeight: 700,
                  color: step >= 2 ? '#1A3300' : '#9CA3AF',
                }}
              >
                {isDone ? <Check className="w-4 h-4" style={{ color: '#1A3300' }} /> : '2'}
              </div>
            </div>
          </div>

          {/* 진행 바 */}
          <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                backgroundColor: 'var(--accent)',
                width: isDone ? '100%' : step === 1 ? '25%' : '75%',
              }}
            />
          </div>
        </div>

        {/* ── STEP 1: 식재료 선택 ── */}
        {step === 1 && !isDone && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-5 pb-2">
              <p className="text-sm" style={{ fontWeight: 600 }}>사용할 식재료를 선택하세요</p>
              <p className="text-xs text-muted-foreground mt-0.5">중복 선택 가능 · {selectedIngredients.length}개 선택됨</p>
            </div>

            {/* 식재료 그리드 — 스크롤 */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {ingredientOptions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground text-sm">등록된 식재료가 없습니다</p>
                  <p className="text-xs text-muted-foreground opacity-50 mt-1">
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
                          borderColor: isSelected ? 'var(--accent)' : '#E5E7EB',
                          backgroundColor: isSelected ? '#CDFF0015' : '#F9FAFB',
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#3D5A00' : '#374151',
                        }}
                      >
                        {isSelected && (
                          <span
                            className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'var(--accent)' }}
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
            <div className="px-5 py-4 border-t border-border">
              <button
                onClick={() => setStep(2)}
                disabled={selectedIngredients.length === 0}
                className="w-full py-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  backgroundColor: selectedIngredients.length > 0 ? 'var(--accent)' : '#F3F4F6',
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
              <p className="text-xs text-muted-foreground mt-0.5">중복 선택 가능 · 선택 없으면 전체 스타일 추천</p>
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
                        borderColor: isSelected ? 'var(--accent)' : '#E5E7EB',
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
            <div className="px-5 py-4 border-t border-gray-100">
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 text-center">
                ⏱️ AI 분석은 <strong>1~3분</strong> 정도 걸려요. 잠시만 기다려주세요.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="py-4 px-5 rounded-xl text-sm bg-secondary text-muted-foreground transition-colors hover:opacity-80 disabled:opacity-50"
                  style={{ fontWeight: 600 }}
                >
                  이전
                </button>
                <button
                  onClick={sendToBackend}
                  disabled={isLoading || selectedIngredients.length === 0}
                  className="flex-1 py-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    backgroundColor: 'var(--accent)',
                    fontWeight: 700,
                    color: '#000',
                    opacity: (isLoading || selectedIngredients.length === 0) ? 0.7 : 1,
                  }}
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      AI 분석 중... (최대 3분)
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
          </div>
        )}

        {/* ── 완료 상태 ── */}
        {isDone && selectedRecipeIdx === null && (
          <div className="flex-1 overflow-y-auto px-5 pb-6">
            <div className="flex items-center gap-2 mb-3 mt-1">
              <Sparkles className="w-5 h-5" style={{ color: '#7A9600' }} />
              <span className="text-base" style={{ fontWeight: 700 }}>AI 추천 결과</span>
            </div>
            {aiResults && aiResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">추천 결과가 없습니다. 다시 시도해주세요.</p>
            )}
            {aiResults && aiResults.length > 0 && (
              <div className="space-y-3">
                {aiResults.map((rec, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedRecipeIdx(i)}
                    className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-border-strong hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-base flex-1">{rec.dish_name}</h4>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    </div>
                    {rec.additional_ingredients && rec.additional_ingredients.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        <span className="font-semibold">추가 재료: </span>
                        {rec.additional_ingredients.map(parseIngredientName).join(', ')}
                      </p>
                    )}
                    {rec.health_benefits && (
                      <p className="text-sm leading-relaxed mt-2 line-clamp-2">{rec.health_benefits}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-5 w-full py-4 rounded-xl text-sm"
              style={{ backgroundColor: 'var(--accent)', fontWeight: 700 }}
            >
              확인
            </button>
          </div>
        )}
        {isDone && selectedRecipeIdx !== null && aiResults && aiResults[selectedRecipeIdx] && (() => {
          const rec = aiResults[selectedRecipeIdx];
          return (
            <div className="flex-1 overflow-y-auto pb-6">
              {/* 헤더 — back 버튼 + 제목 */}
              <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center gap-2 z-10">
                <button
                  onClick={() => setSelectedRecipeIdx(null)}
                  className="p-1.5 -ml-1 hover:bg-secondary rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-base flex-1 truncate" style={{ fontWeight: 700 }}>{rec.dish_name}</h3>
              </div>

              <div className="px-5 pt-4 space-y-5">
                {/* AI 추천 뱃지 */}
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                    style={{ backgroundColor: 'var(--accent)', color: '#1A3300', fontWeight: 700 }}
                  >
                    <Sparkles className="w-3 h-3" />
                    AI 추천
                  </span>
                </div>

                {/* 필요한 재료 */}
                {rec.additional_ingredients && rec.additional_ingredients.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">필요한 재료</h4>
                    <div className="space-y-2">
                      {rec.additional_ingredients.map((text, j) => (
                        <div key={j} className="bg-card border border-border rounded-lg px-3 py-2.5">
                          <p className="text-sm font-medium">{parseIngredientName(text)}</p>
                          {text.includes(':') && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {text.split(':').slice(1).join(':').trim()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* 장보기에 추가 버튼 */}
                    <button
                      type="button"
                      onClick={() => handleAddToShopping(rec)}
                      disabled={addingToShopping}
                      className="w-full mt-3 py-3 rounded-xl text-sm flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
                      style={{ fontWeight: 600 }}
                    >
                      {addingToShopping ? '추가 중...' : `없는 재료 ${rec.additional_ingredients.length}개 장보기에 추가`}
                    </button>
                  </div>
                )}

                {/* 효능 / 추천 이유 */}
                {rec.health_benefits && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">효능 / 추천 이유</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">{rec.health_benefits}</p>
                  </div>
                )}

                {/* 조리 팁 */}
                {rec.recipe_tip && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">조리 팁</h4>
                    <div className="bg-card border border-border rounded-lg p-3">
                      <p className="text-sm leading-relaxed">💡 {rec.recipe_tip}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSelectedRecipeIdx(null)}
                  className="w-full py-3 rounded-xl text-sm bg-secondary"
                  style={{ fontWeight: 600 }}
                >
                  ← 추천 목록으로
                </button>
              </div>
            </div>
          );
        })()}
        {aiError && !isLoading && (
          <div className="px-5 pb-6">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-xl p-4">
              <p className="text-sm text-red-700 dark:text-red-300" style={{ fontWeight: 600 }}>{aiError}</p>
            </div>
            <button
              onClick={onClose}
              className="mt-3 w-full py-3 rounded-xl text-sm bg-secondary"
              style={{ fontWeight: 600 }}
            >
              닫기
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">레시피를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-4">
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
        <p className="text-sm text-muted-foreground ml-10">
          보유 식재료로 만들 수 있는 요리 {makeableCount}개
        </p>
      </div>

      {/* 필터 + AI 추천 버튼 — 2×2 그리드로 균등 배치 */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-2 gap-2">
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

          {/* AI 추천 버튼 */}
          <button
            onClick={() => setShowAIModal(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%)',
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
          <p className="text-xs text-muted-foreground mt-1">
            식재료를 등록하면 맞춤 레시피를 추천해드려요
          </p>
        </div>
      )}

      {/* 레시피 목록 */}
      <div className="px-5">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {filterMode === 'makeable'
                ? '현재 만들 수 있는 요리가 없습니다'
                : '레시피가 없습니다'}
            </p>
            {filterMode === 'makeable' && (
              <p className="text-xs text-muted-foreground mt-1">
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
                <div className="bg-card border border-border rounded-xl p-4 hover:bg-secondary transition-colors">
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
                      <p className="text-xs text-muted-foreground">
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
                        className={`w-5 h-5 ${match.recipe.favorite ? 'text-red-500' : 'text-muted-foreground opacity-50'}`}
                        fill={match.recipe.favorite ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
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
                        <span className="text-xs text-muted-foreground flex-1">
                          {match.hasIngredients.join(', ')}
                        </span>
                      </div>
                    )}
                    {match.missingIngredients.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-red-600 flex-shrink-0" style={{ fontWeight: 600 }}>
                          부족:
                        </span>
                        <span className="text-xs text-muted-foreground flex-1">
                          {match.missingIngredients.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 영양 정보 미리보기 */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
      className={`w-full px-4 py-2 rounded-lg text-sm ${
        active ? 'text-black' : 'bg-secondary text-muted-foreground'
      }`}
      style={{
        backgroundColor: active ? 'var(--accent)' : undefined,
        fontWeight: active ? 600 : 500,
      }}
    >
      {children}
    </button>
  );
}