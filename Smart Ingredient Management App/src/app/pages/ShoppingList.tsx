import { useState } from 'react';
import { useShoppingList } from '../hooks/useIngredients';
import { Plus, Trash2, ShoppingCart, Check } from 'lucide-react';

export default function ShoppingList() {
  const { shoppingList, addShoppingItem, toggleShoppingItem, deleteShoppingItem } =
    useShoppingList();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('개');

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

  return (
    <div className="min-h-screen bg-white pb-4">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl" style={{ fontWeight: 700 }}>
          장보기 리스트
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          총 {shoppingList.length}개 · 완료 {checkedItems.length}개
        </p>
      </div>

      {/* 추가 버튼 */}
      <div className="px-5 pb-4">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full rounded-xl py-4 flex items-center justify-center gap-2 relative overflow-hidden"
            style={{ backgroundColor: '#CDFF00', fontWeight: 600 }}
          >
            <Plus className="w-5 h-5" />
            항목 추가하기
          </button>
        ) : (
          <form onSubmit={handleAdd} className="bg-gray-50 rounded-xl p-4">
            <div className="mb-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="상품 이름"
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-black"
                autoFocus
              />
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="flex-1 px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-black"
                min="0"
                step="0.1"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-24 px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-black"
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
                className="flex-1 py-3 bg-gray-100 rounded-xl"
                style={{ fontWeight: 600 }}
              >
                취소
              </button>
            </div>
          </form>
        )}
      </div>

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
                {uncheckedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-xl p-4 flex items-center gap-3"
                  >
                    <button
                      onClick={() => toggleShoppingItem(item.id)}
                      className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 hover:border-lime-500 transition-colors"
                    />
                    <div className="flex-1">
                      <h3 className="text-base" style={{ fontWeight: 600 }}>
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.quantity}
                        {item.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteShoppingItem(item.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                ))}
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
                {checkedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 opacity-60"
                  >
                    <button
                      onClick={() => toggleShoppingItem(item.id)}
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: '#CDFF00' }}
                    >
                      <Check className="w-4 h-4" />
                    </button>
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
                    <button
                      onClick={() => deleteShoppingItem(item.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}