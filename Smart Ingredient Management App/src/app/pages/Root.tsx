import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Home, Package, AlertCircle, ShoppingCart, LogOut, User } from 'lucide-react';
import { useEffect } from 'react';
import { userStore } from '../store/userStore';
import { fridgeStore } from '../store/fridgeStore';
import { notificationStore } from '../store/notificationStore';
import { clearAuth, logoutOnServer } from '../utils/apiClient';
import { isGuest, clearGuest } from '../utils/guestMode';

export default function Root() {
  const location = useLocation();
  const navigate = useNavigate();

  // 로그인 여부 확인 — sessionStorage(세션 로그인) / localStorage(로그인 유지) 양쪽 다 봄.
  // 게스트(비로그인) 사용자도 허용.
  useEffect(() => {
    const isLoggedIn =
      sessionStorage.getItem('isLoggedIn') ?? localStorage.getItem('isLoggedIn');
    if (!isLoggedIn && !isGuest()) {
      navigate('/login');
    }
  }, [navigate]);

  // 로그인 사용자 한정 — unread 알림 카운트 polling 시작 (게스트는 알림 없음).
  // 탭이 visible일 때만 갱신하므로 부담 적음.
  useEffect(() => {
    const isLoggedIn =
      sessionStorage.getItem('isLoggedIn') ?? localStorage.getItem('isLoggedIn');
    if (!isLoggedIn || isGuest()) return;
    notificationStore.start();
    return () => notificationStore.stop();
  }, []);

  const handleLogout = async () => {
    if (isGuest()) {
      // 게스트 모드 종료. 로컬 식재료도 같이 정리하면 데이터 손실 위험 → 로그인 화면으로만 이동.
      if (!confirm('비로그인 모드를 종료하시겠습니까?')) return;
      clearGuest();
      fridgeStore.clear();
      navigate('/login');
      return;
    }
    if (!confirm('로그아웃 하시겠습니까?')) return;
    await logoutOnServer();
    clearAuth();
    userStore.clearCache();
    fridgeStore.clear();
    notificationStore.stop();
    notificationStore.reset();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: '홈' },
    { path: '/ingredients', icon: Package, label: '식재료' },
    { path: '/priority', icon: AlertCircle, label: '우선순위' },
    { path: '/shopping-list', icon: ShoppingCart, label: '장보기' },
    { path: '/my-custom', icon: User, label: '나의 맞춤' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      {/* 앱 컨테이너 - 모바일 뷰 */}
      <div className="w-full max-w-md bg-background text-foreground min-h-screen flex flex-col relative shadow-xl">
        {/* 로그아웃 버튼 — 나의 맞춤 페이지에서만 노출 */}
        {location.pathname.startsWith('/my-custom') && (
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={handleLogout}
              className="p-2 bg-card border border-border rounded-full shadow-sm hover:bg-secondary transition-colors"
              title="로그아웃"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* 메인 콘텐츠 */}
        <main className="flex-1 pb-20 overflow-y-auto">
          <Outlet />
        </main>

        {/* 하단 네비게이션 */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background border-t border-border">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-1"
                >
                  <Icon
                    className={`w-6 h-6 ${
                      active ? 'text-black dark:text-white' : 'text-muted-foreground dark:text-muted-foreground'
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span
                    className={`text-xs ${
                      active ? 'text-black dark:text-white' : 'text-muted-foreground dark:text-muted-foreground'
                    }`}
                    style={{ fontWeight: active ? 600 : 400 }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
