export interface Recipe {
  id: string;
  name: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cookingTime: number; // 분
  servings: number;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    required: boolean;
  }[];
  steps: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sodium: number;
  };
  imageUrl?: string;
}

export const recipes: Recipe[] = [
  {
    id: '1',
    name: '계란볶음밥',
    category: '밥/면',
    difficulty: 'easy',
    cookingTime: 15,
    servings: 2,
    ingredients: [
      { name: '계란', quantity: 2, unit: '개', required: true },
      { name: '밥', quantity: 2, unit: '공기', required: true },
      { name: '양파', quantity: 0.5, unit: '개', required: false },
      { name: '당근', quantity: 0.3, unit: '개', required: false },
      { name: '파', quantity: 1, unit: '줌', required: false },
    ],
    steps: [
      '계란을 풀어서 소금으로 간을 합니다.',
      '팬에 기름을 두르고 계란을 먼저 볶아줍니다.',
      '야채를 잘게 썰어 함께 볶습니다.',
      '밥을 넣고 고루 섞으면서 볶습니다.',
      '간장이나 소금으로 간을 맞추고 완성합니다.',
    ],
    nutrition: {
      calories: 520,
      protein: 18,
      carbs: 72,
      fat: 16,
      sodium: 680,
    },
  },
  {
    id: '2',
    name: '닭가슴살 샐러드',
    category: '샐러드',
    difficulty: 'easy',
    cookingTime: 20,
    servings: 2,
    ingredients: [
      { name: '닭가슴살', quantity: 200, unit: 'g', required: true },
      { name: '양상추', quantity: 1, unit: '개', required: true },
      { name: '토마토', quantity: 1, unit: '개', required: false },
      { name: '오이', quantity: 0.5, unit: '개', required: false },
    ],
    steps: [
      '닭가슴살을 삶아서 결대로 찢어줍니다.',
      '양상추를 한입 크기로 뜯어줍니다.',
      '토마토와 오이를 먹기 좋은 크기로 썰어줍니다.',
      '모든 재료를 그릇에 담고 드레싱을 뿌려 완성합니다.',
    ],
    nutrition: {
      calories: 180,
      protein: 28,
      carbs: 8,
      fat: 4,
      sodium: 320,
    },
  },
  {
    id: '3',
    name: '우유 스크램블 에그',
    category: '간식',
    difficulty: 'easy',
    cookingTime: 10,
    servings: 1,
    ingredients: [
      { name: '계란', quantity: 3, unit: '개', required: true },
      { name: '우유', quantity: 50, unit: 'ml', required: true },
      { name: '치즈', quantity: 1, unit: '장', required: false },
    ],
    steps: [
      '계란과 우유를 잘 섞어줍니다.',
      '팬에 버터를 녹이고 약불로 조절합니다.',
      '계란 혼합물을 넣고 천천히 저어가며 익힙니다.',
      '치즈를 올려 완성합니다.',
    ],
    nutrition: {
      calories: 280,
      protein: 21,
      carbs: 4,
      fat: 20,
      sodium: 420,
    },
  },
  {
    id: '4',
    name: '닭가슴살 볶음',
    category: '반찬',
    difficulty: 'easy',
    cookingTime: 15,
    servings: 2,
    ingredients: [
      { name: '닭가슴살', quantity: 300, unit: 'g', required: true },
      { name: '양파', quantity: 1, unit: '개', required: false },
      { name: '브로콜리', quantity: 0.5, unit: '개', required: false },
      { name: '파프리카', quantity: 0.5, unit: '개', required: false },
    ],
    steps: [
      '닭가슴살을 한입 크기로 잘라줍니다.',
      '야채를 먹기 좋은 크기로 썰어줍니다.',
      '팬에 기름을 두르고 닭가슴살을 먼저 볶습니다.',
      '야채를 넣고 함께 볶아줍니다.',
      '간장, 올리고당으로 간을 맞춰 완성합니다.',
    ],
    nutrition: {
      calories: 240,
      protein: 38,
      carbs: 12,
      fat: 5,
      sodium: 580,
    },
  },
  {
    id: '5',
    name: '당근 계란찜',
    category: '반찬',
    difficulty: 'easy',
    cookingTime: 25,
    servings: 2,
    ingredients: [
      { name: '계란', quantity: 4, unit: '개', required: true },
      { name: '당근', quantity: 0.5, unit: '개', required: true },
      { name: '파', quantity: 1, unit: '줌', required: false },
    ],
    steps: [
      '계란을 풀어서 체에 거릅니다.',
      '당근을 잘게 다져서 넣습니다.',
      '물을 계란과 1:1 비율로 넣고 섞습니다.',
      '찜기에 넣고 약불로 20분간 찝니다.',
      '파를 올려 완성합니다.',
    ],
    nutrition: {
      calories: 160,
      protein: 14,
      carbs: 6,
      fat: 10,
      sodium: 280,
    },
  },
  {
    id: '6',
    name: '양상추 샌드위치',
    category: '간식',
    difficulty: 'easy',
    cookingTime: 10,
    servings: 1,
    ingredients: [
      { name: '식빵', quantity: 2, unit: '장', required: true },
      { name: '양상추', quantity: 2, unit: '장', required: true },
      { name: '토마토', quantity: 0.5, unit: '개', required: false },
      { name: '치즈', quantity: 1, unit: '장', required: false },
      { name: '계란', quantity: 1, unit: '개', required: false },
    ],
    steps: [
      '식빵을 가볍게 구워줍니다.',
      '계란을 프라이로 익힙니다.',
      '토마토를 슬라이스합니다.',
      '식빵에 재료를 차례로 올려 완성합니다.',
    ],
    nutrition: {
      calories: 320,
      protein: 15,
      carbs: 38,
      fat: 12,
      sodium: 520,
    },
  },
  {
    id: '7',
    name: '우유 요거트 스무디',
    category: '음료',
    difficulty: 'easy',
    cookingTime: 5,
    servings: 1,
    ingredients: [
      { name: '우유', quantity: 200, unit: 'ml', required: true },
      { name: '요거트', quantity: 100, unit: 'g', required: true },
      { name: '바나나', quantity: 1, unit: '개', required: false },
      { name: '딸기', quantity: 5, unit: '개', required: false },
    ],
    steps: [
      '모든 재료를 믹서기에 넣습니다.',
      '부드럽게 갈아줍니다.',
      '컵에 담아 완성합니다.',
    ],
    nutrition: {
      calories: 220,
      protein: 12,
      carbs: 36,
      fat: 4,
      sodium: 150,
    },
  },
  {
    id: '8',
    name: '소고기 야채볶음',
    category: '반찬',
    difficulty: 'medium',
    cookingTime: 20,
    servings: 2,
    ingredients: [
      { name: '소고기', quantity: 200, unit: 'g', required: true },
      { name: '양파', quantity: 1, unit: '개', required: true },
      { name: '당근', quantity: 0.5, unit: '개', required: false },
      { name: '브로콜리', quantity: 0.5, unit: '개', required: false },
    ],
    steps: [
      '소고기를 간장, 설탕, 마늘로 양념합니다.',
      '야채를 먹기 좋은 크기로 썰어줍니다.',
      '팬에 소고기를 먼저 볶습니다.',
      '야채를 넣고 함께 볶아 완성합니다.',
    ],
    nutrition: {
      calories: 280,
      protein: 26,
      carbs: 14,
      fat: 14,
      sodium: 720,
    },
  },
];
