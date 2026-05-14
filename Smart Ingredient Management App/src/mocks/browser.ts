// ============================================================
// [MSW 모킹용 파일] browser.ts
// 브라우저용 MSW Service Worker를 생성하고 핸들러를 등록합니다.
// 이 파일은 main.tsx에서 dev 환경일 때만 import됩니다.
//
// TODO: 백엔드 연동 완료 후 src/mocks/ 폴더 전체 삭제 가능.
// ============================================================

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// 브라우저 Service Worker에 핸들러 등록
export const worker = setupWorker(...handlers);
