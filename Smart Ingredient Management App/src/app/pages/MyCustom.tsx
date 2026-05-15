import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  User,
  Heart,
  Activity,
  AlertTriangle,
  ChefHat,
  Calendar,
  TrendingUp,
  Target,
  Flame,
  Sparkles,
  ChevronRight,
  Refrigerator,
  Bell,
  Users,
} from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { userStore } from '../store/userStore';
import { fridgeStore } from '../store/fridgeStore';
import { apiFetch, clearAuth } from '../utils/apiClient';
import { isGuest, clearGuest } from '../utils/guestMode';

const DIET_GOAL_KO_TO_KEY: Record<string, 'weight-loss' | 'maintain' | 'muscle-gain' | 'health'> = {
  '체중 감량': 'weight-loss',
  '체중 유지': 'maintain',
  '근육량 증가': 'muscle-gain',
  '건강 관리': 'health',
};

export default function MyCustom() {
  const navigate = useNavigate();
  const { profile, loading } = useUserProfile();
  const [unread, setUnread] = useState(0);

  const guest = isGuest();

  useEffect(() => {
    if (guest) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/notifications/unread-count');
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (!cancelled) setUnread(data.count ?? 0);
      } catch {
        // 무시 — 진입 시 다시 시도
      }
    })();
    return () => { cancelled = true; };
  }, [guest]);

  const handleDeleteAccount = async () => {
    if (!confirm('정말 회원 탈퇴 하시겠습니까?\n\n탈퇴 시 계정과 모든 데이터(식재료, 레시피 기록 등)가 영구 삭제되며 복구할 수 없습니다.')) {
      return;
    }
    if (!confirm('마지막 확인입니다.\n탈퇴를 진행하시겠습니까?')) {
      return;
    }
    try {
      await userStore.deleteAccount();
      // 양쪽 storage(session/local) 모두 정리. 로그인 유지 체크 여부와 무관하게 흔적 제거.
      clearAuth();
      userStore.clearCache();
      fridgeStore.clear();
      alert('회원 탈퇴가 완료되었습니다.');
      navigate('/login');
    } catch (error) {
      console.error('회원 탈퇴 실패:', error);
      alert('회원 탈퇴 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  // BMI 계산
  const calculateBMI = () => {
    if (!profile?.height || !profile?.weight) return null;
    const heightM = profile.height / 100;
    const weightKg = profile.weight;
    const bmi = weightKg / (heightM * heightM);
    return bmi.toFixed(1);
  };

  // BMI 상태 텍스트
  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { text: '저체중', color: 'text-blue-600' };
    if (bmi < 23) return { text: '정상', color: 'text-green-600' };
    if (bmi < 25) return { text: '과체중', color: 'text-yellow-600' };
    return { text: '비만', color: 'text-red-600' };
  };

  // 나이 계산
  const calculateAge = () => {
    if (!profile?.birthDate) return null;
    const birth = new Date(profile.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const bmi = calculateBMI();
  const bmiStatus = bmi ? getBMIStatus(parseFloat(bmi)) : null;
  const age = calculateAge();
  const normalizedDietGoal = profile ? DIET_GOAL_KO_TO_KEY[profile.dietGoal] : undefined;

  // 신체정보가 비어있으면 프로필 미완성 — 카카오 등 소셜 로그인 사용자가 정보 미입력 상태
  const isProfileIncomplete = !!profile && (
    !profile.height || !profile.weight || !profile.gender || !profile.birthDate
  );

  // 게스트(비로그인)는 안내 화면을 즉시 표시 — /user/me 호출 안 함
  if (guest) {
    const lockedItems: Array<{ icon: typeof Bell; title: string; subtitle: string }> = [
      { icon: Bell, title: '알림 센터', subtitle: '받은 알림 내역' },
      { icon: Refrigerator, title: '냉장고 관리', subtitle: '가족 공유, 초대 코드' },
      { icon: Users, title: '가족 활동', subtitle: '멤버별 추가/소비 통계' },
      { icon: Calendar, title: '식단 계획', subtitle: '맞춤 식단 추천' },
      { icon: ChefHat, title: '맞춤 레시피', subtitle: '내 식재료 기반 추천' },
      { icon: Heart, title: '영양 분석', subtitle: '권장 칼로리 + 영양 비율' },
    ];
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-2xl mb-1" style={{ fontWeight: 700 }}>나의 맞춤</h1>
          <p className="text-sm text-gray-500">지금은 비로그인 상태예요</p>
        </div>
        <div className="mx-5 mt-2 p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, #CDFF00, #B8E600)' }}>
          <h2 className="font-bold text-base">로그인하면 더 많은 기능을 사용할 수 있어요</h2>
          <p className="mt-1 text-xs text-gray-800 leading-relaxed">
            가족과 냉장고 공유 / 식단 추천 / 알림 등<br />
            지금 추가한 식재료는 로그인하면 그대로 옮겨드려요.
          </p>
          <div className="mt-4 flex gap-2">
            <Link to="/signup" className="flex-1 py-3 bg-black text-white rounded-lg text-sm font-bold text-center">
              회원가입
            </Link>
            <Link to="/login" className="flex-1 py-3 bg-white text-black rounded-lg text-sm font-bold text-center">
              로그인
            </Link>
          </div>
        </div>

        <div className="px-5 mt-6">
          <h3 className="text-sm font-semibold mb-2">잠금 기능</h3>
          {lockedItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                onClick={() => {
                  if (confirm(`${item.title} 기능은 로그인 후 사용할 수 있어요.\n지금 추가한 식재료는 로그인하면 그대로 옮겨드릴게요.\n\n로그인하시겠습니까?`)) {
                    navigate('/login');
                  }
                }}
                className="w-full flex items-center gap-3 p-4 mb-2 bg-gray-50 rounded-xl text-left"
              >
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-600">{item.title}</div>
                  <div className="text-xs text-gray-400">{item.subtitle}</div>
                </div>
                <span className="text-xs text-gray-400">🔒</span>
              </button>
            );
          })}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => {
              if (!confirm('비로그인 모드를 종료하시겠습니까?')) return;
              clearGuest();
              fridgeStore.clear();
              navigate('/login');
            }}
            className="text-sm text-gray-500 underline underline-offset-2"
          >
            비로그인 모드 종료
          </button>
        </div>
      </div>
    );
  }

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">프로필 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 프로필 없음
  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold mb-2">프로필 정보가 없습니다</h2>
          <p className="text-gray-500 mb-6">
            로그인 후 프로필을 확인할 수 있습니다
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4 border-b border-gray-100">
        <h1 className="text-2xl mb-1" style={{ fontWeight: 700 }}>
          나의 맞춤
        </h1>
        <p className="text-sm text-gray-500">
          {profile.name}님을 위한 건강 관리
        </p>
      </div>

      {/* 프로필 미완성 시 CTA — 카카오 등으로 가입한 사용자 안내 */}
      {isProfileIncomplete && (
        <div className="px-5 pt-5">
          <button
            onClick={() => navigate('/profile/complete')}
            className="w-full bg-gradient-to-br from-[#CDFF00] to-[#b8e600] rounded-2xl p-5 text-left hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-[#CDFF00]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1">정보 입력 마저하기</h3>
                <p className="text-sm text-gray-800 leading-relaxed">
                  키, 몸무게, 활동량 등을 입력하면<br />
                  맞춤 칼로리와 식단 추천을 받을 수 있어요
                </p>
                <p className="text-xs text-gray-700 mt-2 font-semibold">
                  지금 입력하기 →
                </p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* 기본 정보 카드 */}
      <div className="px-5 py-5">
        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-5">
          <button
            type="button"
            onClick={() => navigate('/profile/complete')}
            className="w-full flex items-center justify-between mb-4 -m-2 p-2 rounded-xl hover:bg-gray-100 transition-colors text-left"
            title="회원 정보 수정"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#CDFF00] rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{profile.name}</h2>
                <p className="text-sm text-gray-500">
                  {age != null && profile.gender
                    ? `${age}세 · ${profile.gender === '남' ? '남성' : profile.gender === '여' ? '여성' : profile.gender}`
                    : '프로필 정보를 완성해주세요'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </button>

          {(profile.height || profile.weight) && (
            <div className="grid grid-cols-2 gap-4">
              {profile.height && (
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">키</p>
                  <p className="text-lg font-semibold">{profile.height} cm</p>
                </div>
              )}
              {profile.weight && (
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">몸무게</p>
                  <p className="text-lg font-semibold">{profile.weight} kg</p>
                </div>
              )}
              {bmi && (
                <>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">BMI</p>
                    <p className="text-lg font-semibold">{bmi}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">상태</p>
                    <p className={`text-lg font-semibold ${bmiStatus?.color}`}>
                      {bmiStatus?.text}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 일일 권장 칼로리 (백엔드에서 계산한 값 사용) */}
      {profile.recommendedCalories && (
        <div className="px-5 pb-5">
          <div className="bg-black text-white rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-[#CDFF00]" />
              <h3 className="font-semibold">일일 권장 칼로리</h3>
            </div>
            <p className="text-3xl font-bold mb-2">{profile.recommendedCalories.toLocaleString()} kcal</p>
            <p className="text-sm text-gray-300">
              {profile.dietGoal} 목표 기준
            </p>
          </div>
        </div>
      )}

      {/* 건강 목표 */}
      {(profile.dietGoal || profile.activityLevel) && (
        <div className="px-5 pb-5">
          <h3 className="font-semibold mb-3">건강 목표</h3>
          <div className="space-y-3">
            {profile.dietGoal && (
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">식단 목표</p>
                  <p className="font-semibold">{profile.dietGoal}</p>
                </div>
              </div>
            )}

            {profile.activityLevel && (
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">활동량</p>
                  <p className="font-semibold">{profile.activityLevel}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 알림 센터 진입 */}
      <div className="px-5 pb-3">
        <Link
          to="/notifications"
          onClick={() => setUnread(0)}
          className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
        >
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">알림</p>
            <p className="text-xs text-gray-500">받은 알림 내역 (가족 활동 / 멤버 변경)</p>
          </div>
          {unread > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs text-white"
              style={{ backgroundColor: '#DC2626', fontWeight: 700 }}
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>

      {/* 냉장고 관리 진입 */}
      <div className="px-5 pb-3">
        <Link
          to="/fridges"
          className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
        >
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Refrigerator className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">냉장고 관리</p>
            <p className="text-xs text-gray-500">가족 공유, 초대 코드, 김치냉장고 추가 등</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>

      {/* 가족 활동 통계 진입 */}
      <div className="px-5 pb-5">
        <Link
          to="/family-activity"
          className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
        >
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">가족 활동</p>
            <p className="text-xs text-gray-500">멤버별 추가/소비 + 자주 사는 식재료 TOP</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>

      {/* 알레르기 정보 */}
      {profile.allergies && (
        <div className="px-5 pb-5">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">알레르기 주의</h3>
            </div>
            <p className="text-red-800 leading-relaxed">
              {profile.allergies}
            </p>
            <p className="text-xs text-red-600 mt-3">
              ⚠️ 레시피 추천 시 해당 식재료는 제외됩니다
            </p>
          </div>
        </div>
      )}

      {/* 맞춤 기능 바로가기 */}
      <div className="px-5 pb-5">
        <h3 className="font-semibold mb-3">맞춤 기능</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/recipes"
            className="bg-gradient-to-br from-[#CDFF00] to-[#b8e600] rounded-xl p-4 hover:shadow-lg transition-all"
          >
            <ChefHat className="w-8 h-8 mb-2" />
            <p className="font-semibold mb-1">맞춤 레시피</p>
            <p className="text-xs text-gray-700">
              건강 목표에 맞는<br />레시피 추천
            </p>
          </Link>

          <Link
            to="/meal-plan"
            className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-4 hover:shadow-lg transition-all"
          >
            <Calendar className="w-8 h-8 mb-2 text-blue-600" />
            <p className="font-semibold mb-1">식단 계획</p>
            <p className="text-xs text-gray-600">
              주간/월간<br />식단 관리
            </p>
          </Link>

          <Link
            to="/priority"
            className="bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-xl p-4 hover:shadow-lg transition-all"
          >
            <TrendingUp className="w-8 h-8 mb-2 text-orange-600" />
            <p className="font-semibold mb-1">소비 우선순위</p>
            <p className="text-xs text-gray-600">
              유통기한 기반<br />우선 소비 추천
            </p>
          </Link>

          <Link
            to="/nutrition"
            className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl p-4 hover:shadow-lg transition-all"
          >
            <Heart className="w-8 h-8 mb-2 text-green-600" />
            <p className="font-semibold mb-1">영양 분석</p>
            <p className="text-xs text-gray-600">
              식재료별<br />영양성분 확인
            </p>
          </Link>
        </div>
      </div>

      {/* 권장 영양소 비율 — 식단 목표가 있어야 의미 있음 */}
      {profile.dietGoal && (
        <div className="px-5 pb-5">
          <h3 className="font-semibold mb-3">권장 영양소 비율</h3>
        <div className="bg-gray-50 rounded-2xl p-5">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">탄수화물</span>
                <span className="text-sm text-gray-500">50-60%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '55%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">단백질</span>
                <span className="text-sm text-gray-500">
                  {normalizedDietGoal === 'muscle-gain' ? '25-30%' : '15-20%'}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{ width: normalizedDietGoal === 'muscle-gain' ? '27%' : '17%' }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">지방</span>
                <span className="text-sm text-gray-500">20-25%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500" style={{ width: '22%' }}></div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            * {profile.dietGoal} 목표에 최적화된 비율입니다
          </p>
        </div>
      </div>
      )}

      {/* 계정 관리: LOCAL 가입자만 비밀번호 변경 가능 (소셜 계정은 비번이 없음) + 회원 탈퇴 */}
      <div className="px-5 pt-4 pb-8 border-t border-gray-100 mt-4 space-y-1">
        {profile.provider === 'LOCAL' && (
          <button
            type="button"
            onClick={() => navigate('/change-password')}
            className="w-full py-3 text-sm text-gray-700 hover:text-black transition-colors underline underline-offset-4"
          >
            비밀번호 변경
          </button>
        )}
        <button
          type="button"
          onClick={handleDeleteAccount}
          className="w-full py-3 text-sm text-gray-500 hover:text-red-600 transition-colors underline underline-offset-4"
        >
          회원 탈퇴
        </button>
      </div>
    </div>
  );
}

