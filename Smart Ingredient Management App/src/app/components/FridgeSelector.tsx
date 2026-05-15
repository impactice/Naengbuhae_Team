import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Refrigerator, ChevronDown, Check, Settings } from 'lucide-react';
import { useFridges } from '../hooks/useFridges';

// 현재 선택된 냉장고를 표시하고, 클릭하면 다른 냉장고로 전환할 수 있는 칩 + 드롭다운.
// 메인 페이지(Home/Ingredients/Priority)의 헤더 우측에 배치.
export default function FridgeSelector() {
  const { fridges, selected, select } = useFridges();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:opacity-80 rounded-full transition-colors"
      >
        <Refrigerator className="w-3.5 h-3.5" />
        <span className="text-sm" style={{ fontWeight: 600 }}>
          {selected?.name ?? '냉장고 없음'}
        </span>
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-popover text-popover-foreground rounded-xl shadow-lg border border-border z-50 overflow-hidden">
          <div className="px-4 pt-3 pb-1 text-xs text-muted-foreground" style={{ fontWeight: 600 }}>
            냉장고 전환
          </div>
          <div className="max-h-72 overflow-y-auto">
            {fridges.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                냉장고가 없습니다
              </div>
            ) : (
              fridges.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    select(f.id);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 flex items-center gap-2 hover:bg-secondary text-left ${
                    f.id === selected?.id ? 'bg-secondary' : ''
                  }`}
                >
                  <Refrigerator
                    className={`w-4 h-4 ${
                      f.id === selected?.id ? 'text-accent' : 'text-muted-foreground'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ fontWeight: f.id === selected?.id ? 700 : 500 }}>
                      {f.name}
                    </div>
                  </div>
                  {f.id === selected?.id && (
                    <Check className="w-4 h-4 text-accent" />
                  )}
                </button>
              ))
            )}
          </div>
          <div className="border-t border-border">
            <Link
              to="/fridges"
              onClick={() => setOpen(false)}
              className="w-full px-4 py-3 flex items-center gap-2 hover:bg-secondary"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm" style={{ fontWeight: 600 }}>
                냉장고 관리
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
