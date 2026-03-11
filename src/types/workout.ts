export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  description: string;
  instructions: string[];
  image: string;
}

export type MuscleGroup =
  | 'Peito' | 'Costas' | 'Ombros' | 'Bíceps' | 'Tríceps'
  | 'Pernas' | 'Glúteos' | 'Abdômen' | 'Panturrilha' | 'Antebraço'
  | 'Corpo Inteiro' | 'Cardio';

export type Equipment =
  | 'Barra' | 'Halteres' | 'Máquina' | 'Cabos' | 'Peso Corporal'
  | 'Kettlebell' | 'Elástico' | 'Smith Machine' | 'Banco' | 'Outro';

export interface WorkoutExercise {
  exerciseId: string;
  sets: SetConfig[];
  restTime: number;
  notes?: string;
}

export interface SetConfig {
  targetReps: number;
  weight: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  folder?: string;
}

export interface CompletedSet {
  weight: number;
  reps: number;
  completed: boolean;
  completedAt?: string;
}

export interface CompletedExercise {
  exerciseId: string;
  sets: CompletedSet[];
}

export interface CompletedWorkout {
  id: string;
  templateId?: string;
  name: string;
  exercises: CompletedExercise[];
  startedAt: string;
  completedAt: string;
  duration: number;
  totalVolume: number;
  notes?: string;
}

export interface ActiveWorkout {
  templateId?: string;
  name: string;
  exercises: ActiveExercise[];
  startedAt: string;
  currentExerciseIndex: number;
}

export interface ActiveExercise {
  exerciseId: string;
  sets: ActiveSet[];
  restTime: number;
}

export interface ActiveSet {
  weight: number;
  reps: number;
  targetReps: number;
  completed: boolean;
}

export interface PersonalRecord {
  exerciseId: string;
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
  date: string;
}

export interface Goal {
  id: string;
  type: 'weekly_frequency' | 'weight_target' | 'volume_target';
  target: number;
  exerciseId?: string;
  createdAt: string;
}
