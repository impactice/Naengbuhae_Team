import { useState } from 'react';
import { useIngredients } from '../hooks/useIngredients';
import { Link } from 'react-router';
import { ChevronLeft, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 식재료별 영양 정보 데이터베이스 (100g 기준)
const nutritionDatabase: Record<string, {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  vitamins?: string[];
}> = {
  // 채소
  '당근': { calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, vitamins: ['비타민A', '비타민K'] },
  '양파': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, vitamins: ['비타민C'] },
  '토마토': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, vitamins: ['비타민C', '리코펜'] },
  '배추': { calories: 13, protein: 1.2, carbs: 2.2, fat: 0.2, fiber: 1.2, vitamins: ['비타민K', '비타민C'] },
  '브로콜리': { calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6, vitamins: ['비타민C', '비타민K'] },
  '시금치': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, vitamins: ['비타민A', '철분'] },

  // 육류
  '돼지고기': { calories: 242, protein: 27.3, carbs: 0, fat: 14.0, sodium: 62 },
  '소고기': { calories: 250, protein: 26.1, carbs: 0, fat: 15.4, sodium: 72 },
  '닭고기': { calories: 165, protein: 31.0, carbs: 0, fat: 3.6, sodium: 82 },
  '닭가슴살': { calories: 165, protein: 31.0, carbs: 0, fat: 3.6, sodium: 74 },

  // 해산물
  '고등어': { calories: 205, protein: 18.6, carbs: 0, fat: 13.9, vitamins: ['오메가-3', '비타민D'] },
  '연어': { calories: 208, protein: 20.4, carbs: 0, fat: 13.4, vitamins: ['오메가-3', '비타민D'] },
  '새우': { calories: 99, protein: 20.9, carbs: 0.9, fat: 1.7, sodium: 148 },

  // 유제품
  '우유': { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, sodium: 44, vitamins: ['칼슘', '비타민D'] },
  '요구르트': { calories: 59, protein: 3.5, carbs: 4.7, fat: 3.3, vitamins: ['칼슘', '프로바이오틱스'] },
  '치즈': { calories: 402, protein: 25.0, carbs: 1.3, fat: 33.1, sodium: 621, vitamins: ['칼슘'] },

  // 과일
  '사과': { calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, vitamins: ['비타민C'] },
  '바나나': { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, vitamins: ['칼륨', '비타민B6'] },
  '딸기': { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2.0, vitamins: ['비타민C'] },

  // 곡물
  '쌀': { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4 },
  '현미': { calories: 111, protein: 2.6, carbs: 23.5, fat: 0.9, fiber: 1.8, vitamins: ['비타민B'] },
  '귀리': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, vitamins: ['식이섬유'] },
  '식빵': { calories: 265, protein: 8.7, carbs: 49.4, fat: 3.2, sodium: 491 },

  // 기본값
  'default': { calories: 150, protein: 5, carbs: 20, fat: 3, fiber: 2 }
};

export default function NutritionAnalysis() {
  const { ingredients } = useIngredients();
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);

  // 전체 영양 통계
  const totalNutrition = ingredients.reduce((acc, ing) => {
    const nutrition = nutritionDatabase[ing.name] || nutritionDatabase['default'];
    const factor = ing.quantity / 100; // 100g 기준으로 계산

    return {
      calories: acc.calories + (nutrition.calories * factor),
      protein: acc.protein + (nutrition.protein * factor),
      carbs: acc.carbs + (nutrition.carbs * factor),
      fat: acc.fat + (nutrition.fat * factor),
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // 사용자 프로필 불러오기
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  const allergies = userProfile.allergies?.toLowerCase().split(',').map((a: string) => a.trim()) || [];

  // 영양소 비율 데이터
  const macroData = [
    { name: '단백질', value: totalNutrition.protein, color: '#FF6B6B' },
    { name: '탄수화물', value: totalNutrition.carbs, color: '#4ECDC4' },
    { name: '지방', value: totalNutrition.fat, color: '#FFD93D' },
  ];

  // 식재료별 칼로리 비교 (상위 8개)
  const ingredientCalories = ingredients
    .map(ing => {
      const nutrition = nutritionDatabase[ing.name] || nutritionDatabase['default'];
      const factor = ing.quantity / 100;
      return {
        name: ing.name,
        calories: Math.round(nutrition.calories * factor),
        protein: Math.round(nutrition.protein * factor),
        carbs: Math.round(nutrition.carbs * factor),
        fat: Math.round(nutrition.fat * factor),
      };
    })
    .sort((a, b) => b.calories - a.calories)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center z-10">
        <Link to="/my-custom" className="p-2 -ml-2 hover:bg-gray-50 rounded-lg transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="ml-2 text-xl" style={{ fontWeight: 700 }}>
          영양 분석
        </h1>
      </div>

      {ingredients.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">등록된 식재료가 없습니다</p>
          <Link
            to="/add-ingredient"
            className="inline-block mt-4 px-6 py-3 bg-[#CDFF00] rounded-xl font-semibold hover:bg-[#b8e600] transition-colors"
          >
            식재료 추가하기
          </Link>
        </div>
      ) : (
        <>
          {/* 전체 영양 요약 */}
          <div className="px-5 py-5">
            <div className="bg-gradient-to-br from-[#CDFF00] to-[#b8e600] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5" />
                <h2 className="font-semibold">전체 식재료 영양 정보</h2>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-white/90 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">칼로리</p>
                  <p className="text-lg font-bold">{Math.round(totalNutrition.calories)}</p>
                  <p className="text-xs text-gray-500">kcal</p>
                </div>
                <div className="bg-white/90 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">단백질</p>
                  <p className="text-lg font-bold">{Math.round(totalNutrition.protein)}</p>
                  <p className="text-xs text-gray-500">g</p>
                </div>
                <div className="bg-white/90 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">탄수화물</p>
                  <p className="text-lg font-bold">{Math.round(totalNutrition.carbs)}</p>
                  <p className="text-xs text-gray-500">g</p>
                </div>
                <div className="bg-white/90 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">지방</p>
                  <p className="text-lg font-bold">{Math.round(totalNutrition.fat)}</p>
                  <p className="text-xs text-gray-500">g</p>
                </div>
              </div>
            </div>
          </div>

          {/* 영양소 비율 차트 */}
          <div className="px-5 pb-5">
            <h3 className="font-semibold mb-3">영양소 구성 비율</h3>
            <div className="bg-gray-50 rounded-2xl p-5">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {macroData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 식재료별 칼로리 비교 */}
          <div className="px-5 pb-5">
            <h3 className="font-semibold mb-3">식재료별 칼로리</h3>
            <div className="bg-gray-50 rounded-2xl p-5">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ingredientCalories}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="calories" fill="#CDFF00" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 식재료별 상세 영양 정보 */}
          <div className="px-5 pb-5">
            <h3 className="font-semibold mb-3">식재료별 영양 성분</h3>
            <div className="space-y-2">
              {ingredients.map((ing) => {
                const nutrition = nutritionDatabase[ing.name] || nutritionDatabase['default'];
                const factor = ing.quantity / 100;
                const isAllergic = allergies.some((allergy: string) =>
                  ing.name.toLowerCase().includes(allergy)
                );

                return (
                  <div
                    key={ing.id}
                    className={`rounded-xl p-4 border-2 ${
                      isAllergic
                        ? 'bg-red-50 border-red-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">{ing.name}</h4>
                          {isAllergic && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold">
                              <AlertCircle className="w-3 h-3" />
                              알레르기 주의
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {ing.quantity}{ing.unit} 기준
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-600">칼로리</p>
                        <p className="font-bold text-sm mt-1">
                          {Math.round(nutrition.calories * factor)}
                        </p>
                        <p className="text-xs text-gray-400">kcal</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-600">단백질</p>
                        <p className="font-bold text-sm mt-1">
                          {Math.round(nutrition.protein * factor)}
                        </p>
                        <p className="text-xs text-gray-400">g</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-600">탄수화물</p>
                        <p className="font-bold text-sm mt-1">
                          {Math.round(nutrition.carbs * factor)}
                        </p>
                        <p className="text-xs text-gray-400">g</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-600">지방</p>
                        <p className="font-bold text-sm mt-1">
                          {Math.round(nutrition.fat * factor)}
                        </p>
                        <p className="text-xs text-gray-400">g</p>
                      </div>
                    </div>

                    {/* 추가 영양 정보 */}
                    {(nutrition.fiber || nutrition.sodium || nutrition.vitamins) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          {nutrition.fiber && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs">
                              식이섬유 {Math.round(nutrition.fiber * factor)}g
                            </span>
                          )}
                          {nutrition.sodium && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs">
                              나트륨 {Math.round(nutrition.sodium * factor)}mg
                            </span>
                          )}
                          {nutrition.vitamins?.map((vitamin) => (
                            <span
                              key={vitamin}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs"
                            >
                              {vitamin}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 건강 팁 */}
          <div className="px-5 pb-5">
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">영양 균형 팁</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p>• 단백질은 체중 1kg당 0.8~1.2g 섭취를 권장합니다</p>
                <p>• 탄수화물은 전체 칼로리의 50~60% 비율이 적정합니다</p>
                <p>• 건강한 지방(불포화지방산)도 적절히 섭취해야 합니다</p>
                <p>• 나트륨은 하루 2,000mg 이하로 제한하는 것이 좋습니다</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
