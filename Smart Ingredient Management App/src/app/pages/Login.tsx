import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8080/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // 로그인 성공 - 토큰 및 사용자 정보 저장
        localStorage.setItem('isLoggedIn', 'true');
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        if (data.user) {
          localStorage.setItem('userProfile', JSON.stringify(data.user));
        }

        navigate('/');
      } else {
        const error = await response.text();
        alert(`로그인 실패: ${error}`);
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  const handleSocialLogin = (provider: 'kakao' | 'naver' | 'google') => {
    // 백엔드 OAuth 인증 엔드포인트로 이동
    // 백엔드에서 카카오 → JWT 발급 → /oauth/callback으로 redirect
    if (provider === 'kakao') {
      window.location.href = 'http://localhost:8080/oauth2/authorization/kakao';
      return;
    }
    alert(`${provider === 'naver' ? '네이버' : '구글'} 로그인은 준비 중입니다.`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col">
        <div className="flex-1 flex flex-col justify-center px-6 py-12">
          {/* 로고/타이틀 영역 */}
          <div className="mb-12">
            <h1 className="text-3xl mb-2" style={{ fontWeight: 700 }}>
              스마트 냉장고
            </h1>
            <p className="text-gray-500">
              신선한 식재료 관리의 시작
            </p>
          </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="아이디"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full px-4 py-4 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDFF00] transition-all"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-4 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDFF00] transition-all pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            로그인
          </button>
        </form>

        {/* 구분선 */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-sm text-gray-400">간편 로그인</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* 소셜 로그인 */}
        <div className="space-y-3">
          <button
            onClick={() => handleSocialLogin('naver')}
            className="w-full py-4 bg-[#03C75A] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#02b351] transition-colors"
          >
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#03C75A] text-xs" style={{ fontWeight: 700 }}>N</span>
            </div>
            네이버로 시작하기
          </button>

          <button
            onClick={() => handleSocialLogin('kakao')}
            className="w-full py-4 bg-[#FEE500] text-black rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#fdd835] transition-colors"
          >
            <div className="w-5 h-5 bg-[#3C1E1E] rounded-full"></div>
            카카오로 시작하기
          </button>

          <button
            onClick={() => handleSocialLogin('google')}
            className="w-full py-4 bg-white border-2 border-gray-200 text-black rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            구글로 시작하기
          </button>
        </div>

        {/* 회원가입 링크 */}
        <div className="mt-8 text-center">
          <span className="text-gray-500">아직 회원이 아니신가요? </span>
          <Link
            to="/signup"
            className="font-semibold hover:underline"
            style={{ color: '#CDFF00', textShadow: '0 0 1px rgba(0,0,0,0.3)' }}
          >
            회원가입
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
