import { useEffect, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, User as UserIcon } from 'lucide-react';
import { apiFetch } from '../utils/apiClient';
import { fridgeStore } from '../store/fridgeStore';
import { isGuest } from '../utils/guestMode';
import GuestBlocked from '../components/GuestBlocked';

interface MemberCount {
  username: string;
  name: string;
  added: number;
  removed: number;
}

interface NameCount {
  name: string;
  count: number;
}

interface Stats {
  fridgeId: number;
  fridgeName: string;
  periodDays: number;
  members: MemberCount[];
  topAdded: NameCount[];
  topRemoved: NameCount[];
}

const PERIOD_OPTIONS = [7, 30, 90];

// 가족 활동 통계 — 현재 선택된 냉장고 기준.
// 멤버별 추가/소비 카운트 + 자주 추가/비운 식재료 TOP 5.
export default function FamilyActivity() {
  const navigate = useNavigate();
  const selected = useSyncExternalStore(
    (cb) => fridgeStore.subscribe(cb),
    () => fridgeStore.getSelected(),
    () => fridgeStore.getSelected(),
  );

  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) {
      setLoading(false);
      setError('선택된 냉장고가 없어요');
      return;
    }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await apiFetch(`/api/fridges/${selected.id}/activity-stats?days=${days}`);
        if (!res.ok) {
          setError(`조회 실패 (${res.status})`);
          return;
        }
        setStats((await res.json()) as Stats);
      } catch {
        setError('서버 연결 실패');
      } finally {
        setLoading(false);
      }
    })();
  }, [selected?.id, days]);

  const totalAdded = stats?.members.reduce((s, m) => s + m.added, 0) ?? 0;
  const totalRemoved = stats?.members.reduce((s, m) => s + m.removed, 0) ?? 0;
  const maxAdded = Math.max(1, ...(stats?.topAdded.map((i) => i.count) ?? [1]));
  const maxRemoved = Math.max(1, ...(stats?.topRemoved.map((i) => i.count) ?? [1]));

  if (isGuest()) return <GuestBlocked feature="가족 활동" />;

  return (
    <div className="min-h-screen bg-white pb-4">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl" style={{ fontWeight: 700 }}>가족 활동</h1>
      </div>

      <div className="px-5">
        {loading ? (
          <div className="text-center py-12 text-gray-400">불러오는 중...</div>
        ) : error ? (
          <div className="text-center py-12 text-gray-500">{error}</div>
        ) : stats == null ? null : (
          <div className="space-y-5">
            {/* 헤더 카드 */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, #F7FEE7 0%, #FEFCE8 100%)',
                border: '1px solid #D9F99D',
              }}
            >
              <p className="text-xs text-gray-500">{stats.fridgeName}</p>
              <p className="text-lg mt-1" style={{ fontWeight: 700 }}>
                지난 {stats.periodDays}일간 활동
              </p>
              <div className="flex gap-4 mt-3">
                <SummaryStat label="추가" value={totalAdded} color="#16A34A" />
                <SummaryStat label="비움" value={totalRemoved} color="#EA580C" />
              </div>
            </div>

            {/* 기간 chips */}
            <div className="flex gap-2">
              {PERIOD_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    days === d
                      ? 'bg-lime-300 text-black'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{ fontWeight: days === d ? 600 : 500 }}
                >
                  {d}일
                </button>
              ))}
            </div>

            {/* 멤버별 활동 */}
            <section>
              <h2 className="text-sm mb-2" style={{ fontWeight: 600 }}>멤버별 활동</h2>
              {stats.members.length === 0 ? (
                <EmptyCard text="아직 활동 기록이 없어요" />
              ) : (
                <div className="space-y-2">
                  {stats.members.map((m) => (
                    <div
                      key={m.username}
                      className="bg-gray-50 rounded-xl p-3 flex items-center gap-3"
                    >
                      <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-gray-500" />
                      </div>
                      <p className="flex-1 text-sm" style={{ fontWeight: 600 }}>{m.name || m.username}</p>
                      <CountBadge text={`+${m.added}`} color="#16A34A" />
                      <CountBadge text={`-${m.removed}`} color="#EA580C" />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 자주 추가한 식재료 */}
            <RankedSection title="자주 추가한 식재료" items={stats.topAdded} max={maxAdded} color="#16A34A" />

            {/* 자주 비운 식재료 */}
            <RankedSection title="자주 비운 식재료" items={stats.topRemoved} max={maxRemoved} color="#EA580C" />
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl mt-1" style={{ fontWeight: 700, color }}>{value}</p>
      <p className="text-xs text-gray-500">개</p>
    </div>
  );
}

function CountBadge({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded text-xs"
      style={{ backgroundColor: `${color}1f`, color, fontWeight: 700 }}
    >
      {text}
    </span>
  );
}

function RankedSection({
  title,
  items,
  max,
  color,
}: {
  title: string;
  items: NameCount[];
  max: number;
  color: string;
}) {
  if (items.length === 0) {
    return (
      <section>
        <h2 className="text-sm mb-2" style={{ fontWeight: 600 }}>{title}</h2>
        <EmptyCard text="아직 기록이 없어요" />
      </section>
    );
  }
  return (
    <section>
      <h2 className="text-sm mb-2" style={{ fontWeight: 600 }}>{title}</h2>
      <div className="space-y-1.5">
        {items.map((item, i) => {
          const ratio = max === 0 ? 0 : item.count / max;
          return (
            <div key={item.name} className="bg-gray-50 rounded-lg px-3 py-2.5 flex items-center gap-3">
              <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs" style={{ fontWeight: 700 }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ fontWeight: 600 }}>{item.name}</p>
                <div className="h-1.5 bg-gray-200 rounded mt-1.5 overflow-hidden">
                  <div className="h-full" style={{ width: `${ratio * 100}%`, backgroundColor: color }} />
                </div>
              </div>
              <span className="text-xs text-gray-500">{item.count}회</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="bg-gray-50 rounded-xl py-6 text-center">
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}
