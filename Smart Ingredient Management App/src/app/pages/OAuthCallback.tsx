import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { userStore } from '../store/userStore';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      alert('소셜 로그인에 실패했습니다. 다시 시도해주세요.');
      navigate('/login', { replace: true });
      return;
    }

    // 토큰 저장 — 일반 로그인과 동일한 키 사용
    localStorage.setItem('authToken', token);
    localStorage.setItem('isLoggedIn', 'true');

    // 프로필 정보 받아오고 홈으로 이동
    // (카카오 사용자는 신체정보가 비어있을 수 있는데, MyCustom 페이지에서 CTA로 안내)
    userStore.fetchUserProfile().finally(() => {
      navigate('/', { replace: true });
    });
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">로그인 처리 중...</p>
      </div>
    </div>
  );
}
