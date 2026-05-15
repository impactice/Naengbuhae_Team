import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Plus, KeyRound, Refrigerator, User, Edit2,
  Trash2, Share2, LogOut, Copy, X, ChevronRight, Users,
} from 'lucide-react';
import { useFridges } from '../hooks/useFridges';
import { useUserProfile } from '../hooks/useUserProfile';
import type { Fridge } from '../store/fridgeStore';
import { isGuest } from '../utils/guestMode';
import GuestBlocked from '../components/GuestBlocked';

// 텍스트 입력 모달용 설정. 모든 prompt 케이스가 이 한 모달을 공유.
interface TextPromptConfig {
  title: string;
  subtitle?: string;
  placeholder?: string;
  initial?: string;
  maxLength: number;
  uppercase?: boolean; // 초대 코드: 자동 대문자화 + 큰 글자
  submitLabel: string;
  onSubmit: (value: string) => void;
}

export default function FridgeManagement() {
  const navigate = useNavigate();
  const f = useFridges();
  const { profile } = useUserProfile();
  const myUsername = profile?.username ?? null;
  const [working, setWorking] = useState(false);
  const [inviteCode, setInviteCode] = useState<{ code: string; fridgeName: string } | null>(null);
  const [textPrompt, setTextPrompt] = useState<TextPromptConfig | null>(null);
  // 상세 모달에 보여줄 냉장고 id. 항상 최신 데이터를 보여주기 위해 id만 들고 store에서 재참조.
  const [detailId, setDetailId] = useState<number | null>(null);
  const detail = detailId != null ? f.fridges.find((x) => x.id === detailId) ?? null : null;

  const safe = async (fn: () => Promise<void>) => {
    if (working) return;
    setWorking(true);
    try { await fn(); } catch (e) { alert((e as Error).message); } finally { setWorking(false); }
  };

  const handleCreate = () => {
    setTextPrompt({
      title: '새 냉장고',
      subtitle: '어떤 냉장고를 만들까요?',
      placeholder: '예: 김치냉장고, 부모님댁',
      maxLength: 50,
      submitLabel: '만들기',
      onSubmit: (name) => safe(() => f.create(name)),
    });
  };

  const handleJoin = () => {
    setTextPrompt({
      title: '코드로 가입',
      subtitle: '6자리 초대 코드를 입력하세요',
      placeholder: 'ABCD12',
      maxLength: 6,
      uppercase: true,
      submitLabel: '가입',
      onSubmit: (code) => safe(() => f.join(code)),
    });
  };

  const handleRename = (fridge: Fridge) => {
    setTextPrompt({
      title: '이름 변경',
      initial: fridge.name,
      placeholder: '새 이름',
      maxLength: 50,
      submitLabel: '변경',
      onSubmit: (name) => {
        if (name === fridge.name) return;
        safe(() => f.rename(fridge.id, name));
      },
    });
  };

  const handleDelete = (fridge: Fridge) => {
    if (!confirm(`"${fridge.name}"을(를) 삭제할까요? 이 냉장고의 모든 식재료가 함께 삭제됩니다.`)) return;
    safe(() => f.remove(fridge.id));
  };

  const handleLeave = (fridge: Fridge) => {
    if (!confirm(`"${fridge.name}"에서 나갈까요? 이 냉장고의 식재료를 더 이상 볼 수 없습니다.`)) return;
    safe(() => f.leave(fridge.id));
  };

  const handleInvite = (fridge: Fridge) => {
    safe(async () => {
      const code = await f.createInvite(fridge.id);
      setInviteCode({ code, fridgeName: fridge.name });
    });
  };

  const handleRemoveMember = (fridge: Fridge, username: string, name: string) => {
    if (!confirm(`${name}님을 "${fridge.name}"에서 제거할까요?`)) return;
    safe(() => f.removeMember(fridge.id, username));
  };

  if (isGuest()) return <GuestBlocked feature="냉장고 관리" />;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl" style={{ fontWeight: 700 }}>냉장고 관리</h1>
      </div>

      {/* 액션 버튼 */}
      <div className="px-5 pb-4 grid grid-cols-2 gap-2">
        <button
          onClick={handleCreate}
          disabled={working}
          className="rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 600 }}
        >
          <Plus className="w-4 h-4" />
          냉장고 만들기
        </button>
        <button
          onClick={handleJoin}
          disabled={working}
          className="rounded-xl py-3 flex items-center justify-center gap-2 border border-border disabled:opacity-60"
          style={{ fontWeight: 600 }}
        >
          <KeyRound className="w-4 h-4" />
          코드로 가입
        </button>
      </div>

      {/* 냉장고 목록 — 클릭하면 상세 모달 */}
      {f.loading && f.fridges.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">로딩 중...</div>
      ) : (
        <div className="px-5 space-y-2">
          {f.fridges.map((fridge) => (
            <button
              key={fridge.id}
              type="button"
              onClick={() => setDetailId(fridge.id)}
              className="w-full bg-card border border-border hover:bg-secondary rounded-xl px-4 py-3 flex items-center gap-3 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                <Refrigerator className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-base block truncate" style={{ fontWeight: 700 }}>
                  {fridge.name}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Users className="w-3 h-3" />
                  멤버 {fridge.members.length}명
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* 냉장고 상세 모달 — 멤버 목록 + 액션들 */}
      {detail && (
        <FridgeDetailModal
          fridge={detail}
          myUsername={myUsername}
          working={working}
          onClose={() => setDetailId(null)}
          onInvite={() => handleInvite(detail)}
          onRename={() => handleRename(detail)}
          onDelete={() => { handleDelete(detail); setDetailId(null); }}
          onLeave={() => { handleLeave(detail); setDetailId(null); }}
          onRemoveMember={(username, name) => handleRemoveMember(detail, username, name)}
        />
      )}

      {/* 초대 코드 모달 */}
      {inviteCode && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center px-5 z-50"
          onClick={() => setInviteCode(null)}
        >
          <div
            className="bg-background text-foreground rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg mb-1" style={{ fontWeight: 700 }}>초대 코드</h2>
            <p className="text-sm text-muted-foreground mb-4">{inviteCode.fridgeName}</p>
            <div
              className="text-center py-4 rounded-xl mb-3"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 700, fontSize: '28px', letterSpacing: '4px' }}
            >
              {inviteCode.code}
            </div>
            <p className="text-xs text-muted-foreground text-center mb-4">
              24시간 동안 유효. 가족에게 이 코드를 알려주세요.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteCode.code);
                  alert('복사되었습니다');
                }}
                className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 border border-border"
                style={{ fontWeight: 600 }}
              >
                <Copy className="w-4 h-4" />
                복사
              </button>
              <button
                onClick={() => setInviteCode(null)}
                className="flex-1 py-2.5 rounded-xl"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 600 }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 텍스트 입력 모달 (냉장고 만들기 / 이름 변경 / 코드 가입 공용) */}
      {textPrompt && (
        <TextPromptModal
          config={textPrompt}
          onClose={() => setTextPrompt(null)}
        />
      )}
    </div>
  );
}

// 한 번에 하나의 텍스트 입력을 받는 모달. config로 제목/플레이스홀더/제출 핸들러를 받음.
function TextPromptModal({
  config, onClose,
}: { config: TextPromptConfig; onClose: () => void }) {
  const [value, setValue] = useState(config.initial ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 모달 열리면 즉시 input 포커스
    inputRef.current?.focus();
    inputRef.current?.select();
    // ESC로 닫기
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = () => {
    const v = config.uppercase ? value.trim().toUpperCase() : value.trim();
    if (!v) return;
    config.onSubmit(v);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center px-5 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg" style={{ fontWeight: 700 }}>{config.title}</h2>
          <button onClick={onClose} className="p-1 -m-1 text-muted-foreground hover:text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        {config.subtitle && (
          <p className="text-sm text-muted-foreground mb-4">{config.subtitle}</p>
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            const v = config.uppercase ? e.target.value.toUpperCase() : e.target.value;
            setValue(v);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder={config.placeholder}
          maxLength={config.maxLength}
          className="w-full px-4 py-3 bg-card border border-border rounded-xl border border-border focus:outline-none focus:border-black mb-4"
          style={config.uppercase
            ? { fontSize: '22px', fontWeight: 700, letterSpacing: '4px', textAlign: 'center' }
            : { fontSize: '15px' }}
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-secondary"
            style={{ fontWeight: 600 }}
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={!value.trim()}
            className="flex-1 py-3 rounded-xl disabled:opacity-50"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 700 }}
          >
            {config.submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// 냉장고 상세 모달. 멤버는 모두 동등 — 초대/이름변경/나가기/삭제 다 가능.
function FridgeDetailModal({
  fridge, myUsername, working, onClose, onInvite, onRename, onDelete, onLeave, onRemoveMember,
}: {
  fridge: Fridge;
  myUsername: string | null;
  working: boolean;
  onClose: () => void;
  onInvite: () => void;
  onRename: () => void;
  onDelete: () => void;
  onLeave: () => void;
  onRemoveMember: (username: string, name: string) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center sm:px-5 z-40"
      onClick={onClose}
    >
      <div
        className="bg-background text-foreground w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-5 pt-5 pb-3 flex items-start gap-3 border-b border-border">
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <Refrigerator className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg truncate" style={{ fontWeight: 700 }}>
              {fridge.name}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              멤버 {fridge.members.length}명과 함께 사용
            </p>
          </div>
          <button onClick={onClose} className="p-1 -m-1 text-muted-foreground hover:text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* 초대 코드 발급 — 멤버 누구나 가능 */}
          <div>
            <p className="text-sm mb-2" style={{ fontWeight: 700 }}>가족 초대</p>
            <button
              onClick={onInvite}
              disabled={working}
              className="w-full rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 600 }}
            >
              <Share2 className="w-4 h-4" />
              초대 코드 발급
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              6자리 코드를 발급해서 가족에게 알려주면 같은 냉장고를 함께 관리할 수 있어요.
            </p>
          </div>

          {/* 멤버 목록 */}
          <div>
            <p className="text-sm mb-2 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
              <Users className="w-4 h-4" />
              멤버 ({fridge.members.length})
            </p>
            <div className="space-y-1">
              {fridge.members.map((m) => (
                <div key={m.username} className="flex items-center gap-2 px-3 py-2.5 bg-card border border-border rounded-lg">
                  <div className="w-7 h-7 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ fontWeight: 600 }}>
                      {m.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{m.username}</div>
                  </div>
                  {/* 자기 자신 제외 모두 제거 가능 (본인은 '나가기' 버튼 사용) */}
                  {m.username !== myUsername && (
                    <button
                      onClick={() => onRemoveMember(m.username, m.name)}
                      className="text-red-500 hover:bg-secondary p-1.5 rounded"
                      title="멤버 제거"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 관리 액션 — 멤버 누구나 동일 */}
          <div>
            <p className="text-sm mb-2" style={{ fontWeight: 700 }}>관리</p>
            <div className="space-y-2">
              <ActionRow icon={Edit2} label="이름 변경" onClick={onRename} />
              <ActionRow icon={LogOut} label="냉장고에서 나가기" onClick={onLeave} />
              <ActionRow icon={Trash2} label="냉장고 삭제 (모두에게서 사라짐)" onClick={onDelete} destructive />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionRow({
  icon: Icon, label, onClick, destructive,
}: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 rounded-xl border border-border hover:bg-secondary flex items-center gap-3 text-left transition-colors ${
        destructive ? 'text-red-600' : 'text-black'
      }`}
      style={{ fontWeight: 600 }}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </button>
  );
}
