export interface NutritionItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  potassium?: number;
  calcium?: number;
  iron?: number;
  magnesium?: number;
  zinc?: number;
  vitaminA?: number;
  vitaminB12?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminK?: number;
  omega3?: number;
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
    sugar?: number;
    sodium?: number;
    potassium?: number;
    calcium?: number;
    iron?: number;
    magnesium?: number;
    zinc?: number;
    vitaminA?: number;
    vitaminB12?: number;
    vitaminC?: number;
    vitaminD?: number;
    vitaminE?: number;
    vitaminK?: number;
    omega3?: number;
  };
  imageBase64?: string; // thumbnail
  notes?: string;
  confidence?: 'alta' | 'media' | 'baixa' | 'manual';
  /** When true, this entry was created manually for micronutrient supplementation only */
  isMicroSupplement?: boolean;
}

export interface DailyNutritionGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MicroGoals {
  fiber: number;       // g
  sugar: number;       // g (limite máximo)
  sodium: number;      // mg (limite máximo)
  potassium: number;   // mg
  calcium: number;     // mg
  iron: number;        // mg
  magnesium: number;   // mg
  zinc: number;        // mg
  vitaminA: number;    // mcg RAE
  vitaminB12: number;  // mcg
  vitaminC: number;    // mg
  vitaminD: number;    // mcg
  vitaminE: number;    // mg
  vitaminK: number;    // mcg
  omega3: number;      // g
}

export const DEFAULT_MICRO_GOALS: MicroGoals = {
  fiber: 25,
  sugar: 50,
  sodium: 2300,
  potassium: 3500,
  calcium: 1000,
  iron: 14,
  magnesium: 400,
  zinc: 11,
  vitaminA: 900,
  vitaminB12: 2.4,
  vitaminC: 90,
  vitaminD: 15,
  vitaminE: 15,
  vitaminK: 120,
  omega3: 1.6,
};

// Micros tratados como "limite" (menor é melhor) ao invés de meta a atingir
export const MICRO_LIMITS: Set<keyof MicroGoals> = new Set(['sodium', 'sugar']);

export type MicroKey = keyof MicroGoals;

export interface MicroDef {
  key: MicroKey;
  label: string;
  unit: string;
  color: string;       // tailwind bg
  text: string;        // tailwind text
}

export const MICRO_DEFS: MicroDef[] = [
  { key: 'fiber',      label: 'Fibras',       unit: 'g',   color: 'bg-emerald-400', text: 'text-emerald-400' },
  { key: 'sugar',      label: 'Açúcar',       unit: 'g',   color: 'bg-pink-400',    text: 'text-pink-400' },
  { key: 'sodium',     label: 'Sódio',        unit: 'mg',  color: 'bg-rose-400',    text: 'text-rose-400' },
  { key: 'potassium',  label: 'Potássio',     unit: 'mg',  color: 'bg-violet-400',  text: 'text-violet-400' },
  { key: 'calcium',    label: 'Cálcio',       unit: 'mg',  color: 'bg-sky-400',     text: 'text-sky-400' },
  { key: 'iron',       label: 'Ferro',        unit: 'mg',  color: 'bg-orange-400',  text: 'text-orange-400' },
  { key: 'magnesium',  label: 'Magnésio',     unit: 'mg',  color: 'bg-lime-400',    text: 'text-lime-400' },
  { key: 'zinc',       label: 'Zinco',        unit: 'mg',  color: 'bg-cyan-400',    text: 'text-cyan-400' },
  { key: 'vitaminA',   label: 'Vitamina A',   unit: 'mcg', color: 'bg-amber-400',   text: 'text-amber-400' },
  { key: 'vitaminB12', label: 'Vitamina B12', unit: 'mcg', color: 'bg-fuchsia-400', text: 'text-fuchsia-400' },
  { key: 'vitaminC',   label: 'Vitamina C',   unit: 'mg',  color: 'bg-yellow-400',  text: 'text-yellow-400' },
  { key: 'vitaminD',   label: 'Vitamina D',   unit: 'mcg', color: 'bg-amber-300',   text: 'text-amber-300' },
  { key: 'vitaminE',   label: 'Vitamina E',   unit: 'mg',  color: 'bg-teal-400',    text: 'text-teal-400' },
  { key: 'vitaminK',   label: 'Vitamina K',   unit: 'mcg', color: 'bg-green-400',   text: 'text-green-400' },
  { key: 'omega3',     label: 'Ômega 3',      unit: 'g',   color: 'bg-indigo-400',  text: 'text-indigo-400' },
];
