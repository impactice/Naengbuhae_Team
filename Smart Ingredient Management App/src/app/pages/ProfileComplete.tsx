import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { userStore } from '../store/userStore';
import { useUserProfile } from '../hooks/useUserProfile';

// 같은 페이지가 두 가지 모드로 동작:
//  - 입력 모드 (isProfileIncomplete=true): 카카오/네이버/구글로 가입 후 신체정보 미입력 사용자
//  - 수정 모드 (isProfileIncomplete=false): 기존에 정보 입력 마친 사용자가 값 변경하러 옴
// 차이는 헤더 제목, 본문 헤딩, 서브텍스트, 제출 버튼, 성공 알림 텍스트뿐. 검증/저장 로직은 동일.
// PUT /user/me로 저장.
export default function ProfileComplete() {
  const navigate = useNavigate();
  const { profile, loading } = useUserProfile();

  // 신체정보가 다 채워졌으면 "수정" 모드, 하나라도 비어있으면 "입력" 모드.
  // MyCustom.tsx의 isProfileIncomplete 판정과 동일 기준.
  const isEditMode = !!profile && !!profile.height && !!profile.weight
      && !!profile.gender && !!profile.birthDate;

  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    height: '',
    weight: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    activityLevel: '',
    dietGoal: '',
    allergies: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // 폼이 허용하는 값 화이트리스트. 옛 더러운 데이터(gender="남성", activityLevel="sedentary" 등)가
  // 폼에 그대로 들어와서 form-level 검증을 통과해버리고 백엔드에서 터지는 걸 방지.
  const VALID_GENDERS = ['남', '여'];
  const VALID_ACTIVITY = ['거의 움직임 없음', '가벼운 활동', '보통 활동', '많은 활동', '매우 많은 활동'];
  const VALID_DIET_GOAL = ['체중 감량', '체중 유지', '근육량 증가', '건강 관리'];

  // 기존 프로필이 있으면 폼 초기값으로 채워넣기 (이름 등)
  useEffect(() => {
    if (!profile) return;
    // 백엔드는 yyyy-MM-dd로 보내므로 month/day가 0 패딩됨 ("05").
    // select 옵션은 0 패딩 없는 값("5")이라 그대로 넣으면 매칭 안 돼서 빈 값으로 표시됨.
    // → parseInt로 0 제거 후 문자열화.
    const [year, month, day] = (profile.birthDate ?? '').split('-');
    // 미래 날짜나 너무 오래된 연도는 select 옵션 범위(현재년~100년 전) 밖이라 매칭 안 되어 빈 값.
    const currentYear = new Date().getFullYear();
    const yearNum = year ? parseInt(year, 10) : NaN;
    const validYear = !isNaN(yearNum) && yearNum >= currentYear - 100 && yearNum <= currentYear
        ? String(yearNum) : '';

    setFormData((prev) => ({
      ...prev,
      name: profile.name ?? prev.name,
      gender: profile.gender && VALID_GENDERS.includes(profile.gender) ? profile.gender : '',
      height: profile.height ? String(profile.height) : '',
      weight: profile.weight ? String(profile.weight) : '',
      birthYear: validYear,
      birthMonth: month ? String(parseInt(month, 10)) : '',
      birthDay: day ? String(parseInt(day, 10)) : '',
      activityLevel: profile.activityLevel && VALID_ACTIVITY.includes(profile.activityLevel)
          ? profile.activityLevel : '',
      dietGoal: profile.dietGoal && VALID_DIET_GOAL.includes(profile.dietGoal) ? profile.dietGoal : '',
      allergies: profile.allergies ?? '',
    }));
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '이름을 입력해주세요';
    if (!formData.gender) newErrors.gender = '성별을 선택해주세요';
    if (!formData.birthYear || !formData.birthMonth || !formData.birthDay) {
      newErrors.birthDate = '생년월일을 모두 선택해주세요';
    }
    if (!formData.height || parseFloat(formData.height) <= 0) {
      newErrors.height = '올바른 키를 입력해주세요';
    }
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      newErrors.weight = '올바른 몸무게를 입력해주세요';
    }
    if (!formData.activityLevel) newErrors.activityLevel = '활동량을 선택해주세요';
    if (!formData.dietGoal) newErrors.dietGoal = '식단 목표를 선택해주세요';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstField = Object.keys(newErrors)[0];
      const focusName = firstField === 'birthDate' ? 'birthYear' : firstField;
      const el = document.querySelector(`[name="${focusName}"]`) as HTMLElement | null;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus();
      return;
    }

    const birthDate = `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`;

    try {
      setSubmitting(true);
      await userStore.updateUserProfile({
        name: formData.name,
        gender: formData.gender,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        birthDate,
        activityLevel: formData.activityLevel,
        dietGoal: formData.dietGoal,
        allergies: formData.allergies,
      });
      alert(isEditMode ? '프로필이 수정되었습니다!' : '프로필이 저장되었습니다!');
      navigate('/my-custom');
    } catch {
      // userStore.updateUserProfile 내부에서 alert 처리됨
    } finally {
      setSubmitting(false);
    }
  };

  const years = Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center z-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="ml-2 text-xl" style={{ fontWeight: 700 }}>
            {isEditMode ? '프로필 수정' : '프로필 정보 입력'}
          </h1>
        </div>

        <div className="px-6 py-8 pb-12">
          <div className="mb-8">
            <h2 className="text-2xl mb-2" style={{ fontWeight: 700 }}>
              {isEditMode ? '정보를 수정해주세요' : '맞춤 추천을 위해'}
            </h2>
            <p className="text-gray-500">
              {isEditMode ? (
                <>
                  변경할 항목을 입력하시면<br />
                  권장 칼로리도 자동으로 다시 계산됩니다
                </>
              ) : (
                <>
                  키, 몸무게, 활동량 등을 입력하시면<br />
                  개인 맞춤 식단과 권장 칼로리를 받아보실 수 있어요
                </>
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">기본 정보</h3>

              <div>
                <label className="block text-sm text-gray-600 mb-2">이름</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="홍길동"
                  className={`w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none transition-all ${
                    errors.name ? 'border-2 border-red-500' : 'focus:ring-2 focus:ring-[#CDFF00]'
                  }`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">성별</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, gender: '남' });
                      setErrors({ ...errors, gender: '' });
                    }}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      formData.gender === '남'
                        ? 'bg-black text-white'
                        : errors.gender
                        ? 'border-2 border-red-500 bg-gray-50 text-gray-600'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    남성
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, gender: '여' });
                      setErrors({ ...errors, gender: '' });
                    }}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      formData.gender === '여'
                        ? 'bg-black text-white'
                        : errors.gender
                        ? 'border-2 border-red-500 bg-gray-50 text-gray-600'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    여성
                  </button>
                </div>
                {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">생년월일</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    name="birthYear"
                    value={formData.birthYear}
                    onChange={handleChange}
                    className={`px-3 py-3 bg-gray-50 rounded-xl focus:outline-none transition-all ${
                      errors.birthDate ? 'border-2 border-red-500' : 'focus:ring-2 focus:ring-[#CDFF00]'
                    }`}
                  >
                    <option value="">년</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <select
                    name="birthMonth"
                    value={formData.birthMonth}
                    onChange={handleChange}
                    className={`px-3 py-3 bg-gray-50 rounded-xl focus:outline-none transition-all ${
                      errors.birthDate ? 'border-2 border-red-500' : 'focus:ring-2 focus:ring-[#CDFF00]'
                    }`}
                  >
                    <option value="">월</option>
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    name="birthDay"
                    value={formData.birthDay}
                    onChange={handleChange}
                    className={`px-3 py-3 bg-gray-50 rounded-xl focus:outline-none transition-all ${
                      errors.birthDate ? 'border-2 border-red-500' : 'focus:ring-2 focus:ring-[#CDFF00]'
                    }`}
                  >
                    <option value="">일</option>
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.birthDate && <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">키 (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="170"
                    className={`w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none transition-all ${
                      errors.height ? 'border-2 border-red-500' : 'focus:ring-2 focus:ring-[#CDFF00]'
                    }`}
                  />
                  {errors.height && <p className="mt-1 text-sm text-red-600">{errors.height}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">몸무게 (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="65"
                    className={`w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none transition-all ${
                      errors.weight ? 'border-2 border-red-500' : 'focus:ring-2 focus:ring-[#CDFF00]'
                    }`}
                  />
                  {errors.weight && <p className="mt-1 text-sm text-red-600">{errors.weight}</p>}
                </div>
              </div>
            </div>

            {/* 건강 정보 */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-lg font-semibold">건강 정보</h3>

              <div>
                <label className="block text-sm text-gray-600 mb-2">활동량</label>
                <select
                  name="activityLevel"
                  value={formData.activityLevel}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none transition-all ${
                    errors.activityLevel ? 'border-2 border-red-500' : 'focus:ring-2 focus:ring-[#CDFF00]'
                  }`}
                >
                  <option value="">선택해주세요</option>
                  <option value="거의 움직임 없음">거의 활동 안함 (주로 앉아있음)</option>
                  <option value="가벼운 활동">가벼운 활동 (주 1-3회 운동)</option>
                  <option value="보통 활동">보통 활동 (주 3-5회 운동)</option>
                  <option value="많은 활동">활발한 활동 (주 6-7회 운동)</option>
                  <option value="매우 많은 활동">매우 활발 (하루 2회 이상 운동)</option>
                </select>
                {errors.activityLevel && <p className="mt-1 text-sm text-red-600">{errors.activityLevel}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">식단 목표</label>
                <select
                  name="dietGoal"
                  value={formData.dietGoal}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none transition-all ${
                    errors.dietGoal ? 'border-2 border-red-500' : 'focus:ring-2 focus:ring-[#CDFF00]'
                  }`}
                >
                  <option value="">선택해주세요</option>
                  <option value="체중 감량">체중 감량</option>
                  <option value="체중 유지">체중 유지</option>
                  <option value="근육량 증가">근육량 증가</option>
                  <option value="건강 관리">건강 관리</option>
                </select>
                {errors.dietGoal && <p className="mt-1 text-sm text-red-600">{errors.dietGoal}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  알레르기 / 제한 식품 (선택사항)
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="예: 땅콩, 해산물, 유제품"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDFF00] transition-all resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors mt-8 disabled:opacity-50"
            >
              {submitting ? (isEditMode ? '수정 중...' : '저장 중...') : (isEditMode ? '수정하기' : '저장하기')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
