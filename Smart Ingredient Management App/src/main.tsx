
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

import { themeModeStore } from './app/utils/themeMode';

// MSW 모킹 비활성화 — 백엔드 연동된 상태이고 msw 패키지도 설치되어 있지 않음.
// 다시 켜려면 `npm install -D msw` 후 dev 환경에서 ./mocks/browser를 동적 import.

// 테마 모드 초기화 — <html>에 dark 클래스를 즉시 부여 + prefers-color-scheme listen.
themeModeStore.init();

createRoot(document.getElementById("root")!).render(<App />);