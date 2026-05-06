import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useIngredients } from '../hooks/useIngredients';
import { CategoryType, StorageType } from '../types/ingredient';
import { getDefaultExpiryDate } from '../utils/date';
import { ArrowLeft, Camera } from 'lucide-react';

export default function AddIngredient() {
  const navigate = useNavigate();
  const { addIngredient } = useIngredients();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('vegetable');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('개');
  const [storage, setStorage] = useState<StorageType>('refrigerated');
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [expirationDate, setExpirationDate] = useState('');
  const [useAutoExpiry, setUseAutoExpiry] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('식재료 이름을 입력해주세요');
      return;
    }

    const parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      alert('올바른 수량을 입력해주세요');
      return;
    }

    const purchase = new Date(purchaseDate);
    let expiry: Date;

    if (useAutoExpiry) {
      expiry = getDefaultExpiryDate(name, purchase);
    } else {
      if (!expirationDate) {
        alert('유통기한을 입력해주세요');
        return;
      }
      expiry = new Date(expirationDate);
      if (expiry < purchase) {
        alert('유통기한은 구매일 이후여야 합니다');
        return;
      }
    }

    addIngredient({
      name: name.trim(),
      category,
      quantity: parsedQuantity,
      unit,
      storage,
      purchaseDate: purchase,
      expirationDate: expiry,
    });

    navigate('/ingredients');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl" style={{ fontWeight: 700 }}>
          식재료 추가
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="px-5 pb-24">
        {/* 카메라 인식 버튼 (향후 구현) */}
        <div className="mb-6">
          <button
            type="button"
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 flex flex-col items-center justify-center gap-2 text-gray-400"
            onClick={() => alert('카메라 기능은 향후 업데이트 예정입니다')}
          >
            <Camera className="w-8 h-8" />
            <span className="text-sm" style={{ fontWeight: 500 }}>
              카메라로 식재료 인식하기
            </span>
          </button>
        </div>

        {/* 식재료 이름 */}
        <div className="mb-6">
          <label className="block text-sm mb-2" style={{ fontWeight: 600 }}>
            식재료 이름 *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 우유, 계란, 양상추"
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-black"
            required
          />
        </div>

        {/* 카테고리 */}
        <div className="mb-6">
          <label className="block text-sm mb-2" style={{ fontWeight: 600 }}>
            카테고리 *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryType)}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-black"
          >
            <option value="vegetable">채소</option>
            <option value="meat">육류</option>
            <option value="dairy">유제품</option>
            <option value="seafood">해산물</option>
            <option value="fruit">과일</option>
            <option value="grain">곡물</option>
            <option value="etc">기타</option>
          </select>
        </div>

        {/* 수량과 단위 */}
        <div className="mb-6">
          <label className="block text-sm mb-2" style={{ fontWeight: 600 }}>
            수량 *
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-black"
              min="0"
              step="0.1"
              required
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-24 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-black"
            >
              <option value="개">개</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="L">L</option>
              <option value="팩">팩</option>
            </select>
          </div>
        </div>

        {/* 보관 상태 */}
        <div className="mb-6">
          <label className="block text-sm mb-2" style={{ fontWeight: 600 }}>
            보관 상태 *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <StorageButton
              active={storage === 'refrigerated'}
              onClick={() => setStorage('refrigerated')}
            >
              냉장
            </StorageButton>
            <StorageButton
              active={storage === 'frozen'}
              onClick={() => setStorage('frozen')}
            >
              냉동
            </StorageButton>
            <StorageButton
              active={storage === 'room'}
              onClick={() => setStorage('room')}
            >
              실온
            </StorageButton>
          </div>
        </div>

        {/* 구매일 */}
        <div className="mb-6">
          <label className="block text-sm mb-2" style={{ fontWeight: 600 }}>
            구매일 *
          </label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-black"
            required
          />
        </div>

        {/* 유통기한 자동 설정 */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useAutoExpiry}
              onChange={(e) => setUseAutoExpiry(e.target.checked)}
              className="w-5 h-5 accent-black"
            />
            <span className="text-sm" style={{ fontWeight: 500 }}>
              유통기한 자동 설정 (식재료별 추천 기간)
            </span>
          </label>
        </div>

        {/* 유통기한 수동 입력 */}
        {!useAutoExpiry && (
          <div className="mb-6">
            <label className="block text-sm mb-2" style={{ fontWeight: 600 }}>
              유통기한 *
            </label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-black"
              required
            />
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          className="w-full rounded-xl py-4 mt-4"
          style={{ backgroundColor: '#CDFF00', fontWeight: 600 }}
        >
          추가하기
        </button>
      </form>
    </div>
  );
}

function StorageButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 rounded-xl ${
        active ? 'text-black' : 'bg-gray-100 text-gray-600'
      }`}
      style={{
        backgroundColor: active ? '#CDFF00' : undefined,
        fontWeight: active ? 600 : 500,
      }}
    >
      {children}
    </button>
  );
}
