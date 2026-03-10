import { useState, useEffect, useCallback } from 'react';
import { WorkoutTemplate, CompletedWorkout, ActiveWorkout, PersonalRecord } from '@/types/workout';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
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
