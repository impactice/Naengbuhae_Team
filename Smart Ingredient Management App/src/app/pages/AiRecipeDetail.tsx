import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { ArrowLeft, Plus, ShoppingCart, Sparkles } from 'lucide-react';
import { apiFetch } from '../utils/apiClient';
import { isGuest } from '../utils/guestMode';
import GuestBlocked from '../components/GuestBlocked';
import type { AiRecipeResult } from './AiRecommend';

// AI 추천 결과 단일 상세 — router state로 recipe 데이터 전달받음.
// 기존 RecipeDetail.tsx와 유사한 레이아웃 (헤더 + 정보 카드 + 필요한 재료 + 액션 + 효능/팁).
// 단 AI 응답엔 quantity/unit/step 등 정보가 없어 layout이 부분적으로 다름.
export default function AiRecipeDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const recipe = (location.state as { recipe?: AiRecipeResult } | null)?.recipe;

  const [adding, setAdding] = useState(false);

  if (isGuest()) return <GuestBlocked feature="AI 레시피 상세" />;

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">레시피 정보가 없습니다</p>
          <button
            onClick={() => navigate('/ai-recommend')}
            className="px-6 py-3 rounded-xl"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 600 }}
          >
            AI 추천으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // "신선한 채소 (루꼴라, 시금치 등): 활용법..." 같은 자유 형식에서 이름만 추출.
  const parseName = (text: string): string => text.split(/[:\(（]/)[0].trim();
  // 콜론 뒤 활용법.
  const parseDetail = (text: string): string =>
    text.includes(':') ? text.substring(text.indexOf(':') + 1).trim() : '';

  const handleBulkAdd = async () => {
    if (adding) return;
    const items = (recipe.additional_ingredients ?? [])
      .map(parseName)
      .filter((n) => n.length > 0)
      .map((name) => ({ name, quantity: 1, unit: '개' }));

    if (items.length === 0) {
      alert('추가할 재료가 없어요.');
      return;
    }
    if (!confirm(`재료 ${items.length}개를 장보기에 추가할까요?\n\n${items.map((i) => `· ${i.name}`).join('\n')}`)) return;

    setAdding(true);
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
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl flex-1" style={{ fontWeight: 700 }}>
          {recipe.dish_name}
        </h1>
      </div>

      {/* 기본 정보 카드 — AI 추천 뱃지 */}
      <div className="px-5 pb-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs"
            style={{ backgroundColor: 'var(--accent)', color: '#1A3300', fontWeight: 700 }}
          >
            <Sparkles className="w-3 h-3" />
            AI 추천
          </span>
          <span className="text-sm text-muted-foreground">
            냉장고 식재료 기반으로 만든 맞춤 추천
          </span>
        </div>
      </div>

      {/* 필요한 재료 + 액션 버튼 */}
      {recipe.additional_ingredients && recipe.additional_ingredients.length > 0 && (
        <div className="px-5 pb-6">
          <h2 className="text-lg mb-3" style={{ fontWeight: 600 }}>
            필요한 재료
          </h2>
          <div className="space-y-2">
            {recipe.additional_ingredients.map((text, i) => {
              const name = parseName(text);
              const detail = parseDetail(text);
              return (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <p className="text-sm" style={{ fontWeight: 600 }}>{name}</p>
                  {detail && (
                    <p className="text-xs text-muted-foreground mt-1">{detail}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* 액션 버튼 — 재료 바로 밑에 배치 (RecipeDetail과 동일 패턴) */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleBulkAdd}
              disabled={adding}
              className="flex-1 py-3 bg-secondary rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{ fontWeight: 600 }}
            >
              <Plus className="w-4 h-4" />
              {adding
                ? '추가 중...'
                : `재료 ${recipe.additional_ingredients.length}개 장보기에 추가`}
            </button>
            <Link to="/shopping-list" className="flex-1">
              <button
                className="w-full py-3 rounded-xl text-sm flex items-center justify-center gap-1.5"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 600 }}
              >
                <ShoppingCart className="w-4 h-4" />
                장보기 리스트 보기
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* 효능 / 추천 이유 */}
      {recipe.health_benefits && (
        <div className="px-5 pb-6">
          <h2 className="text-lg mb-3" style={{ fontWeight: 600 }}>
            효능 / 추천 이유
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {recipe.health_benefits}
          </p>
        </div>
      )}

      {/* 조리 팁 */}
      {recipe.recipe_tip && (
        <div className="px-5 pb-6">
          <h2 className="text-lg mb-3" style={{ fontWeight: 600 }}>
            조리 팁
          </h2>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm leading-relaxed">💡 {recipe.recipe_tip}</p>
          </div>
        </div>
      )}
    </div>
  );
}
