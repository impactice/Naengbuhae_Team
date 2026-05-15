import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Bell } from 'lucide-react';
import { apiFetch } from '../utils/apiClient';
import { isGuest } from '../utils/guestMode';
import GuestBlocked from '../components/GuestBlocked';

interface NotificationItem {
  id: number;
  title: string;
  body: string;
  route: string | null;
  read: boolean;
  createdAt: string;
}

// 인앱 알림 센터 — 받은 알림 히스토리.
// 진입 시 자동으로 read-all 호출 (사용자가 봤다고 간주).
// 항목 탭 시 route 키로 분기 (앱과 동일 — fridge / ingredients / meal).
export default function NotificationCenter() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const guest = isGuest();

  useEffect(() => {
    if (guest) return;
    (async () => {
      try {
        const res = await apiFetch('/api/notifications');
        if (!res.ok) {
          setError(`조회 실패 (${res.status})`);
          return;
        }
        const data = (await res.json()) as NotificationItem[];
        setItems(data);
        // 본 시점에 읽음 처리 (실패해도 무시)
        apiFetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {});
      } catch {
        setError('서버 연결 실패');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onTap = (item: NotificationItem) => {
    if (!item.route) return;
    switch (item.route) {
      case 'fridge':
        navigate('/fridges');
        break;
      case 'ingredients':
      case 'expiry':
        navigate('/ingredients');
        break;
      case 'meal':
        navigate('/meal-plan');
        break;
    }
  };

  const formatTime = (iso: string): string => {
    const dt = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - dt.getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return '방금 전';
    if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`;
    const days = Math.floor(hr / 24);
    if (days < 7) return `${days}일 전`;
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  if (guest) return <GuestBlocked feature="알림 센터" />;

  return (
    <div className="min-h-screen bg-white pb-4">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl" style={{ fontWeight: 700 }}>알림</h1>
      </div>

      <div className="px-5">
        {loading ? (
          <div className="text-center py-12 text-gray-400">불러오는 중...</div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">받은 알림이 없어요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onTap(item)}
                className={`w-full text-left rounded-xl p-4 border transition-colors ${
                  item.read
                    ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    : 'bg-lime-50 border-lime-200 hover:bg-lime-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1.5">
                    <span
                      className={`block w-2 h-2 rounded-full ${
                        item.read ? 'bg-transparent' : 'bg-lime-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ fontWeight: 700 }}>{item.title}</p>
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{item.body}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{formatTime(item.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
