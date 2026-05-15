import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../utils/apiClient';

// 로그인된 사용자가 마이페이지에서 비밀번호 변경.
// "비밀번호 찾기"(/reset-password, 토큰 기반)와는 다른 흐름 — 현재 비번 입력 확인 후 변경.
export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiFetch('/user/me/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.success) {
        setDone(true);
      } else {
        setError(data?.message ?? '비밀번호 변경에 실패했습니다.');
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl mb-2" style={{ fontWeight: 700 }}>비밀번호가 변경되었어요</h1>
          <p className="text-sm text-gray-500 mb-6">다음 로그인부터 새 비밀번호로 입장해주세요.</p>
          <button
            onClick={() => navigate('/my-custom')}
            className="w-full bg-black text-white rounded-xl py-3"
            style={{ fontWeight: 600 }}
          >
            마이페이지로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl">
        <div className="px-5 pt-6 pb-4 flex items-center gap-3 border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl" style={{ fontWeight: 700 }}>비밀번호 변경</h1>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">현재 비밀번호</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDFF00]"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">새 비밀번호</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="영소문자 + 숫자 + 특수문자 포함 8자 이상"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDFF00]"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">새 비밀번호 확인</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDFF00] pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-black text-white rounded-xl disabled:opacity-50"
            style={{ fontWeight: 600 }}
          >
            {submitting ? '변경 중...' : '비밀번호 변경하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
