import { useIngredients } from '../hooks/useIngredients';
import { calculateDDay, formatDDay, getExpiryStatus, getStatusColor } from '../utils/date';
import { AlertCircle, Package, Trash2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from 'recharts';

export default function Priority() {
  const { ingredients, deleteIngredient } = useIngredients();

  // 유통기한 순으로 정렬 (임박한 순)
  const sortedByPriority = [...ingredients].sort((a, b) => {
    const daysA = calculateDDay(a.expiryDate);
    const daysB = calculateDDay(b.expiryDate);
    return daysA - daysB;
  });

  // 위험도별 분류
  const dangerItems = sortedByPriority.filter(
    (item) => getExpiryStatus(calculateDDay(item.expiryDate)) === 'danger'
  );
  const warningItems = sortedByPriority.filter(
    (item) => getExpiryStatus(calculateDDay(item.expiryDate)) === 'warning'
  );
  const safeItems = sortedByPriority.filter(
    (item) => getExpiryStatus(calculateDDay(item.expiryDate)) === 'safe'
  );

  const handleDelete = (id: string, name: string) => {
    if (confirm(`${name}을(를) 삭제하시겠습니까?`)) {
      deleteIngredient(id);
    }
  };

  // 그래프 데이터
  const categoryData = [
    { name: '위험', value: dangerItems.length, color: '#FF3B30' },
    { name: '주의', value: warningItems.length, color: '#FFD60A' },
    { name: '안전', value: safeItems.length, color: '#34C759' },
  ];

  return (
    <div className="min-h-screen bg-white pb-4">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl" style={{ fontWeight: 700 }}>
          소비 우선순위
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          유통기한 기준으로 우선 소비해야 할 식재료
        </p>
      </div>

      {/* 상태 그래프 */}
      {ingredients.length > 0 && (
        <div className="px-5 pb-4">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm" style={{ fontWeight: 600 }}>
                식재료 위험도 분석
              </h3>
            </div>
            <div className="flex items-center gap-4">
              {/* 막대 그래프 */}
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={categoryData}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`bar-cell-${entry.name}-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 통계 요약 */}
              <div className="flex-shrink-0 space-y-2">
                <div className="bg-red-50 rounded-lg p-2 text-center min-w-[70px]">
                  <p className="text-xs text-gray-600">위험</p>
                  <p className="text-xl" style={{ fontWeight: 700 }}>
                    {dangerItems.length}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2 text-center min-w-[70px]">
                  <p className="text-xs text-gray-600">주의</p>
                  <p className="text-xl" style={{ fontWeight: 700 }}>
                    {warningItems.length}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 text-center min-w-[70px]">
                  <p className="text-xs text-gray-600">안전</p>
                  <p className="text-xl" style={{ fontWeight: 700 }}>
                    {safeItems.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 우선순위 요약 */}
      <div className="px-5 pb-6">
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm" style={{ fontWeight: 600 }}>
                {dangerItems.length > 0
                  ? `긴급: ${dangerItems.length}개 식재료 확인 필요`
                  : warningItems.length > 0
                  ? `주의: ${warningItems.length}개 식재료 곧 소비 필요`
                  : '안전: 모든 식재료가 양호합니다'}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                위험도가 높은 식재료부터 우선 소비하세요
              </p>
            </div>
          </div>
        </div>
      </div>

      {ingredients.length === 0 ? (
        <div className="text-center py-12 px-5">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 mb-1">등록된 식재료가 없습니다</p>
          <p className="text-xs text-gray-400">식재료를 추가하고 관리를 시작하세요</p>
        </div>
      ) : (
        <div className="px-5 space-y-6">
          {/* 위험 (만료됨) */}
          {dangerItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: '#FF3B30' }}
                />
                <h2 className="text-lg" style={{ fontWeight: 600 }}>
                  위험 ({dangerItems.length})
                </h2>
              </div>
              <div className="space-y-2">
                {dangerItems.map((ingredient) => {
                  const daysLeft = calculateDDay(ingredient.expiryDate);
                  return (
                    <PriorityCard
                      key={ingredient.id}
                      ingredient={ingredient}
                      daysLeft={daysLeft}
                      onDelete={handleDelete}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* 주의 (임박) */}
          {warningItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: '#FFD60A' }}
                />
                <h2 className="text-lg" style={{ fontWeight: 600 }}>
                  주의 ({warningItems.length})
                </h2>
              </div>
              <div className="space-y-2">
                {warningItems.map((ingredient) => {
                  const daysLeft = calculateDDay(ingredient.expiryDate);
                  return (
                    <PriorityCard
                      key={ingredient.id}
                      ingredient={ingredient}
                      daysLeft={daysLeft}
                      onDelete={handleDelete}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* 안전 */}
          {safeItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: '#34C759' }}
                />
                <h2 className="text-lg" style={{ fontWeight: 600 }}>
                  안전 ({safeItems.length})
                </h2>
              </div>
              <div className="space-y-2">
                {safeItems.slice(0, 5).map((ingredient) => {
                  const daysLeft = calculateDDay(ingredient.expiryDate);
                  return (
                    <PriorityCard
                      key={ingredient.id}
                      ingredient={ingredient}
                      daysLeft={daysLeft}
                      onDelete={handleDelete}
                    />
                  );
                })}
              </div>
              {safeItems.length > 5 && (
                <p className="text-sm text-gray-500 text-center mt-3">
                  외 {safeItems.length - 5}개 더 있음
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PriorityCard({
  ingredient,
  daysLeft,
  onDelete,
}: {
  ingredient: any;
  daysLeft: number;
  onDelete: (id: string, name: string) => void;
}) {
  const status = getExpiryStatus(daysLeft);
  const statusColor = getStatusColor(status);

  return (
    <div className="bg-gray-50 rounded-xl p-4 relative">
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
              유통기한: {ingredient.expiryDate.toLocaleDateString('ko-KR')}
            </p>
            {daysLeft <= 0 && (
              <p className="text-xs text-red-600" style={{ fontWeight: 600 }}>
                {Math.abs(daysLeft)}일 전에 만료되었습니다
              </p>
            )}
            {daysLeft > 0 && daysLeft <= 3 && (
              <p className="text-xs text-yellow-700" style={{ fontWeight: 600 }}>
                {daysLeft}일 후 만료됩니다
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(ingredient.id, ingredient.name)}
          className="ml-3 p-2 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      </div>
    </div>
  );
}