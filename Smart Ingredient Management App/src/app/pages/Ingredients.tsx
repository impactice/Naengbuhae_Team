import { useState } from 'react';
import { useIngredients } from '../hooks/useIngredients';
import { calculateDDay, formatDDay, getExpiryStatus, getStatusColor } from '../utils/date';
import { Link } from 'react-router';
import { Plus, Trash2, Package, ChevronDown, Sparkles } from 'lucide-react';
import { CategoryType, StorageType } from '../types/ingredient';

export default function Ingredients() {
  const { ingredients, deleteIngredient } = useIngredients();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [selectedStorage, setSelectedStorage] = useState<StorageType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'expiry' | 'name' | 'category'>('expiry');

  // 영양 정보 데이터베이스 (100g 기준)
  const nutritionDatabase: Record<string, {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }> = {
    '당근': { calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2 },
    '양파': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
    '토마토': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
    '배추': { calories: 13, protein: 1.2, carbs: 2.2, fat: 0.2 },
    '브로콜리': { calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4 },
    '시금치': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
    '돼지고기': { calories: 242, protein: 27.3, carbs: 0, fat: 14.0 },
    '소고기': { calories: 250, protein: 26.1, carbs: 0, fat: 15.4 },
    '닭고기': { calories: 165, protein: 31.0, carbs: 0, fat: 3.6 },
    '닭가슴살': { calories: 165, protein: 31.0, carbs: 0, fat: 3.6 },
    '고등어': { calories: 205, protein: 18.6, carbs: 0, fat: 13.9 },
    '연어': { calories: 208, protein: 20.4, carbs: 0, fat: 13.4 },
    '새우': { calories: 99, protein: 20.9, carbs: 0.9, fat: 1.7 },
    '우유': { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
    '요구르트': { calories: 59, protein: 3.5, carbs: 4.7, fat: 3.3 },
    '치즈': { calories: 402, protein: 25.0, carbs: 1.3, fat: 33.1 },
    '사과': { calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2 },
    '바나나': { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
    '딸기': { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
    '쌀': { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
    '현미': { calories: 111, protein: 2.6, carbs: 23.5, fat: 0.9 },
    '귀리': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
    '식빵': { calories: 265, protein: 8.7, carbs: 49.4, fat: 3.2 },
    'default': { calories: 150, protein: 5, carbs: 20, fat: 3 }
  };

  // 필터링
  let filtered = ingredients;
  if (selectedCategory !== 'all') {
    filtered = filtered.filter((item) => item.category === selectedCategory);
  }
  if (selectedStorage !== 'all') {
    filtered = filtered.filter((item) => item.storage === selectedStorage);
  }

  // 정렬
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'expiry') {
      return calculateDDay(a.expiryDate) - calculateDDay(b.expiryDate);
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return a.category.localeCompare(b.category);
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`${name}을(를) 삭제하시겠습니까?`)) {
      deleteIngredient(id);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-4">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl" style={{ fontWeight: 700 }}>
          식재료 관리
        </h1>
        <p className="text-sm text-gray-500 mt-1">총 {ingredients.length}개</p>
      </div>

      {/* 추가 버튼 */}
      <div className="px-5 pb-4">
        <div className="flex gap-2">
          <Link to="/add-ingredient" className="flex-1">
            <button
              className="w-full rounded-xl py-4 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#CDFF00', fontWeight: 600 }}
            >
              <Plus className="w-5 h-5" />
              식재료 추가하기
            </button>
          </Link>
          <Link to="/nutrition">
            <button
              className="rounded-xl py-4 px-4 flex items-center justify-center bg-gradient-to-br from-green-50 to-white border-2 border-green-200 hover:shadow-md transition-all"
              title="영양 분석"
            >
              <Sparkles className="w-5 h-5 text-green-600" />
            </button>
          </Link>
        </div>
      </div>

      {/* 필터 */}
      <div className="px-5 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <FilterButton
            active={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
          >
            전체
          </FilterButton>
          <FilterButton
            active={selectedCategory === 'vegetable'}
            onClick={() => setSelectedCategory('vegetable')}
          >
            채소
          </FilterButton>
          <FilterButton
            active={selectedCategory === 'meat'}
            onClick={() => setSelectedCategory('meat')}
          >
            육류
          </FilterButton>
          <FilterButton
            active={selectedCategory === 'dairy'}
            onClick={() => setSelectedCategory('dairy')}
          >
            유제품
          </FilterButton>
          <FilterButton
            active={selectedCategory === 'seafood'}
            onClick={() => setSelectedCategory('seafood')}
          >
            해산물
          </FilterButton>
          <FilterButton
            active={selectedCategory === 'fruit'}
            onClick={() => setSelectedCategory('fruit')}
          >
            과일
          </FilterButton>
          <FilterButton
            active={selectedCategory === 'grain'}
            onClick={() => setSelectedCategory('grain')}
          >
            곡물
          </FilterButton>
          <FilterButton
            active={selectedCategory === 'etc'}
            onClick={() => setSelectedCategory('etc')}
          >
            기타
          </FilterButton>
        </div>

        <div className="flex gap-2 mt-2">
          <select
            value={selectedStorage}
            onChange={(e) => setSelectedStorage(e.target.value as StorageType | 'all')}
            className="px-3 py-2 bg-gray-100 rounded-lg text-sm flex-1"
            style={{ fontWeight: 500 }}
          >
            <option value="all">전체 보관</option>
            <option value="refrigerated">냉장</option>
            <option value="frozen">냉동</option>
            <option value="room">실온</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'expiry' | 'name' | 'category')}
            className="px-3 py-2 bg-gray-100 rounded-lg text-sm flex-1"
            style={{ fontWeight: 500 }}
          >
            <option value="expiry">유통기한 순</option>
            <option value="name">이름 순</option>
            <option value="category">카테고리 순</option>
          </select>
        </div>
      </div>

      {/* 식재료 목록 */}
      <div className="px-5">
        {sorted.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">
              {selectedCategory !== 'all' || selectedStorage !== 'all'
                ? '조건에 맞는 식재료가 없습니다'
                : '등록된 식재료가 없습니다'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((ingredient) => {
              const daysLeft = calculateDDay(ingredient.expiryDate);
              const status = getExpiryStatus(daysLeft);
              const statusColor = getStatusColor(status);

              // 영양 정보 계산
              const nutrition = nutritionDatabase[ingredient.name] || nutritionDatabase['default'];
              const factor = ingredient.quantity / 100;

              return (
                <div
                  key={ingredient.id}
                  className="bg-gray-50 rounded-xl p-4 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base" style={{ fontWeight: 600 }}>
                          {ingredient.name}
                        </h3>
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: `${statusColor}20`,
                            color: statusColor,
                            fontWeight: 600,
                          }}
                        >
                          {formatDDay(daysLeft)}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          수량: {ingredient.quantity}
                          {ingredient.unit}
                        </p>
                        <p className="text-sm text-gray-600">
                          분류: {getCategoryLabel(ingredient.category)} ·{' '}
                          {getStorageLabel(ingredient.storage)}
                        </p>
                        <p className="text-sm text-gray-600">
                          유통기한:{' '}
                          {ingredient.expiryDate.toLocaleDateString('ko-KR')}
                        </p>
                        {/* 영양 정보 추가 */}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                          <span className="text-xs px-2 py-1 bg-white rounded-md font-medium">
                            {Math.round(nutrition.calories * factor)}kcal
                          </span>
                          <span className="text-xs px-2 py-1 bg-white rounded-md">
                            단백질 {Math.round(nutrition.protein * factor)}g
                          </span>
                          <span className="text-xs px-2 py-1 bg-white rounded-md">
                            탄수화물 {Math.round(nutrition.carbs * factor)}g
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(ingredient.id, ingredient.name)}
                      className="ml-3 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
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
      className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
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

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    vegetable: '채소',
    meat: '육류',
    dairy: '유제품',
    grain: '곡물',
    seafood: '해산물',
    fruit: '과일',
    etc: '기타',
  };
  return labels[category] || category;
}

function getStorageLabel(storage: string): string {
  const labels: Record<string, string> = {
    refrigerated: '냉장',
    frozen: '냉동',
    room: '실온',
  };
  return labels[storage] || storage;
}
