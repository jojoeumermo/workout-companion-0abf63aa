import { useState, useEffect, useCallback } from 'react';
import { WorkoutTemplate, CompletedWorkout, ActiveWorkout, PersonalRecord, Goal } from '@/types/workout';
import { MealEntry, DailyNutritionGoal } from '@/types/nutrition';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      // Sync write to localStorage so navigations pick up the value immediately
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (e) {
        console.error('Error saving to localStorage', e);
      }
      return newValue;
    });
  }, [key]);

  return [storedValue, setValue];
}

export function useTemplates() {
  return useLocalStorage<WorkoutTemplate[]>('workout-templates', []);
}

export function useHistory() {
  return useLocalStorage<CompletedWorkout[]>('workout-history', []);
}

export function useActiveWorkout() {
  return useLocalStorage<ActiveWorkout | null>('active-workout', null);
}

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<string[]>('favorite-exercises', []);
  
  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }, [setFavorites]);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}

export function usePersonalRecords() {
  const [records, setRecords] = useLocalStorage<PersonalRecord[]>('personal-records', []);

  const updateRecord = useCallback((exerciseId: string, weight: number, reps: number) => {
    setRecords(prev => {
      const existing = prev.find(r => r.exerciseId === exerciseId);
      const volume = weight * reps;
      const now = new Date().toISOString();

      if (!existing) {
        return [...prev, { exerciseId, maxWeight: weight, maxReps: reps, maxVolume: volume, date: now }];
      }

      let updated = false;
      const newRecord = { ...existing };
      if (weight > existing.maxWeight) { newRecord.maxWeight = weight; updated = true; }
      if (reps > existing.maxReps) { newRecord.maxReps = reps; updated = true; }
      if (volume > existing.maxVolume) { newRecord.maxVolume = volume; updated = true; }
      if (updated) {
        newRecord.date = now;
        return prev.map(r => r.exerciseId === exerciseId ? newRecord : r);
      }
      return prev;
    });
  }, [setRecords]);

  const getRecord = useCallback((exerciseId: string) => records.find(r => r.exerciseId === exerciseId), [records]);

  return { records, updateRecord, getRecord };
}

export function useGoals() {
  const [goals, setGoals] = useLocalStorage<Goal[]>('workout-goals', []);

  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt'>) => {
    setGoals(prev => [...prev, { ...goal, id: `goal-${Date.now()}`, createdAt: new Date().toISOString() }]);
  }, [setGoals]);

  const removeGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  }, [setGoals]);

  return { goals, addGoal, removeGoal };
}

export function useFolders() {
  return useLocalStorage<string[]>('workout-folders', ['Treinos Atuais']);
}

export function useTheme() {
  return useLocalStorage<string>('app-theme', 'green');
}

export function useMeals() {
  const [meals, setMeals] = useLocalStorage<MealEntry[]>('meal-history', []);

  const addMeal = useCallback((meal: Omit<MealEntry, 'id'>) => {
    setMeals(prev => [...prev, { ...meal, id: `meal-${Date.now()}` }]);
  }, [setMeals]);

  const updateMeal = useCallback((id: string, updates: Partial<MealEntry>) => {
    setMeals(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, [setMeals]);

  const deleteMeal = useCallback((id: string) => {
    setMeals(prev => prev.filter(m => m.id !== id));
  }, [setMeals]);

  const getMealsForDate = useCallback((date: string) => {
    return meals.filter(m => m.date.startsWith(date));
  }, [meals]);

  return { meals, addMeal, updateMeal, deleteMeal, getMealsForDate };
}

export function useNutritionGoals() {
  return useLocalStorage<DailyNutritionGoal>('nutrition-goals', {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 70,
  });
}

export function useBodyWeight() {
  const [entries, setEntries] = useLocalStorage<{ date: string; weight: number; note?: string }[]>('body-weight', []);

  const addWeight = useCallback((weight: number, note?: string) => {
    const date = new Date().toISOString().split('T')[0];
    setEntries(prev => {
      const filtered = prev.filter(e => e.date !== date);
      return [...filtered, { date, weight, note }].sort((a, b) => a.date.localeCompare(b.date));
    });
  }, [setEntries]);

  const removeWeight = useCallback((date: string) => {
    setEntries(prev => prev.filter(e => e.date !== date));
  }, [setEntries]);

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;

  return { entries, addWeight, removeWeight, latest };
}

export function useWaterLog() {
  const [water, setWater] = useLocalStorage<Record<string, number>>('water-log', {});

  const getTodayWater = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return water[today] || 0;
  }, [water]);

  const addWater = useCallback((ml: number) => {
    const today = new Date().toISOString().split('T')[0];
    setWater(prev => ({ ...prev, [today]: Math.max(0, (prev[today] || 0) + ml) }));
  }, [setWater]);

  const setDayWater = useCallback((date: string, ml: number) => {
    setWater(prev => ({ ...prev, [date]: Math.max(0, ml) }));
  }, [setWater]);

  const getWaterForDate = useCallback((date: string) => water[date] || 0, [water]);

  return { water, getTodayWater, addWater, setDayWater, getWaterForDate };
}

export interface UserProfile {
  height: number;
  age: number;
  sex: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  neck: number;
  waist: number;
  hip: number;
}

export function useUserProfile() {
  return useLocalStorage<UserProfile>('user-profile', {
    height: 0,
    age: 0,
    sex: 'male',
    activityLevel: 'moderate',
    neck: 0,
    waist: 0,
    hip: 0,
  });
}

export function useWaterGoal() {
  return useLocalStorage<number>('water-goal', 2500);
}

export interface CustomExercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  description: string;
  instructions: string[];
  isCustom: true;
}

export function useCustomExercises() {
  const [exercises, setExercises] = useLocalStorage<CustomExercise[]>('custom-exercises', []);

  const addExercise = useCallback((ex: Omit<CustomExercise, 'id' | 'isCustom'>) => {
    setExercises(prev => [...prev, { ...ex, id: `custom-${Date.now()}`, isCustom: true }]);
  }, [setExercises]);

  const removeExercise = useCallback((id: string) => {
    setExercises(prev => prev.filter(e => e.id !== id));
  }, [setExercises]);

  return { exercises, addExercise, removeExercise };
}
