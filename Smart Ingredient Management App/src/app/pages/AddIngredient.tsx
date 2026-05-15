import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useIngredients } from '../hooks/useIngredients';
import { CategoryType, StorageType } from '../types/ingredient';
import { getDefaultExpiryDate } from '../utils/date';
import { ArrowLeft, Camera, X, Loader2, Receipt, ChevronRight } from 'lucide-react';
import { apiUpload } from '../utils/apiClient';
import { Link } from 'react-router';

// 한글 라벨 ↔ 내부 코드 매핑 (AI 인식 응답이 한글 라벨로 옴)
const KO_TO_CATEGORY: Record<string, CategoryType> = {
  '채소': 'vegetable', '육류': 'meat', '유제품': 'dairy',
  '곡물': 'grain', '해산물': 'seafood', '과일': 'fruit',
  '가공식품': 'processed', '음료': 'beverage', '조미료': 'condiment',
  '간식': 'snack', '기타': 'etc',
};
const KO_TO_STORAGE: Record<string, StorageType> = {
  '냉장': 'refrigerated', '냉동': 'frozen', '실온': 'room',
};

// 식재료 이름 → 카테고리/보관 추천 (사진 없을 때 빠른 자동 채움)
const NAME_TO_DEFAULT: Record<string, { category: CategoryType; storage: StorageType }> = {
  '상추': { category: 'vegetable', storage: 'refrigerated' },
  '양상추': { category: 'vegetable', storage: 'refrigerated' },
  '양배추': { category: 'vegetable', storage: 'refrigerated' },
  '당근': { category: 'vegetable', storage: 'refrigerated' },
  '오이': { category: 'vegetable', storage: 'refrigerated' },
  '토마토': { category: 'vegetable', storage: 'refrigerated' },
  '감자': { category: 'vegetable', storage: 'room' },
  '고구마': { category: 'vegetable', storage: 'room' },
  '브로콜리': { category: 'vegetable', storage: 'refrigerated' },
  '시금치': { category: 'vegetable', storage: 'refrigerated' },
  '대파': { category: 'vegetable', storage: 'refrigerated' },
  '양파': { category: 'vegetable', storage: 'room' },
  '마늘': { category: 'vegetable', storage: 'room' },
  '소고기': { category: 'meat', storage: 'refrigerated' },
  '돼지고기': { category: 'meat', storage: 'refrigerated' },
  '닭고기': { category: 'meat', storage: 'refrigerated' },
  '닭가슴살': { category: 'meat', storage: 'refrigerated' },
  '햄': { category: 'meat', storage: 'refrigerated' },
  '베이컨': { category: 'meat', storage: 'refrigerated' },
  '소시지': { category: 'meat', storage: 'refrigerated' },
  '우유': { category: 'dairy', storage: 'refrigerated' },
  '요거트': { category: 'dairy', storage: 'refrigerated' },
  '치즈': { category: 'dairy', storage: 'refrigerated' },
  '버터': { category: 'dairy', storage: 'refrigerated' },
  '생선': { category: 'seafood', storage: 'refrigerated' },
  '새우': { category: 'seafood', storage: 'frozen' },
  '오징어': { category: 'seafood', storage: 'frozen' },
  '연어': { category: 'seafood', storage: 'refrigerated' },
  '사과': { category: 'fruit', storage: 'refrigerated' },
  '배': { category: 'fruit', storage: 'refrigerated' },
  '바나나': { category: 'fruit', storage: 'room' },
  '딸기': { category: 'fruit', storage: 'refrigerated' },
  '포도': { category: 'fruit', storage: 'refrigerated' },
  '귤': { category: 'fruit', storage: 'refrigerated' },
  '쌀': { category: 'grain', storage: 'room' },
  '식빵': { category: 'grain', storage: 'room' },
  '라면': { category: 'grain', storage: 'room' },
  '계란': { category: 'etc', storage: 'refrigerated' },
  '두부': { category: 'etc', storage: 'refrigerated' },
  '만두': { category: 'etc', storage: 'frozen' },
  '아이스크림': { category: 'etc', storage: 'frozen' },
};

export default function AddIngredient() {
  const navigate = useNavigate();
  const { addIngredient } = useIngredients();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  // AI가 알려준 보관별 권장 일수. 보관 버튼 바꾸면 이걸로 유통기한 재계산.
  const [expiryDaysByStorage, setExpiryDaysByStorage] = useState<Record<string, number> | null>(null);

  const handleNameChange = (v: string) => {
    setName(v);
    const d = NAME_TO_DEFAULT[v.trim()];
    if (d) {
      setCategory(d.category);
      setStorage(d.storage);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setRecognizing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await apiUpload('/api/ingredients/recognize', formData);

      if (res.status === 200) {
        const data = await res.json();
        const r = data.recognized;
        if (r) {
          if (r.name) setName(r.name);
          if (r.category && KO_TO_CATEGORY[r.category]) setCategory(KO_TO_CATEGORY[r.category]);
          if (r.storage && KO_TO_STORAGE[r.storage]) setStorage(KO_TO_STORAGE[r.storage]);
          if (r.quantity != null) setQuantity(String(r.quantity));
          if (r.unit) setUnit(r.unit);
          // AI가 보관별 권장 일수를 알려준 경우 → 저장해두고 추천 보관에 맞춰 유통기한 세팅.
          // 사용자가 보관 버튼 바꾸면 별도 effect에서 재계산.
          if (r.expiryDaysByStorage && typeof r.expiryDaysByStorage === 'object') {
            const days = r.expiryDaysByStorage;
            setExpiryDaysByStorage(days);
            const koStorage = r.storage as string | undefined;
            const initial = koStorage ? days[koStorage] : null;
            if (typeof initial === 'number' && initial > 0) {
              const purchase = new Date(purchaseDate);
              const expiry = new Date(purchase);
              expiry.setDate(expiry.getDate() + initial);
              setExpirationDate(expiry.toISOString().split('T')[0]);
              setUseAutoExpiry(false);
            }
          }
        }
      } else if (res.status === 404) {
        alert('AI 인식 기능 준비 중입니다. 직접 입력해주세요');
      } else {
        alert(`인식 실패 (${res.status}). 직접 입력해주세요`);
      }
    } catch {
      alert('서버 연결 실패. 직접 입력해주세요');
    } finally {
      setRecognizing(false);
      // 같은 파일을 다시 고를 수 있게 input value 리셋
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setImagePreview(null);
  };

  // StorageType ↔ 한글 라벨 (expiryDaysByStorage 맵은 한글 키를 사용)
  const STORAGE_TO_KO_LABEL: Record<StorageType, string> = {
    refrigerated: '냉장',
    frozen: '냉동',
    room: '실온',
  };

  // 보관 버튼 변경 시 호출. expiryDaysByStorage가 있으면 그 일수로 유통기한 갱신.
  const handleStorageChange = (newStorage: StorageType) => {
    setStorage(newStorage);
    if (!expiryDaysByStorage) return;
    const days = expiryDaysByStorage[STORAGE_TO_KO_LABEL[newStorage]];
    if (typeof days === 'number' && days > 0) {
      const purchase = new Date(purchaseDate);
      const expiry = new Date(purchase);
      expiry.setDate(expiry.getDate() + days);
      setExpirationDate(expiry.toISOString().split('T')[0]);
      setUseAutoExpiry(false);
    }
  };

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
    <div className="min-h-screen bg-background">
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
        {/* 영수증으로 일괄 추가 진입 */}
        <Link
          to="/add-by-receipt"
          className="mb-4 flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:border-border-strong transition-colors"
        >
          <Receipt className="w-5 h-5 text-accent" />
          <span className="flex-1 text-sm" style={{ fontWeight: 600 }}>
            영수증으로 여러 개 한 번에 추가
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>

        {/* 사진 첨부 (선택). 모바일 브라우저는 카메라 옵션, 데스크탑은 파일 선택. */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          {!imagePreview ? (
            <button
              type="button"
              className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-gray-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-8 h-8" />
              <span className="text-sm" style={{ fontWeight: 500 }}>
                사진으로 식재료 인식하기 (선택)
              </span>
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden">
              <img src={imagePreview} alt="선택한 식재료" className="w-full h-48 object-cover" />
              {recognizing && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm" style={{ fontWeight: 500 }}>AI가 식재료를 인식 중...</span>
                </div>
              )}
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5"
                aria-label="사진 제거"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 식재료 이름 */}
        <div className="mb-6">
          <label className="block text-sm mb-2" style={{ fontWeight: 600 }}>
            식재료 이름 *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="예: 우유, 계란, 양상추"
            className="w-full px-4 py-3 bg-card border border-border rounded-xl border border-border focus:outline-none focus:border-black"
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
            className="w-full px-4 py-3 bg-card border border-border rounded-xl border border-border focus:outline-none focus:border-black"
          >
            <option value="vegetable">채소</option>
            <option value="meat">육류</option>
            <option value="dairy">유제품</option>
            <option value="grain">곡물</option>
            <option value="seafood">해산물</option>
            <option value="fruit">과일</option>
            <option value="processed">가공식품</option>
            <option value="beverage">음료</option>
            <option value="condiment">조미료</option>
            <option value="snack">간식</option>
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
              className="flex-1 px-4 py-3 bg-card border border-border rounded-xl border border-border focus:outline-none focus:border-black"
              min="0"
              step="0.1"
              required
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-24 px-4 py-3 bg-card border border-border rounded-xl border border-border focus:outline-none focus:border-black"
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
              onClick={() => handleStorageChange('refrigerated')}
            >
              냉장
            </StorageButton>
            <StorageButton
              active={storage === 'frozen'}
              onClick={() => handleStorageChange('frozen')}
            >
              냉동
            </StorageButton>
            <StorageButton
              active={storage === 'room'}
              onClick={() => handleStorageChange('room')}
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
            className="w-full px-4 py-3 bg-card border border-border rounded-xl border border-border focus:outline-none focus:border-black"
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
              className="w-full px-4 py-3 bg-card border border-border rounded-xl border border-border focus:outline-none focus:border-black"
              required
            />
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          className="w-full rounded-xl py-4 mt-4"
          style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 600 }}
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
        active ? 'text-black' : 'bg-secondary text-muted-foreground'
      }`}
      style={{
        backgroundColor: active ? 'var(--accent)' : undefined,
        fontWeight: active ? 600 : 500,
      }}
    >
      {children}
    </button>
  );
}
