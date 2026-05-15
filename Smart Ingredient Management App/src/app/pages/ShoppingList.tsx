import { useEffect, useState, useSyncExternalStore } from 'react';
import { useShoppingList } from '../hooks/useIngredients';
import { Plus, Trash2, ShoppingCart, Check, CheckSquare, Sparkles } from 'lucide-react';
import { isGuest } from '../utils/guestMode';
import { fridgeStore } from '../store/fridgeStore';
import { apiFetch } from '../utils/apiClient';
import GuestBlocked from '../components/GuestBlocked';

interface Suggestion {
  name: string;
  count: number;
}

export default function ShoppingList() {
  const {
    shoppingList, addShoppingItem, toggleShoppingItem, deleteShoppingItem,
    bulkDeleteShoppingItems, transferShoppingItemToIngredient,
  } = useShoppingList();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('개');
  const [transferringIds, setTransferringIds] = useState<string[]>([]);
  // 다중 선택 모드 — 카드 탭으로 토글, 하단 액션바에서 일괄 삭제.
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // 자동 제안 — 가족이 자주 비웠는데 지금 냉장고에도 없고 장보기에도 없는 식재료
  const selectedFridge = useSyncExternalStore(
    fridgeStore.subscribe.bind(fridgeStore),
    () => fridgeStore.getSelected(),
    () => fridgeStore.getSelected(),
  );
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (isGuest()) return;
    const fridgeId = selectedFridge?.id;
    let cancelled = false;
    (async () => {
      try {
        const path = fridgeId != null
          ? `/api/shopping-list/suggestions?fridgeId=${fridgeId}&limit=5`
          : '/api/shopping-list/suggestions?limit=5';
        const res = await apiFetch(path);
        if (!res.ok) return;
        const data = (await res.json()) as Suggestion[];
        if (!cancelled) setSuggestions(data);
      } catch {
        // 무시 — 다음 진입 시 다시 시도
      }
    })();
    return () => { cancelled = true; };
    // shoppingList 변경(추가/삭제) 시도 갱신 — 제안이 장보기에 들어가면 사라지도록
  }, [selectedFridge?.id, shoppingList.length]);

  const handleAddSuggestion = async (name: string) => {
    if (adding) return;
    setAdding(name);
    try {
      await addShoppingItem(name, 1, '개');
      // 추가하면 useEffect에서 shoppingList.length 변경으로 suggestions 자동 재요청
    } finally {
      setAdding(null);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('상품 이름을 입력해주세요');
      return;
    }
    const parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      alert('올바른 수량을 입력해주세요');
      return;
    }
    addShoppingItem(name.trim(), parsedQuantity, unit);
    setName('');
    setQuantity('1');
    setUnit('개');
    setShowAddForm(false);
  };

  const uncheckedItems = shoppingList.filter((item) => !item.checked);
  const checkedItems = shoppingList.filter((item) => item.checked);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const enterSelectionMode = () => {
    setSelectionMode(true);
    setSelectedIds(new Set());
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const selectAll = () => {
    setSelectedIds(new Set(shoppingList.map((i) => i.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size}개의 장보기 항목을 삭제하시겠습니까?`)) return;
    setDeleting(true);
    try {
      await bulkDeleteShoppingItems(Array.from(selectedIds));
      exitSelectionMode();
    } finally {
      setDeleting(false);
    }
  };

  const handleTransfer = async (id: string, name: string) => {
    if (transferringIds.includes(id)) return;
    setTransferringIds((prev) => [...prev, id]);

    try {
      await transferShoppingItemToIngredient(id);
      alert(`${name}을(를) 냉장고로 이관했습니다`);
    } catch (error) {
      console.error('이관 실패:', error);
      alert('냉장고 이관에 실패했습니다. 백엔드 API 경로를 확인해주세요.');
    } finally {
      setTransferringIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  if (isGuest()) return <GuestBlocked feature="장보기" />;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-4">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl" style={{ fontWeight: 700 }}>
            장보기 리스트
          </h1>
          {selectionMode && (
            <button
              type="button"
              onClick={exitSelectionMode}
              className="text-sm text-gray-600 hover:text-black"
              style={{ fontWeight: 600 }}
            >
              취소
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {selectionMode
            ? `${selectedIds.size}개 선택됨`
            : `총 ${shoppingList.length}개 · 완료 ${checkedItems.length}개`}
        </p>
      </div>

      {/* 선택 모드 액션 바 또는 추가 버튼 */}
      <div className="px-5 pb-4">
        {selectionMode ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm"
              style={{ fontWeight: 600 }}
            >
              전체 선택 ({shoppingList.length})
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0 || deleting}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm disabled:bg-red-200"
              style={{ fontWeight: 600 }}
            >
              {deleting ? '삭제 중...' : `${selectedIds.size}개 삭제`}
            </button>
          </div>
        ) : !showAddForm ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex-1 rounded-xl py-4 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#CDFF00', fontWeight: 600 }}
            >
              <Plus className="w-5 h-5" />
              항목 추가하기
            </button>
            <button
              type="button"
              onClick={enterSelectionMode}
              disabled={shoppingList.length === 0}
              className="rounded-xl py-4 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="선택"
            >
              <CheckSquare className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleAdd} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <div className="mb-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="상품 이름"
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-black"
                autoFocus
              />
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="flex-1 px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-black"
                min="0"
                step="0.1"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-24 px-4 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-black"
              >
                <option value="개">개</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="L">L</option>
                <option value="팩">팩</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl"
                style={{ backgroundColor: '#CDFF00', fontWeight: 600 }}
              >
                추가
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setName('');
                  setQuantity('1');
                  setUnit('개');
                }}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
                style={{ fontWeight: 600 }}
              >
                취소
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 자동 제안 — 가족이 자주 비웠는데 지금 없는 식재료 */}
      {!selectionMode && !showAddForm && suggestions.length > 0 && (
        <div className="px-5 pb-4">
          <div className="bg-gradient-to-br from-lime-50 to-white dark:from-lime-900/30 dark:to-gray-800 rounded-2xl p-4 border border-lime-200 dark:border-lime-800/50">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-lime-700" />
              <h3 className="text-sm" style={{ fontWeight: 600 }}>이건 어때요?</h3>
              <span className="text-xs text-gray-500">자주 비우는데 지금 없어요</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {suggestions.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => handleAddSuggestion(s.name)}
                  disabled={adding === s.name}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-lime-200 dark:border-lime-800/50 hover:bg-lime-50 dark:hover:bg-lime-900/30 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5 text-lime-700" />
                  <span className="text-sm" style={{ fontWeight: 600 }}>{s.name}</span>
                  <span className="text-xs text-gray-400">{s.count}회</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 리스트 */}
      {shoppingList.length === 0 ? (
        <div className="text-center py-12 px-5">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 mb-1">장보기 리스트가 비어있습니다</p>
          <p className="text-xs text-gray-400">필요한 항목을 추가해보세요</p>
        </div>
      ) : (
        <div className="px-5">
          {/* 미완료 항목 */}
          {uncheckedItems.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg mb-3" style={{ fontWeight: 600 }}>
                구매할 항목 ({uncheckedItems.length})
              </h2>
              <div className="space-y-2">
                {uncheckedItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={selectionMode ? () => toggleSelection(item.id) : undefined}
                      className={`rounded-xl p-4 flex items-center gap-3 transition-colors ${
                        selectionMode
                          ? isSelected
                            ? 'bg-green-50 dark:bg-green-900/30 border-2 border-[#CDFF00] cursor-pointer'
                            : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent cursor-pointer'
                          : 'bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      {selectionMode ? (
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 flex-shrink-0 ${
                          isSelected ? 'bg-[#CDFF00] border-[#CDFF00]' : 'bg-white border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleShoppingItem(item.id)}
                          className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 hover:border-lime-500 transition-colors"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-base" style={{ fontWeight: 600 }}>
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {item.quantity}
                          {item.unit}
                        </p>
                      </div>
                      {!selectionMode && (
                        <>
                          <button
                            onClick={() => deleteShoppingItem(item.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5 text-red-500" />
                          </button>
                          <button
                            onClick={() => handleTransfer(item.id, item.name)}
                            disabled={transferringIds.includes(item.id)}
                            className="px-3 py-2 text-xs rounded-lg bg-[#CDFF00] hover:bg-[#b8e600] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ fontWeight: 600 }}
                          >
                            {transferringIds.includes(item.id) ? '이관 중...' : '냉장고 이관'}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 완료 항목 */}
          {checkedItems.length > 0 && (
            <div>
              <h2 className="text-lg mb-3 text-gray-500" style={{ fontWeight: 600 }}>
                구매 완료 ({checkedItems.length})
              </h2>
              <div className="space-y-2">
                {checkedItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={selectionMode ? () => toggleSelection(item.id) : undefined}
                      className={`rounded-xl p-4 flex items-center gap-3 transition-colors ${
                        selectionMode
                          ? isSelected
                            ? 'bg-green-50 dark:bg-green-900/30 border-2 border-[#CDFF00] cursor-pointer'
                            : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent cursor-pointer opacity-60'
                          : 'bg-gray-50 dark:bg-gray-800 opacity-60'
                      }`}
                    >
                      {selectionMode ? (
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 flex-shrink-0 ${
                          isSelected ? 'bg-[#CDFF00] border-[#CDFF00]' : 'bg-white border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleShoppingItem(item.id)}
                          className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: '#CDFF00' }}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <div className="flex-1">
                        <h3
                          className="text-base line-through text-gray-500"
                          style={{ fontWeight: 500 }}
                        >
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {item.quantity}
                          {item.unit}
                        </p>
                      </div>
                      {!selectionMode && (
                        <button
                          onClick={() => deleteShoppingItem(item.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}