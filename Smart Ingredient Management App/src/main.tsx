
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// ============================================================
// [MSW 모킹] dev 환경에서만 MSW Service Worker를 활성화합니다.
// import.meta.env.DEV === true 일 때만 실행 → 프로덕션 빌드에는 포함되지 않습니다.
//
// TODO: 백엔드 연동 완료 후 아래 if 블록 전체를 삭제하고
//       createRoot(...).render(...) 만 남기면 됩니다.
// ============================================================
async function enableMocking() {
  // 프로덕션이면 그냥 통과 (MSW 전혀 사용 안 함)
  if (!import.meta.env.DEV) return;

  // dev 환경에서만 동적 import — 빌드 번들에는 포함되지 않음
  const { worker } = await import('./mocks/browser');

  // onUnhandledRequest: 'bypass' → MSW에 핸들러 없는 요청은 실제 네트워크로 그냥 통과
  // onUnhandledRequest: 'warn'   → 콘솔 경고 출력 (기본값, 디버깅에 유용)
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

// MSW 준비 완료 후 React 앱 마운트
enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});