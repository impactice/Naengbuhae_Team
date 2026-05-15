
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// MSW 모킹 비활성화 — 백엔드 연동된 상태이고 msw 패키지도 설치되어 있지 않음.
// 다시 켜려면 `npm install -D msw` 후 dev 환경에서 ./mocks/browser를 동적 import.
createRoot(document.getElementById("root")!).render(<App />);