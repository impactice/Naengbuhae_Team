import { useState, useMemo } from 'react';
import { useIngredients } from '../hooks/useIngredients';
import { recipes } from '../data/recipes';
import { matchRecipesWithIngredients, getDifficultyLabel } from '../utils/recipeMatch';
import { Link } from 'react-router';
import { ChefHat, Clock, Users, ArrowLeft } from 'lucide-react';

export default function Recipes() {
  const { ingredients } = useIngredients();
  const [filterMode, setFilterMode] = useState<'all' | 'makeable'>('all');

  const matches = useMemo(
    () => matchRecipesWithIngredients(recipes, ingredients),
    [ingredients]
  );

  const filteredMatches = filterMode === 'makeable'
    ? matches.filter((m) => m.matchRate >= 100)
    : matches;

  const makeableCount = matches.filter((m) => m.matchRate >= 100).length;

  return (
    <div className="min-h-screen bg-white pb-4">
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

      {/* 필터 */}
      <div className="px-5 pb-4">
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* 재료 부족 안내 */}
      {ingredients.length === 0 && (
        <div className="mx-5 mb-4 bg-yellow-50 rounded-xl p-4 border border-yellow-100">
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
                <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
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
                  <div className="mt-3 pt-3 border-t border-gray-200">
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
    </div>
  );
}

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
      className={`px-4 py-2 rounded-lg text-sm ${
        active ? 'text-black' : 'bg-gray-100 text-gray-600'
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