import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';

export default function SignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    height: '',
    weight: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    activityLevel: '',
    dietGoal: '',
    allergies: '',
  });

  // 에러 상태
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // 유효성 검사
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요';
    }
    if (!formData.birthYear || !formData.birthMonth || !formData.birthDay) {
      newErrors.birthDate = '생년월일을 모두 선택해주세요';
    }
    if (!formData.height || parseFloat(formData.height) <= 0) {
      newErrors.height = '올바른 키를 입력해주세요';
    }
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      newErrors.weight = '올바른 몸무게를 입력해주세요';
    }
    if (!formData.activityLevel) {
      newErrors.activityLevel = '활동량을 선택해주세요';
    }
    if (!formData.dietGoal) {
      newErrors.dietGoal = '식단 목표를 선택해주세요';
    }
    if (!formData.email || !formData.email.includes('@')) {
      newErrors.email = '올바른 이메일을 입력해주세요';
    }
    if (!formData.username || formData.username.length < 6) {
      newErrors.username = '아이디는 6자 이상이어야 합니다';
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // 첫 번째 에러 필드로 스크롤 & 포커스
      const firstErrorField = Object.keys(newErrors)[0];
      const focusFieldName = firstErrorField === 'birthDate' ? 'birthYear' : firstErrorField;
      const element = document.querySelector(`[name="${focusFieldName}"]`) as HTMLElement;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    try {
      // 생년월일 조합
      const birthDate = `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`;

      // 회원가입 API 요청
      const response = await fetch('http://localhost:8080/user/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          name: formData.name,
          gender: formData.gender,
          birthDate: birthDate,
          height: parseFloat(formData.height),
          weight: parseFloat(formData.weight),
          activityLevel: formData.activityLevel,
          dietGoal: formData.dietGoal,
          allergies: formData.allergies,
        }),
      });

      if (response.ok) {
        alert('회원가입이 완료되었습니다!');
        navigate('/login');
      } else {
        const error = await response.text();
        setErrors({ submit: `회원가입 실패: ${error}` });
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      setErrors({ submit: '회원가입 중 오류가 발생했습니다. 서버 연결을 확인해주세요.' });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // 입력 시 해당 필드 에러 제거
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // 년도 옵션 (1924 ~ 2024)
  const years = Array.from({ length: 101 }, (_, i) => 2024 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center z-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="ml-2 text-xl" style={{ fontWeight: 700 }}>
            회원가입
          </h1>
        </div>

        <div ref={formRef} className="px-6 py-8 pb-12">
          {/* 환영 메시지 */}
          <div className="mb-8">
            <h2 className="text-2xl mb-2" style={{ fontWeight: 700 }}>
              건강한 식습관의 시작
            </h2>
            <p className="text-gray-500">
              당신만을 위한 맞춤 식재료 관리와<br />
              건강한 식단을 추천해드립니다
            </p>
          </div>

          {/* 전체 에러 메시지 */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">기본 정보</h3>

              {/* 이름 */}
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

              {/* 성별 */}
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

              {/* 생년월일 */}
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
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
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
                    {months.map((month) => (
                      <option key={month} value={month}>
                        {month}
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
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.birthDate && <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>}
              </div>

              {/* 키/몸무게 */}
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

              {/* 활동량 */}
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

              {/* 식단 목표 */}
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

              {/* 알레르기 */}
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

            {/* 계정 정보 */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-lg font-semibold">계정 정보</h3>

              {/* 이메일 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">이메일</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className={`w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none transition-all ${
                    errors.email ? 'border-2 border-red-500' : 'focus:ring-2 focus:ring-[#CDFF00]'
                  }`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* 아이디 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">아이디</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="영문, 숫자 조합 6자 이상"
                  className={`w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none transition-all ${
                    errors.username ? 'border-2 border-red-500' : 'focus:ring-2 focus:ring-[#CDFF00]'
                  }`}
                />
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
              </div>

              {/* 비밀번호 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">비밀번호</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="영문, 숫자, 특수문자 조합 8자 이상"
                    className={`w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none transition-all pr-12 ${
                      errors.password ? 'border-2 border-red-500' : 'focus:ring-2 focus:ring-[#CDFF00]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">비밀번호 확인</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="비밀번호를 다시 입력해주세요"
                    className={`w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none transition-all pr-12 ${
                      errors.confirmPassword ? 'border-2 border-red-500' : 'focus:ring-2 focus:ring-[#CDFF00]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* 가입하기 버튼 */}
            <button
              type="submit"
              className="w-full py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors mt-8"
            >
              가입하기
            </button>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <span className="text-gray-500">이미 계정이 있으신가요? </span>
            <Link to="/login" className="font-semibold hover:underline">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
