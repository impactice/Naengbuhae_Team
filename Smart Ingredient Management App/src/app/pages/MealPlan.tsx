import { useState, useMemo } from 'react';
import { useIngredients } from '../hooks/useIngredients';
import { recipes } from '../data/recipes';
import { matchRecipesWithIngredients } from '../utils/recipeMatch';
import { Link } from 'react-router';
import { ArrowLeft, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일'];

interface MealPlanItem {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export default function MealPlan() {
  const { ingredients } = useIngredients();
  const [selectedDays, setSelectedDays] = useState(7);

  const matches = useMemo(
    () => matchRecipesWithIngredients(recipes, ingredients),
    [ingredients]
  );

  // 자동 식단 생성
  const mealPlan = useMemo(() => {
    const plan: MealPlanItem[] = [];
    const makeableRecipes = matches.filter((m) => m.matchRate >= 50);
    
    for (let i = 0; i < selectedDays; i++) {
      // 각 끼니별로 다양하게 선택
      const breakfast = makeableRecipes.find((m) => 
        m.recipe.category === '간식' || m.recipe.category === '음료'
      )?.recipe || recipes[0];
      
      const lunch = makeableRecipes.find((m) => 
        m.recipe.category === '밥/면' || m.recipe.category === '반찬'
      )?.recipe || recipes[1];
      
      const dinner = makeableRecipes[(i * 2) % makeableRecipes.length]?.recipe || recipes[2];

      const totalCalories = breakfast.nutrition.calories + 
        lunch.nutrition.calories + 
        dinner.nutrition.calories;
      
      const totalProtein = breakfast.nutrition.protein + 
        lunch.nutrition.protein + 
        dinner.nutrition.protein;

      const totalCarbs = breakfast.nutrition.carbs + 
        lunch.nutrition.carbs + 
        dinner.nutrition.carbs;

      const totalFat = breakfast.nutrition.fat + 
        lunch.nutrition.fat + 
        dinner.nutrition.fat;

      plan.push({
        day: daysOfWeek[i % 7],
        breakfast: breakfast.name,
        lunch: lunch.name,
        dinner: dinner.name,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
      });
    }

    return plan;
  }, [matches, selectedDays]);

  const weeklyTotal = mealPlan.reduce(
    (acc, day) => ({
      calories: acc.calories + day.totalCalories,
      protein: acc.protein + day.totalProtein,
      carbs: acc.carbs + day.totalCarbs,
      fat: acc.fat + day.totalFat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // 영양소 그래프 데이터
  const nutritionChartData = mealPlan.map((day) => ({
    day: day.day,
    칼로리: Math.round(day.totalCalories / 10), // 스케일 조정
    단백질: Math.round(day.totalProtein),
    탄수화물: Math.round(day.totalCarbs),
    지방: Math.round(day.totalFat),
  }));

  return (
    <div className="min-h-screen bg-white pb-4">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <Link to="/" className="p-1">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl" style={{ fontWeight: 700 }}>
            식단 추천
          </h1>
        </div>
        <p className="text-sm text-gray-500 ml-10">
          보유 식재료 기반 균형잡힌 식단
        </p>
      </div>

      {/* 기간 선택 */}
      <div className="px-5 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedDays(1)}
            className={`px-4 py-2 rounded-lg text-sm ${
              selectedDays === 1 ? 'text-black' : 'bg-gray-100 text-gray-600'
            }`}
            style={{
              backgroundColor: selectedDays === 1 ? '#CDFF00' : undefined,
              fontWeight: selectedDays === 1 ? 600 : 500,
            }}
          >
            오늘
          </button>
          <button
            onClick={() => setSelectedDays(3)}
            className={`px-4 py-2 rounded-lg text-sm ${
              selectedDays === 3 ? 'text-black' : 'bg-gray-100 text-gray-600'
            }`}
            style={{
              backgroundColor: selectedDays === 3 ? '#CDFF00' : undefined,
              fontWeight: selectedDays === 3 ? 600 : 500,
            }}
          >
            3일
          </button>
          <button
            onClick={() => setSelectedDays(7)}
            className={`px-4 py-2 rounded-lg text-sm ${
              selectedDays === 7 ? 'text-black' : 'bg-gray-100 text-gray-600'
            }`}
            style={{
              backgroundColor: selectedDays === 7 ? '#CDFF00' : undefined,
              fontWeight: selectedDays === 7 ? 600 : 500,
            }}
          >
            일주일
          </button>
        </div>
      </div>

      {/* 영양 요약 */}
      <div className="px-5 pb-4">
        <div className="bg-gradient-to-br from-lime-50 to-yellow-50 rounded-2xl p-5 border border-lime-200">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-lime-700" />
            <h3 className="text-sm" style={{ fontWeight: 600 }}>
              {selectedDays === 1 ? '오늘' : `${selectedDays}일간`} 영양 요약
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">총 칼로리</p>
              <p className="text-xl" style={{ fontWeight: 700 }}>
                {weeklyTotal.calories.toLocaleString()}
                <span className="text-sm text-gray-600 ml-1">kcal</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                평균 {Math.round(weeklyTotal.calories / selectedDays)}kcal/일
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">총 단백질</p>
              <p className="text-xl" style={{ fontWeight: 700 }}>
                {Math.round(weeklyTotal.protein)}
                <span className="text-sm text-gray-600 ml-1">g</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                평균 {Math.round(weeklyTotal.protein / selectedDays)}g/일
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 영양소 추이 그래프 */}
      {selectedDays >= 3 && (
        <div className="px-5 pb-4">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-5 border border-purple-100">
            <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>
              일별 영양소 추이
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={nutritionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="칼로리" 
                  stroke="#CDFF00" 
                  strokeWidth={3}
                  dot={{ fill: '#CDFF00', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="단백질" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2 text-center">
              * 칼로리는 10분의 1로 표시됩니다
            </p>
          </div>
        </div>
      )}

      {/* 영양소 균형 그래프 */}
      <div className="px-5 pb-4">
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-5 border border-orange-100">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>
            영양소 균형
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={nutritionChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Bar dataKey="단백질" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="탄수화물" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="지방" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 식단표 */}
      <div className="px-5">
        <h2 className="text-lg mb-3" style={{ fontWeight: 600 }}>
          식단표
        </h2>
        <div className="space-y-3">
          {mealPlan.map((day, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <h3 className="text-base" style={{ fontWeight: 600 }}>
                    {day.day}요일
                  </h3>
                </div>
                <div className="text-xs text-gray-600">
                  {day.totalCalories}kcal
                </div>
              </div>

              <div className="space-y-2">
                <MealRow label="아침" meal={day.breakfast} />
                <MealRow label="점심" meal={day.lunch} />
                <MealRow label="저녁" meal={day.dinner} />
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>단백질 {Math.round(day.totalProtein)}g</span>
                  <Link
                    to="/recipes"
                    className="flex items-center gap-1 text-black"
                    style={{ fontWeight: 600 }}
                  >
                    <span>레시피 보기</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 안내 메시지 */}
      {ingredients.length === 0 && (
        <div className="mx-5 mt-4 bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <p className="text-sm" style={{ fontWeight: 600 }}>
            더 정확한 식단 추천을 위해
          </p>
          <p className="text-xs text-gray-600 mt-1">
            보유 식재료를 등록하면 맞춤 식단을 추천해드려요
          </p>
        </div>
      )}
    </div>
  );
}

function MealRow({ label, meal }: { label: string; meal: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600 w-12">{label}</span>
      <span className="text-sm flex-1" style={{ fontWeight: 500 }}>
        {meal}
      </span>
    </div>
  );
}