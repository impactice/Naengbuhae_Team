import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Home, Package, AlertCircle, ShoppingCart, LogOut, User } from 'lucide-react';
import { useEffect } from 'react';
import { ingredientStore } from '../store/ingredientStore';

export default function Root() {
  const location = useLocation();
  const navigate = useNavigate();

  // 로그인 여부 확인
  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('token');
      ingredientStore.clear();
      navigate('/login');
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: '홈' },
    { path: '/ingredients', icon: Package, label: '식재료' },
    { path: '/priority', icon: AlertCircle, label: '우선순위' },
    { path: '/my-custom', icon: User, label: '나의 맞춤' },
    { path: '/shopping-list', icon: ShoppingCart, label: '장보기' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 로그아웃 버튼 */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
          title="로그아웃"
        >
          <LogOut className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
        <div className="max-w-screen-sm mx-auto flex justify-around items-center h-16">
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
                    active ? 'text-black' : 'text-gray-400'
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={`text-xs ${
                    active ? 'text-black' : 'text-gray-400'
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
  );
}
