export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  notes?: string;
}

export interface DayPlan {
  day: number;
  dayName: string;
  title: string;
  focus: string;
  isRestDay: boolean;
  warmup: string;
  exercises: Exercise[];
  cooldown: string;
  estimatedDurationMinutes: number;
}

export interface WorkoutPlan {
  planTitle: string;
  planSummary: string;
  targetGoal: string;
  intensity: string;
  days: DayPlan[];
  nutritionTip: string;
  recoveryTip: string;
  coachingNotes: string;
  generatedAt: string;
  revision?: number;
}

export interface UserRecord {
  id: string; // userId
  name: string;
  age: number;
  weight: number;
  goal: string;
  intensity: string;
  originalPlan: WorkoutPlan;
  updatedPlan?: WorkoutPlan | null;
  feedbackList?: { feedback: string; date: string }[];
  createdAt: string;
  updatedAt: string;
}

export type FitnessGoal = 'Weight Loss' | 'Muscle Gain' | 'General Wellness' | 'Flexibility' | 'Endurance';
export type WorkoutIntensity = 'Low' | 'Medium' | 'High';
