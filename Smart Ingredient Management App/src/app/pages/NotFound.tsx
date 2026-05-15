import { Link } from 'react-router';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-5">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-muted-foreground opacity-50 mx-auto mb-4" />
        <h1 className="text-2xl mb-2" style={{ fontWeight: 700 }}>
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-muted-foreground mb-6">
          요청하신 페이지가 존재하지 않습니다
        </p>
        <Link to="/">
          <button
            className="px-6 py-3 rounded-xl"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 600 }}
          >
            홈으로 돌아가기
          </button>
        </Link>
      </div>
    </div>
  );
}
