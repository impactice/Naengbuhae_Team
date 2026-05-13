import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('인증 중입니다...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('유효하지 않은 인증 링크입니다.');
      return;
    }
    (async () => {
      try {
        const res = await fetch('http://localhost:8080/user/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (data?.success) {
          setStatus('success');
          setMessage(data.message ?? '이메일 인증이 완료되었습니다.');
        } else {
          setStatus('error');
          setMessage(data?.message ?? '인증에 실패했습니다.');
        }
      } catch {
        setStatus('error');
        setMessage('서버 연결에 실패했습니다.');
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="text-xl mb-2" style={{ fontWeight: 700 }}>인증 완료</h1>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <Link to="/login" className="block w-full bg-black text-white rounded-xl py-3"
                  style={{ fontWeight: 600 }}>
              로그인하기
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl mb-2" style={{ fontWeight: 700 }}>인증 실패</h1>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <Link to="/login" className="block w-full bg-black text-white rounded-xl py-3"
                  style={{ fontWeight: 600 }}>
              로그인으로 돌아가기
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
