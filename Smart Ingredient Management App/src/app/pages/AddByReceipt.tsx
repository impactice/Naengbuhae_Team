import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useIngredients } from '../hooks/useIngredients';
import { CategoryType, StorageType } from '../types/ingredient';
import { ArrowLeft, Camera, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { apiUpload } from '../utils/apiClient';
import { isGuest } from '../utils/guestMode';
import GuestBlocked from '../components/GuestBlocked';

const CATEGORIES_KO = ['채소', '육류', '유제품', '곡물', '해산물', '과일',
    '가공식품', '음료', '조미료', '간식', '기타'] as const;
const STORAGES_KO = ['냉장', '냉동', '실온'] as const;
const UNITS = ['개', 'g', 'kg', 'ml', 'L', '팩'] as const;

const KO_TO_CATEGORY: Record<string, CategoryType> = {
  '채소': 'vegetable', '육류': 'meat', '유제품': 'dairy',
  '곡물': 'grain', '해산물': 'seafood', '과일': 'fruit',
  '가공식품': 'processed', '음료': 'beverage', '조미료': 'condiment',
  '간식': 'snack', '기타': 'etc',
};
const KO_TO_STORAGE: Record<string, StorageType> = {
  '냉장': 'refrigerated', '냉동': 'frozen', '실온': 'room',
};

interface ReceiptItem {
  selected: boolean;
  name: string;
  categoryKo: string;
  storageKo: string;
  quantity: string;
  unit: string;
  expiryDaysByStorage: Record<string, number>;
}

function getExpiryDays(item: ReceiptItem): number {
  const d = item.expiryDaysByStorage[item.storageKo] ?? 0;
  return d > 0 ? d : 7;
}

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function AddByReceipt() {
  const navigate = useNavigate();
  const { addIngredient } = useIngredients();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recognizing, setRecognizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<ReceiptItem[]>([]);

  const pickFile = () => fileInputRef.current?.click();

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRecognizing(true);
    setItems([]);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await apiUpload('/api/ingredients/recognize-receipt', formData);

      if (res.status === 200) {
        const data = await res.json();
        const raw = (data.items ?? []) as Array<{
          name: string;
          category: string;
          storage: string;
          quantity: number;
          unit: string;
          expiryDaysByStorage: Record<string, number>;
        }>;
        const parsed: ReceiptItem[] = raw
          .filter((r) => r.name && r.name.trim())
          .map((r) => ({
            selected: true,
            name: r.name,
            categoryKo: CATEGORIES_KO.includes(r.category as typeof CATEGORIES_KO[number])
              ? r.category : '기타',
            storageKo: STORAGES_KO.includes(r.storage as typeof STORAGES_KO[number])
              ? r.storage : '냉장',
            quantity: r.quantity != null ? String(r.quantity) : '1',
            unit: UNITS.includes(r.unit as typeof UNITS[number]) ? r.unit : '개',
            expiryDaysByStorage: r.expiryDaysByStorage ?? {},
          }));
        setItems(parsed);
        if (parsed.length === 0) {
          alert('영수증에서 식재료를 찾지 못했습니다');
        }
      } else if (res.status === 404) {
        alert('AI 인식 기능 준비 중입니다');
      } else {
        alert(`인식 실패 (${res.status})`);
      }
    } catch {
      alert('서버 연결 실패');
    } finally {
      setRecognizing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateItem = (idx: number, patch: Partial<ReceiptItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveAll = async () => {
    const selected = items.filter((i) => i.selected);
    if (selected.length === 0) {
      alert('저장할 항목을 선택해주세요');
      return;
    }
    setSaving(true);
    let ok = 0;
    let fail = 0;
    const today = new Date();
    for (const item of selected) {
      const qty = parseFloat(item.quantity);
      if (isNaN(qty) || qty <= 0 || !item.name.trim()) {
        fail++;
        continue;
      }
      try {
        await addIngredient({
          name: item.name.trim(),
          category: KO_TO_CATEGORY[item.categoryKo],
          quantity: qty,
          unit: item.unit,
          storage: KO_TO_STORAGE[item.storageKo],
          purchaseDate: today,
          expirationDate: new Date(todayPlus(getExpiryDays(item))),
        });
        ok++;
      } catch {
        fail++;
      }
    }
    setSaving(false);
    if (fail === 0) {
      alert(`${ok}개 식재료를 추가했어요`);
      navigate('/ingredients');
    } else {
      alert(`${ok}개 추가 / ${fail}개 실패`);
      if (ok > 0) navigate('/ingredients');
    }
  };

  const selectedCount = items.filter((i) => i.selected).length;

  if (isGuest()) return <GuestBlocked feature="영수증 인식" />;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-40">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl flex-1" style={{ fontWeight: 700 }}>
          영수증으로 추가
        </h1>
        {items.length > 0 && !recognizing && (
          <button onClick={pickFile} className="p-1" title="다시 촬영">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />

      {recognizing ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <Loader2 className="w-10 h-10 animate-spin mb-3" />
          <p style={{ fontWeight: 500 }}>AI가 영수증을 분석 중...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <Camera className="w-16 h-16 text-gray-300 mb-3" />
          <p className="text-gray-600 mb-4" style={{ fontWeight: 500 }}>
            영수증 사진을 선택해주세요
          </p>
          <button
            onClick={pickFile}
            className="px-6 py-3 rounded-xl"
            style={{ backgroundColor: '#CDFF00', fontWeight: 600 }}
          >
            영수증 촬영/선택
          </button>
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-3 border ${
                item.selected
                  ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800/50'
              }`}
            >
              {/* 상단: 체크박스 + 이름 + 삭제 */}
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={(e) => updateItem(idx, { selected: e.target.checked })}
                  className="w-5 h-5 accent-black"
                />
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(idx, { name: e.target.value })}
                  disabled={!item.selected}
                  placeholder="이름"
                  className="flex-1 px-2 py-1 bg-transparent border-0 focus:outline-none disabled:opacity-50"
                  style={{ fontWeight: 600, fontSize: '15px' }}
                />
                <button
                  onClick={() => removeItem(idx)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* 하단: 분류 / 보관 / 수량 / 단위 */}
              {item.selected && (
                <>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <select
                      value={item.categoryKo}
                      onChange={(e) => updateItem(idx, { categoryKo: e.target.value })}
                      className="px-2 py-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-black"
                    >
                      {CATEGORIES_KO.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select
                      value={item.storageKo}
                      onChange={(e) => updateItem(idx, { storageKo: e.target.value })}
                      className="px-2 py-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-black"
                    >
                      {STORAGES_KO.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                      className="px-2 py-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-black"
                    />
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(idx, { unit: e.target.value })}
                      className="px-2 py-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-black"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    유통기한: {todayPlus(getExpiryDays(item))} ({getExpiryDays(item)}일)
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 하단 고정 저장 버튼 (하단 네비 위에 위치하도록 bottom-16) */}
      {items.length > 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4">
          <button
            onClick={saveAll}
            disabled={saving}
            className="w-full py-4 rounded-xl disabled:opacity-60"
            style={{ backgroundColor: '#CDFF00', fontWeight: 700 }}
          >
            {saving ? '저장 중...' : `선택한 ${selectedCount}개 추가하기`}
          </button>
        </div>
      )}
    </div>
  );
}
