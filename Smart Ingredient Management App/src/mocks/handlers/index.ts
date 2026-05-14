// ============================================================
// [MSW 모킹용 파일] handlers/index.ts
// 모든 핸들러를 한 곳에서 모아서 export합니다.
// 새 도메인 핸들러(ingredients, recipes 등)를 추가할 때 여기에 import 후 handlers 배열에 추가하세요.
//
// TODO: 백엔드 연동 완료 후 src/mocks/ 폴더 전체 삭제 가능.
// ============================================================

import { authHandlers } from './authHandlers';

// 모든 핸들러 통합
// 추후 ingredientsHandlers, recipesHandlers 등을 여기에 추가하면 됩니다.
// 예시: import { ingredientsHandlers } from './ingredientsHandlers';
//       export const handlers = [...authHandlers, ...ingredientsHandlers];
export const handlers = [
  ...authHandlers,
  // TODO: 다른 도메인 핸들러 추가 시 여기에 스프레드
];
