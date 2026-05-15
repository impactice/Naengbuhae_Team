import { Link } from 'react-router';
import { Lock } from 'lucide-react';

// 게스트(비로그인)가 로그인 필요 페이지에 진입했을 때 표시하는 공통 안내.
// 각 페이지 컴포넌트 최상단에서 isGuest() 검사 후 이 컴포넌트를 반환하면 된다.
interface Props {
  feature: string;
}

export default function GuestBlocked({ feature }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-2">{feature}은 로그인 후 사용할 수 있어요</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          지금 추가한 식재료는<br />
          로그인하면 그대로 옮겨드릴게요.
        </p>
        <div className="flex gap-2 justify-center">
          <Link
            to="/signup"
            className="px-6 py-3 bg-foreground text-background rounded-xl font-semibold text-sm"
          >
            회원가입
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 bg-secondary text-black rounded-xl font-semibold text-sm"
          >
            로그인하기
          </Link>
        </div>
      </div>
    </div>
  );
}
