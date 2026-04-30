import { useState } from 'react';
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
    birthDate: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    activityLevel: '',
    dietGoal: '',
    allergies: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          gender: formData.gender,
          birthDate: formData.birthDate,
          height: parseInt(formData.height),
          weight: parseInt(formData.weight),
          email: formData.email,
          activityLevel: formData.activityLevel,
          dietGoal: formData.dietGoal,
          allergies: formData.allergies || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        navigate('/login');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('회원가입 실패:', error);
      alert('서버 연결 실패');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center">
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

      <div className="px-6 py-8 pb-12">
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
                required
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDFF00] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">성별</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: '남성' })}
                  className={`py-3 rounded-xl font-semibold transition-all ${
                    formData.gender === '남성'
                      ? 'bg-black text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  남성
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: '여성' })}
                  className={`py-3 rounded-xl font-semibold transition-all ${
                    formData.gender === '여성'
                      ? 'bg-black text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  여성
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">생년월일</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDFF00] transition-all"
              />
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
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDFF00] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">몸무게 (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="65"
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDFF00] transition-all"
                />
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
                required
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDFF00] transition-all"
              >
                <option value="">선택해주세요</option>
                <option value="sedentary">거의 활동 안함 (주로 앉아있음)</option>
                <option value="light">가벼운 활동 (주 1-3회 운동)</option>
                <option value="moderate">보통 활동 (주 3-5회 운동)</option>
                <option value="active">활발한 활동 (주 6-7회 운동)</option>
                <option value="very-active">매우 활발 (하루 2회 이상 운동)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">식단 목표</label>
              <select
                name="dietGoal"
                value={formData.dietGoal}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDFF00] transition-all"
              >
                <option value="">선택해주세요</option>
                <option value="weight-loss">체중 감량</option>
                <option value="maintain">현재 체중 유지</option>
                <option value="muscle-gain">근육 증량</option>
                <option value="health">건강한 식습관</option>
              </select>
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

          {/* 계정 정보 */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-lg font-semibold">계정 정보</h3>

            <div>
              <label className="block text-sm text-gray-600 mb-2">이메일</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                required
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDFF00] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">아이디</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="영문, 숫자 조합 6자 이상"
                required
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDFF00] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">비밀번호</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="영문, 숫자, 특수문자 조합 8자 이상"
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDFF00] transition-all pr-12"
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
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">비밀번호 확인</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="비밀번호를 다시 입력해주세요"
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDFF00] transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
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
          <Link
            to="/login"
            className="font-semibold hover:underline"
          >
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
