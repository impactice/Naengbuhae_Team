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
  Flame
} from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';

const DIET_GOAL_KO_TO_KEY: Record<string, 'weight-loss' | 'maintain' | 'muscle-gain' | 'health'> = {
  '체중 감량': 'weight-loss',
  '체중 유지': 'maintain',
  '근육량 증가': 'muscle-gain',
  '건강 관리': 'health',
};

export default function MyCustom() {
  const navigate = useNavigate();
  const { profile, loading } = useUserProfile();

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

      {/* 기본 정보 카드 */}
      <div className="px-5 py-5">
        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#CDFF00] rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{profile.name}</h2>
                <p className="text-sm text-gray-500">
                  {age}세 · {profile.gender}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">키</p>
              <p className="text-lg font-semibold">{profile.height} cm</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">몸무게</p>
              <p className="text-lg font-semibold">{profile.weight} kg</p>
            </div>
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
      <div className="px-5 pb-5">
        <h3 className="font-semibold mb-3">건강 목표</h3>
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">식단 목표</p>
              <p className="font-semibold">{profile.dietGoal}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">활동량</p>
              <p className="font-semibold">{profile.activityLevel}</p>
            </div>
          </div>
        </div>
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

      {/* 권장 영양소 비율 */}
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
    </div>
  );
}
