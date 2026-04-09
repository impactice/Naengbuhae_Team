import { differenceInDays } from 'date-fns';

export function calculateDDay(expiryDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return differenceInDays(expiry, today);
}

export function formatDDay(daysLeft: number): string {
  if (daysLeft === 0) return 'D-day';
  if (daysLeft > 0) return `D-${daysLeft}`;
  return `D+${Math.abs(daysLeft)}`;
}

export function getExpiryStatus(daysLeft: number): 'danger' | 'warning' | 'safe' {
  if (daysLeft <= 0) return 'danger';
  if (daysLeft <= 3) return 'warning';
  return 'safe';
}

export function getStatusColor(status: 'danger' | 'warning' | 'safe'): string {
  switch (status) {
    case 'danger':
      return '#FF3B30';
    case 'warning':
      return '#FFD60A';
    case 'safe':
      return '#34C759';
  }
}

// 식재료 종류별 기본 유통기한 (일)
export const defaultExpiryDays: Record<string, number> = {
  // 채소
  '상추': 7,
  '양상추': 7,
  '양배추': 14,
  '당근': 21,
  '오이': 7,
  '토마토': 7,
  '감자': 30,
  '고구마': 30,
  '브로콜리': 7,
  '시금치': 5,
  
  // 육류
  '소고기': 3,
  '돼지고기': 3,
  '닭고기': 2,
  '닭가슴살': 2,
  
  // 유제품
  '우유': 7,
  '요거트': 14,
  '치즈': 30,
  '버터': 30,
  
  // 해산물
  '생선': 2,
  '새우': 2,
  '오징어': 2,
  
  // 과일
  '사과': 14,
  '배': 14,
  '바나나': 7,
  '딸기': 5,
  '포도': 7,
  
  // 기본값
  'default': 7,
};

export function getDefaultExpiryDate(ingredientName: string, purchaseDate: Date): Date {
  const days = defaultExpiryDays[ingredientName] || defaultExpiryDays['default'];
  const expiryDate = new Date(purchaseDate);
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
}
