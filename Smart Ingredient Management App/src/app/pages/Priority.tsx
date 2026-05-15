import { Link } from 'react-router';
import { useIngredients } from '../hooks/useIngredients';
import { calculateDDay, formatDDay, getExpiryStatus, getStatusColor } from '../utils/date';
import { AlertCircle, Package, Trash2, TrendingUp, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import FridgeSelector from '../components/FridgeSelector';

export default function Priority() {
  const { ingredients, deleteIngredient } = useIngredients();

  // 유통기한 순으로 정렬 (임박한 순)
  const sortedByPriority = [...ingredients].sort((a, b) => {
    const daysA = calculateDDay(a.expirationDate);
    const daysB = calculateDDay(b.expirationDate);
    return daysA - daysB;
  });

  // 위험도별 분류
  const dangerItems = sortedByPriority.filter(
    (item) => getExpiryStatus(calculateDDay(item.expirationDate)) === 'danger'
  );
  const warningItems = sortedByPriority.filter(
    (item) => getExpiryStatus(calculateDDay(item.expirationDate)) === 'warning'
  );
  const safeItems = sortedByPriority.filter(
    (item) => getExpiryStatus(calculateDDay(item.expirationDate)) === 'safe'
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
    <div className="min-h-screen bg-background pb-4">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl" style={{ fontWeight: 700 }}>
            소비 우선순위
          </h1>
          <FridgeSelector />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          유통기한 기준으로 우선 소비해야 할 식재료
        </p>
      </div>

      {/* 상태 그래프 — 도넛으로 비율, 옆 stat box로 개수 */}
      {ingredients.length > 0 && (
        <div className="px-5 pb-4">
          <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute -top-14 -right-14 w-44 h-44 rounded-full blur-3xl opacity-[0.07] pointer-events-none" style={{ background: 'var(--accent)' }} />
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h3 className="text-sm" style={{ fontWeight: 600 }}>
                식재료 위험도 분석
              </h3>
            </div>
            <div className="flex items-center gap-4">
              {/* 도넛 차트 + 가운데 총 개수 */}
              <div className="flex-1 relative">
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={categoryData.filter((d) => d.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={62}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {categoryData.filter((d) => d.value > 0).map((entry) => (
                        <Cell key={`pie-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl" style={{ fontWeight: 700 }}>
                    {ingredients.length}
                  </p>
                  <p className="text-xs text-muted-foreground">개</p>
                </div>
              </div>

              {/* 통계 요약 — 개수 + % */}
              <div className="flex-shrink-0 space-y-2">
                {categoryData.map((c) => {
                  const pct = ingredients.length === 0 ? 0 : Math.round((c.value / ingredients.length) * 100);
                  const bgVar =
                    c.name === '위험' ? 'var(--status-danger-bg)'
                    : c.name === '주의' ? 'var(--status-warning-bg)'
                    : 'var(--status-safe-bg)';
                  return (
                    <div key={c.name} className="rounded-lg p-2 text-center min-w-[80px]" style={{ backgroundColor: bgVar }}>
                      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </div>
                      <p className="text-lg leading-tight" style={{ fontWeight: 700 }}>
                        {c.value} <span className="text-xs text-muted-foreground" style={{ fontWeight: 500 }}>· {pct}%</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 우선순위 요약 */}
      <div className="px-5 pb-6">
        <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: dangerItems.length > 0 ? 'var(--status-danger)' : warningItems.length > 0 ? 'var(--status-warning)' : 'var(--status-safe)' }} />
          <div className="flex items-start gap-3 pl-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: dangerItems.length > 0 ? 'var(--status-danger)' : warningItems.length > 0 ? 'var(--status-warning)' : 'var(--status-safe)' }} />
            <div className="flex-1">
              <h3 className="text-sm" style={{ fontWeight: 600 }}>
                {dangerItems.length > 0
                  ? `긴급: ${dangerItems.length}개 식재료 확인 필요`
                  : warningItems.length > 0
                  ? `주의: ${warningItems.length}개 식재료 곧 소비 필요`
                  : '안전: 모든 식재료가 양호합니다'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                위험도가 높은 식재료부터 우선 소비하세요
              </p>
            </div>
          </div>
        </div>
      </div>

      {ingredients.length === 0 ? (
        <div className="text-center py-12 px-5">
          <Package className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-3" />
          <p className="text-muted-foreground mb-1">등록된 식재료가 없습니다</p>
          <p className="text-xs text-muted-foreground">식재료를 추가하고 관리를 시작하세요</p>
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
                  const daysLeft = calculateDDay(ingredient.expirationDate);
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
                  const daysLeft = calculateDDay(ingredient.expirationDate);
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
                  const daysLeft = calculateDDay(ingredient.expirationDate);
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
                <Link
                  to="/ingredients"
                  className="mt-3 flex items-center justify-center gap-1 text-sm text-accent hover:opacity-80 transition-opacity"
                  style={{ fontWeight: 600 }}
                >
                  외 {safeItems.length - 5}개 더 보기
                  <ChevronRight className="w-4 h-4" />
                </Link>
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
    <div className="bg-card border border-border rounded-xl p-4 relative">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base" style={{ fontWeight: 600 }}>
              {ingredient.name}
            </h3>
            <span
              className="px-2 py-0.5 rounded text-xs"
              style={{
                backgroundColor: `${statusColor}1F`,
                color: statusColor,
                fontWeight: 600,
              }}
            >
              {formatDDay(daysLeft)}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-muted-foreground">
              수량: {ingredient.quantity}
              {ingredient.unit}
            </p>
            <p className="text-sm text-muted-foreground">
              유통기한: {ingredient.expirationDate.toLocaleDateString('ko-KR')}
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
          className="ml-3 p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      </div>
    </div>
  );
}