import { useIngredients } from '../hooks/useIngredients';
import { calculateDDay, formatDDay, getExpiryStatus, getStatusColor } from '../utils/date';
import { Link } from 'react-router';
import { Plus, AlertCircle, Package, ChefHat, Calendar, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell } from 'recharts';

export default function Home() {
  const { ingredients } = useIngredients();

  // 유통기한 임박 순으로 정렬
  const sortedByExpiry = [...ingredients].sort((a, b) => {
    const daysA = calculateDDay(a.expirationDate);
    const daysB = calculateDDay(b.expirationDate);
    return daysA - daysB;
  });

  // 위험 상태별로 분류
  const dangerItems = sortedByExpiry.filter(
    (item) => getExpiryStatus(calculateDDay(item.expirationDate)) === 'danger'
  );
  const warningItems = sortedByExpiry.filter(
    (item) => getExpiryStatus(calculateDDay(item.expirationDate)) === 'warning'
  );
  const safeItems = sortedByExpiry.filter(
    (item) => getExpiryStatus(calculateDDay(item.expirationDate)) === 'safe'
  );

  const totalItems = ingredients.length;

  // 그래프 데이터
  const chartData = [
    { name: '위험', value: dangerItems.length, color: '#FF3B30' },
    { name: '주의', value: warningItems.length, color: '#FFD60A' },
    { name: '안전', value: safeItems.length, color: '#34C759' },
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl" style={{ fontWeight: 700 }}>
          냉장고
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          총 {totalItems}개 식재료 보관 중
        </p>
      </div>

      {/* 식재료 상태 대시보드 */}
      {totalItems > 0 && (
        <div className="px-5 pb-4">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg mb-1" style={{ fontWeight: 600 }}>
                  식재료 상태
                </h2>
                <p className="text-xs text-gray-600">현재 냉장고 상태를 확인하세요</p>
              </div>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            
            <div className="flex items-center gap-4">
              {/* 도넛 차트 */}
              <div className="flex-shrink-0">
                <PieChart width={120} height={120}>
                  <Pie
                    data={chartData}
                    cx={60}
                    cy={60}
                    innerRadius={35}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </div>

              {/* 통계 */}
              <div className="flex-1 space-y-2">
                {dangerItems.length > 0 && (
                  <div className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm" style={{ fontWeight: 600 }}>위험</span>
                    </div>
                    <span className="text-sm" style={{ fontWeight: 700 }}>{dangerItems.length}개</span>
                  </div>
                )}
                {warningItems.length > 0 && (
                  <div className="flex items-center justify-between py-2 px-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm" style={{ fontWeight: 600 }}>주의</span>
                    </div>
                    <span className="text-sm" style={{ fontWeight: 700 }}>{warningItems.length}개</span>
                  </div>
                )}
                {safeItems.length > 0 && (
                  <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm" style={{ fontWeight: 600 }}>안전</span>
                    </div>
                    <span className="text-sm" style={{ fontWeight: 700 }}>{safeItems.length}개</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 빠른 추가 버튼 */}
      <div className="px-5 pb-4">
        <Link to="/add-ingredient">
          <button
            className="w-full rounded-xl py-4 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#CDFF00', fontWeight: 600 }}
          >
            <Plus className="w-5 h-5" />
            식재료 추가하기
          </button>
        </Link>
      </div>

      {/* 기능 바로가기 */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/recipes">
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200 relative overflow-hidden">
              <ChefHat className="w-6 h-6 text-orange-600 mb-2" />
              <h3 className="text-sm" style={{ fontWeight: 600 }}>
                레시피 추천
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                보유 재료로 요리하기
              </p>
            </div>
          </Link>
          <Link to="/meal-plan">
            <div className="bg-gradient-to-br from-green-50 to-lime-50 rounded-xl p-4 border border-green-200 relative overflow-hidden">
              <Calendar className="w-6 h-6 text-green-600 mb-2" />
              <h3 className="text-sm" style={{ fontWeight: 600 }}>
                식단 추천
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                균형잡힌 식단 구성
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* 유통기한 임박 알림 */}
      {(dangerItems.length > 0 || warningItems.length > 0) && (
        <div className="px-5 pb-4">
          <div className="bg-red-50 rounded-xl p-4 border border-red-100 relative overflow-hidden">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm" style={{ fontWeight: 600 }}>
                  {dangerItems.length > 0
                    ? `유통기한이 지난 식재료가 ${dangerItems.length}개 있어요`
                    : `유통기한이 임박한 식재료가 ${warningItems.length}개 있어요`}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  빨리 소비하거나 정리해 주세요
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 식재료 목록 */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg" style={{ fontWeight: 600 }}>
            식재료 목록
          </h2>
          <Link
            to="/ingredients"
            className="text-sm text-gray-500"
            style={{ fontWeight: 500 }}
          >
            전체보기
          </Link>
        </div>

        {ingredients.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 mb-1">등록된 식재료가 없습니다</p>
            <p className="text-xs text-gray-400">첫 식재료를 추가해보세요!</p>
            <Link to="/add-ingredient">
              <button
                className="mt-4 px-6 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: '#CDFF00',
                  fontWeight: 600,
                }}
              >
                첫 식재료 추가하기
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedByExpiry.slice(0, 10).map((ingredient) => {
              const daysLeft = calculateDDay(ingredient.expirationDate);
              const status = getExpiryStatus(daysLeft);
              const statusColor = getStatusColor(status);

              return (
                <div
                  key={ingredient.id}
                  className="bg-gray-50 rounded-xl p-4 flex items-center justify-between"
                >
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
                    <p className="text-sm text-gray-500 mt-1">
                      {ingredient.quantity}
                      {ingredient.unit} · {getCategoryLabel(ingredient.category)} ·{' '}
                      {getStorageLabel(ingredient.storage)}
                    </p>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: statusColor }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
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