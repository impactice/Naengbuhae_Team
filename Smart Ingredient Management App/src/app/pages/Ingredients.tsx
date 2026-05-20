import { useEffect, useRef, useState } from 'react';
import { useIngredients } from '../hooks/useIngredients';
import { calculateDDay, formatDDay, getExpiryStatus, getStatusColor } from '../utils/date';
import { Link, useSearchParams } from 'react-router';
import { Plus, Trash2, Package, Sparkles, AlertTriangle, Search, X, Check, CheckSquare } from 'lucide-react';

import { CategoryType, StorageType } from '../types/ingredient';
import FridgeSelector from '../components/FridgeSelector';

export default function Ingredients() {
  const { ingredients, deleteIngredient, bulkDeleteIngredients } = useIngredients();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [selectedStorage, setSelectedStorage] = useState<StorageType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'expiry' | 'name' | 'category'>('expiry');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);
  // 다중 선택 모드 — 선택 버튼 누르면 카드가 체크박스로 변하고 하단에 일괄 삭제 바 표시.
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  // 상세 모달용
  const [detailIngredient, setDetailIngredient] = useState<typeof ingredients[0] | null>(null);

  // 알림 센터에서 ?highlight=:id로 진입 시 해당 카드 스크롤 + 잠깐 강조.
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const [highlightActive, setHighlightActive] = useState(false);

  useEffect(() => {
    if (!highlightId) return;
    // 카드가 렌더된 후 스크롤 + 2.5초 동안 강조 → fade-out
    const t1 = setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightActive(true);
    }, 100);
    const t2 = setTimeout(() => setHighlightActive(false), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [highlightId, ingredients.length]);

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
  const trimmedQuery = searchQuery.trim().toLowerCase();
  if (trimmedQuery !== '') {
    filtered = filtered.filter((item) => item.name.toLowerCase().includes(trimmedQuery));
  }
  if (showExpiredOnly) {
    // D-day < 0 = 이미 만료 (오늘 만료는 통상 "만료된 것"에서 제외)
    filtered = filtered.filter((item) => calculateDDay(item.expirationDate) < 0);
  }

  // 정렬
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'expiry') {
      return calculateDDay(a.expirationDate) - calculateDDay(b.expirationDate);
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

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const enterSelectionMode = () => {
    setSelectionMode(true);
    setSelectedIds(new Set());
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const selectAll = () => {
    setSelectedIds(new Set(sorted.map((i) => i.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size}개의 식재료를 삭제하시겠습니까?`)) return;
    setDeleting(true);
    try {
      await bulkDeleteIngredients(Array.from(selectedIds));
      exitSelectionMode();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-4">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl" style={{ fontWeight: 700 }}>
            식재료 관리
          </h1>
          {selectionMode ? (
            <button
              type="button"
              onClick={exitSelectionMode}
              className="text-sm text-muted-foreground hover:text-foreground"
              style={{ fontWeight: 600 }}
            >
              취소
            </button>
          ) : (
            <FridgeSelector />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {selectionMode ? `${selectedIds.size}개 선택됨` : `총 ${ingredients.length}개`}
        </p>
      </div>

      {/* 추가 버튼 + 선택 모드 진입 */}
      {!selectionMode && (
        <div className="px-5 pb-4">
          <div className="flex gap-2">
            <Link to="/add-ingredient" className="flex-1">
              <button
                className="w-full rounded-xl py-4 flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 600 }}
              >
                <Plus className="w-5 h-5" />
                식재료 추가하기
              </button>
            </Link>
            <Link to="/nutrition">
              <button
                className="rounded-xl py-4 px-4 flex items-center justify-center bg-card border border-border hover:shadow-md transition-all"
                title="영양 분석"
              >
                <Sparkles className="w-5 h-5 text-green-600" />
              </button>
            </Link>
            <button
              type="button"
              onClick={enterSelectionMode}
              disabled={ingredients.length === 0}
              className="rounded-xl py-4 px-4 flex items-center justify-center bg-secondary border-2 border-border hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="선택"
            >
              <CheckSquare className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* 선택 모드 액션 바 */}
      {selectionMode && (
        <div className="px-5 pb-4 flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="flex-1 py-3 rounded-xl bg-secondary text-sm"
            style={{ fontWeight: 600 }}
          >
            전체 선택 ({sorted.length})
          </button>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0 || deleting}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm disabled:bg-red-200"
            style={{ fontWeight: 600 }}
          >
            {deleting ? '삭제 중...' : `${selectedIds.size}개 삭제`}
          </button>
        </div>
      )}

      {/* 이름 검색 */}
      <div className="px-5 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이름으로 검색"
            className="w-full pl-9 pr-9 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-muted-foreground"
              aria-label="검색어 지우기"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 필터 — 카테고리/보관/정렬 모두 드롭다운으로 통일 (모바일 친화적) */}
      <div className="px-5 pb-3">
        <div className="flex gap-2">
          {/* 카테고리 선택 — 기존 가로 스크롤 방식에서 드롭다운으로 변경 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as CategoryType | 'all')}
            className="px-3 py-2 bg-secondary rounded-lg text-sm flex-1"
            style={{ fontWeight: 500 }}
          >
            <option value="all">전체 카테고리</option>
            <option value="vegetable">🥦 채소</option>
            <option value="meat">🥩 육류</option>
            <option value="seafood">🐟 해산물</option>
            <option value="dairy">🥛 유제품</option>
            <option value="grain">🌾 곡물</option>
            <option value="fruit">🍎 과일</option>
            <option value="processed">🥫 가공식품</option>
            <option value="beverage">🧃 음료</option>
            <option value="condiment">🧂 조미료</option>
            <option value="snack">🍿 간식</option>
            <option value="etc">📦 기타</option>
          </select>

          {/* 보관 방법 */}
          <select
            value={selectedStorage}
            onChange={(e) => setSelectedStorage(e.target.value as StorageType | 'all')}
            className="px-3 py-2 bg-secondary rounded-lg text-sm flex-1"
            style={{ fontWeight: 500 }}
          >
            <option value="all">전체 보관</option>
            <option value="refrigerated">❄️ 냉장</option>
            <option value="frozen">🧊 냉동</option>
            <option value="room">🌡️ 실온</option>
          </select>

          {/* 정렬 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'expiry' | 'name' | 'category')}
            className="px-3 py-2 bg-secondary rounded-lg text-sm flex-1"
            style={{ fontWeight: 500 }}
          >
            <option value="expiry">유통기한 순</option>
            <option value="name">이름 순</option>
            <option value="category">카테고리 순</option>
          </select>
        </div>
      </div>

      {/* 만료된 것만 보기 */}
      <div className="px-5 pb-4">
        <button
          type="button"
          onClick={() => setShowExpiredOnly((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            showExpiredOnly
              ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-300'
              : 'bg-secondary border-transparent text-muted-foreground hover:opacity-80'
          }`}
          style={{ fontWeight: showExpiredOnly ? 600 : 500 }}
        >
          <span
            className={`w-4 h-4 inline-flex items-center justify-center rounded-sm border ${
              showExpiredOnly ? 'border-red-500 bg-red-500 text-white' : 'border-gray-400'
            }`}
          >
            {showExpiredOnly && <span className="text-[10px] leading-none">✓</span>}
          </span>
          만료된 것만 보기
        </button>
      </div>

      {/* 식재료 목록 */}
      <div className="px-5">
        {sorted.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {selectedCategory !== 'all' || selectedStorage !== 'all' || trimmedQuery !== '' || showExpiredOnly
                ? '조건에 맞는 식재료가 없습니다'
                : '등록된 식재료가 없습니다'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((ingredient) => {
              const daysLeft = calculateDDay(ingredient.expirationDate);
              const status = getExpiryStatus(daysLeft);
              const statusColor = getStatusColor(status);
              const nutrition = nutritionDatabase[ingredient.name] || nutritionDatabase['default'];

              const isSelected = selectedIds.has(ingredient.id);
              const isHighlighted = highlightActive && highlightId === ingredient.id;
              return (
                <div
                  key={ingredient.id}
                  ref={highlightId === ingredient.id ? highlightRef : undefined}
                  onClick={selectionMode
                    ? () => toggleSelection(ingredient.id)
                    : () => setDetailIngredient(ingredient)}
                  className={`rounded-xl p-3 cursor-pointer transition-colors flex items-center gap-2.5 ${
                    selectionMode
                      ? isSelected
                        ? 'bg-green-50 dark:bg-green-900/30 border-2 border-accent'
                        : 'bg-card border border-border border-2 border-transparent'
                      : isHighlighted
                      ? 'bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-700 ring-2 ring-yellow-200 dark:ring-yellow-800/50'
                      : 'bg-card border border-border hover:bg-secondary'
                  }`}
                >
                  {/* 왼쪽: D-day 뱃지 (세로 가운데) */}
                  <span
                    className="flex-shrink-0 px-1.5 py-0.5 rounded text-xs"
                    style={{ backgroundColor: `${statusColor}20`, color: statusColor, fontWeight: 600 }}
                  >
                    {formatDDay(daysLeft)}
                  </span>

                  {/* 중간: 이름 + 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm line-clamp-1 leading-tight flex-1 min-w-0" style={{ fontWeight: 700 }} title={ingredient.name}>
                        {ingredient.name}
                      </h3>
                      {ingredient.allergyWarnings && ingredient.allergyWarnings.length > 0 && (
                        <span
                          className="flex-shrink-0 inline-flex items-center px-1 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                          title={`알레르기: ${ingredient.allergyWarnings.join(', ')}`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {ingredient.expirationDate.toLocaleDateString('ko-KR')} · {Math.round(nutrition.calories)}kcal/100g · 단{Math.round(nutrition.protein)}g · 탄{Math.round(nutrition.carbs)}g
                    </p>
                  </div>

                  {/* 오른쪽: 삭제 / 체크박스 (세로 가운데, flex items-center로 자동 정렬) */}
                  {selectionMode ? (
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center border-2 ${
                        isSelected ? 'bg-accent border-accent' : 'bg-white border-gray-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(ingredient.id, ingredient.name);
                      }}
                      className="flex-shrink-0 p-1.5 hover:bg-secondary rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {detailIngredient && (() => {
        const ing = detailIngredient;
        const daysLeft = calculateDDay(ing.expirationDate);
        const status = getExpiryStatus(daysLeft);
        const statusColor = getStatusColor(status);
        const nutrition = nutritionDatabase[ing.name] || nutritionDatabase['default'];
        return (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            onClick={() => setDetailIngredient(null)}
          >
            <div
              className="w-full max-w-md bg-background text-foreground rounded-t-3xl"
              style={{ maxHeight: '80vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 핸들 바 */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-secondary rounded-full" />
              </div>

              {/* 헤더 */}
              <div className="flex items-center justify-between px-5 py-3">
                <h2 className="text-lg" style={{ fontWeight: 700 }}>{ing.name}</h2>
                <button
                  onClick={() => setDetailIngredient(null)}
                  className="p-1.5 hover:bg-secondary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* 본문 */}
              <div className="px-5 pb-8 space-y-3">
                {/* 상태 태그 */}
                <div className="flex items-center gap-2 flex-wrap">
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
                  {ing.allergyWarnings && ing.allergyWarnings.length > 0 && (
                    <span
                      className="px-2 py-0.5 rounded text-xs flex items-center gap-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                      style={{ fontWeight: 600 }}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      알레르기 {ing.allergyWarnings.join(', ')}
                    </span>
                  )}
                </div>

                {/* 정보 로우 */}
                <div className="bg-secondary rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">수량</span>
                    <span style={{ fontWeight: 600 }}>{ing.quantity}{ing.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">분류</span>
                    <span style={{ fontWeight: 600 }}>{getCategoryLabel(ing.category)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">보관 방법</span>
                    <span style={{ fontWeight: 600 }}>{getStorageLabel(ing.storage)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">유통기한</span>
                    <span style={{ fontWeight: 600 }}>{ing.expirationDate.toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>

                {/* 영양 정보 (100g 기준) */}
                <div className="bg-secondary rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-3" style={{ fontWeight: 600 }}>영양 정보 (100g 기준)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background rounded-lg p-3 text-center">
                      <p className="text-lg" style={{ fontWeight: 700 }}>{Math.round(nutrition.calories)}</p>
                      <p className="text-xs text-muted-foreground">kcal</p>
                    </div>
                    <div className="bg-background rounded-lg p-3 text-center">
                      <p className="text-lg" style={{ fontWeight: 700 }}>{Math.round(nutrition.protein)}g</p>
                      <p className="text-xs text-muted-foreground">단백질</p>
                    </div>
                    <div className="bg-background rounded-lg p-3 text-center">
                      <p className="text-lg" style={{ fontWeight: 700 }}>{Math.round(nutrition.carbs)}g</p>
                      <p className="text-xs text-muted-foreground">탄수화물</p>
                    </div>
                    <div className="bg-background rounded-lg p-3 text-center">
                      <p className="text-lg" style={{ fontWeight: 700 }}>{Math.round(nutrition.fat)}g</p>
                      <p className="text-xs text-muted-foreground">지방</p>
                    </div>
                  </div>
                </div>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => {
                    handleDelete(ing.id, ing.name);
                    setDetailIngredient(null);
                  }}
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm"
                  style={{ fontWeight: 600 }}
                >
                  <Trash2 className="w-4 h-4" />
                  식재료 삭제
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
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
    processed: '가공식품',
    beverage: '음료',
    condiment: '조미료',
    snack: '간식',
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
