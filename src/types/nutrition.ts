export interface NutritionItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  calcium?: number;
  iron?: number;
  vitaminC?: number;
  vitaminD?: number;
}

export interface MealEntry {
  id: string;
  date: string; // ISO string
  time: string; // HH:mm
  type: 'cafe' | 'almoco' | 'lanche' | 'jantar' | 'outro';
  items: NutritionItem[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sodium?: number;
    sugar?: number;
    calcium?: number;
    iron?: number;
    vitaminC?: number;
    vitaminD?: number;
  };
  imageBase64?: string; // thumbnail
  notes?: string;
  confidence?: 'alta' | 'media' | 'baixa' | 'manual';
}

export interface DailyNutritionGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MicroGoals {
  fiber: number;     // g
  sodium: number;    // mg (limite máximo)
  sugar: number;     // g (limite máximo)
  calcium: number;   // mg
  iron: number;      // mg
  vitaminC: number;  // mg
  vitaminD: number;  // mcg
}

export const DEFAULT_MICRO_GOALS: MicroGoals = {
  fiber: 25,
  sodium: 2300,
  sugar: 50,
  calcium: 1000,
  iron: 14,
  vitaminC: 90,
  vitaminD: 15,
};

// micros tratados como "limite" (menor é melhor) ao invés de meta a atingir
export const MICRO_LIMITS: Set<keyof MicroGoals> = new Set(['sodium', 'sugar']);
