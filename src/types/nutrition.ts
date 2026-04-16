export interface NutritionItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
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
