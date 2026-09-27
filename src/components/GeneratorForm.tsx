import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { FitnessGoal, WorkoutIntensity, UserRecord, WorkoutPlan } from '../types';

interface GeneratorFormProps {
  onPlanGenerated: (user: UserRecord, plan: WorkoutPlan) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({
  onPlanGenerated,
  isLoading,
  setIsLoading,
}) => {
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>('Weight Loss');
  const [intensity, setIntensity] = useState<WorkoutIntensity>('Medium');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');

  const prefillSample = () => {
    const samples = [
      { name: 'Alex Johnson', id: 'user_001', age: '28', weight: '74', goal: 'Weight Loss' as FitnessGoal, intensity: 'Medium' as WorkoutIntensity },
      { name: 'Sarah Chen', id: 'user_002', age: '32', weight: '62', goal: 'Muscle Gain' as FitnessGoal, intensity: 'High' as WorkoutIntensity },
      { name: 'Michael David', id: 'user_003', age: '45', weight: '85', goal: 'General Wellness' as FitnessGoal, intensity: 'Low' as WorkoutIntensity },
      { name: 'Elena Rostova', id: 'user_004', age: '24', weight: '58', goal: 'Flexibility' as FitnessGoal, intensity: 'Medium' as WorkoutIntensity },
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    setName(picked.name);
    setUserId(picked.id);
    setAge(picked.age);
    setWeight(picked.weight);
    setFitnessGoal(picked.goal);
    setIntensity(picked.intensity);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!userId.trim()) {
      setErrorMsg('Please provide a User ID (e.g. user_001).');
      return;
    }
    if (!age || Number(age) < 14 || Number(age) > 100) {
      setErrorMsg('Please enter a valid age between 14 and 100.');
      return;
    }
    if (!weight || Number(weight) < 30 || Number(weight) > 300) {
      setErrorMsg('Please enter a realistic weight in kg (30 - 300).');
      return;
    }

    setIsLoading(true);
    setLoadingStep('Consulting Gemini AI with your fitness profile...');

    const stepTimer1 = setTimeout(() => {
      setLoadingStep('Structuring day-by-day workout split & exercise load...');
    }, 1500);

    const stepTimer2 = setTimeout(() => {
      setLoadingStep('Formulating sports nutrition & recovery guidelines...');
    }, 3200);

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: name.trim(),
          userId: userId.trim(),
          age: Number(age),
          weight: Number(weight),
          goal: fitnessGoal,
          intensity: intensity,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate fitness plan.');
      }

      onPlanGenerated(data.user, data.plan);
    } catch (err: any) {
      console.error('Plan generation failed:', err);
      setErrorMsg(err.message || 'Error communicating with Gemini service. Please try again.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-8 sm:px-6">
      {/* Background glow effects matching screenshot aesthetic */}
      <div className="pointer-events-none absolute -top-16 left-1/2 h-72 w-96 -translate-x-1/2 rounded-full bg-emerald-600/15 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-10 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />

      {/* Gemini badge */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-xs font-semibold text-emerald-300 shadow-sm backdrop-blur-md">
        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
        <span>Gemini-powered fitness planning</span>
      </div>

      {/* Main Title */}
      <h1 className="mb-2 text-center text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
        FitBuddy
      </h1>

      {/* Subtitle */}
      <p className="mb-8 max-w-lg text-center text-sm font-normal text-gray-300 sm:text-base">
        Create a personalized 7-day workout plan and get a practical nutrition/recovery tip.
      </p>

      {/* Card Container */}
      <div className="w-full rounded-2xl border border-emerald-900/60 bg-[#0c1612]/90 p-6 shadow-2xl shadow-emerald-950/40 backdrop-blur-md sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Tell us about you
          </h2>
          <button
            type="button"
            onClick={prefillSample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/40 bg-emerald-950/30 px-2.5 py-1 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-900/40"
            title="Auto-fill with sample user details"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Sample Profile</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-rose-900/60 bg-rose-950/40 p-3.5 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Name and User ID */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-semibold text-gray-200">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full rounded-xl border border-emerald-900/60 bg-[#07100c] px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="userId" className="mb-2 block text-sm font-semibold text-gray-200">
                User ID
              </label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. user_001"
                required
                className="w-full rounded-xl border border-emerald-900/60 bg-[#07100c] px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 2: Age and Weight */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="age" className="mb-2 block text-sm font-semibold text-gray-200">
                Age
              </label>
              <input
                id="age"
                type="number"
                min="14"
                max="100"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                required
                className="w-full rounded-xl border border-emerald-900/60 bg-[#07100c] px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="weight" className="mb-2 block text-sm font-semibold text-gray-200">
                Weight (kg)
              </label>
              <input
                id="weight"
                type="number"
                min="30"
                max="300"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
                required
                className="w-full rounded-xl border border-emerald-900/60 bg-[#07100c] px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 3: Fitness Goal and Workout Intensity (matching screenshot dropdowns) */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="fitnessGoal" className="mb-2 block text-sm font-semibold text-gray-200">
                Fitness Goal
              </label>
              <select
                id="fitnessGoal"
                value={fitnessGoal}
                onChange={(e) => setFitnessGoal(e.target.value as FitnessGoal)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-emerald-900/60 bg-[#07100c] px-4 py-2.5 text-sm text-gray-100 transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2334d399' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1em',
                }}
              >
                <option value="Weight Loss" className="bg-[#0c1612] text-white">Weight Loss</option>
                <option value="Muscle Gain" className="bg-[#0c1612] text-white">Muscle Gain</option>
                <option value="General Wellness" className="bg-[#0c1612] text-white">General Wellness</option>
                <option value="Flexibility" className="bg-[#0c1612] text-white">Flexibility</option>
                <option value="Endurance" className="bg-[#0c1612] text-white">Endurance</option>
              </select>
            </div>

            <div>
              <label htmlFor="intensity" className="mb-2 block text-sm font-semibold text-gray-200">
                Workout Intensity
              </label>
              <select
                id="intensity"
                value={intensity}
                onChange={(e) => setIntensity(e.target.value as WorkoutIntensity)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-emerald-900/60 bg-[#07100c] px-4 py-2.5 text-sm text-gray-100 transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2334d399' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1em',
                }}
              >
                <option value="Low" className="bg-[#0c1612] text-white">Low</option>
                <option value="Medium" className="bg-[#0c1612] text-white">Medium</option>
                <option value="High" className="bg-[#0c1612] text-white">High</option>
              </select>
            </div>
          </div>

          {/* Submit Button (Matching mint green styling from screenshot) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#6ee7b7] px-6 py-3.5 text-sm font-bold text-gray-950 shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:bg-[#86efac] hover:shadow-emerald-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-gray-950" />
                  <span>{loadingStep || 'Generating Your 7-Day Plan...'}</span>
                </>
              ) : (
                <>
                  <span>Generate My 7-Day Plan</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Disclaimer exactly matching user screenshot */}
        <p className="mt-5 text-center text-xs leading-relaxed text-gray-400">
          FitBuddy provides general fitness information, not medical advice. If you have an injury, medical condition, are pregnant, or are unsure whether exercise is appropriate, consult a qualified healthcare or fitness professional.
        </p>
      </div>

      {/* Quick feature highlights below card */}
      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-950/60 bg-[#09120e]/60 p-3 text-xs text-gray-300">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            1
          </div>
          <div>
            <div className="font-semibold text-white">7-Day Split</div>
            <div className="text-[11px] text-gray-400">Tailored sets, reps & warmups</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-emerald-950/60 bg-[#09120e]/60 p-3 text-xs text-gray-300">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            2
          </div>
          <div>
            <div className="font-semibold text-white">Targeted Nutrition</div>
            <div className="text-[11px] text-gray-400">Fueling & recovery advice</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-emerald-950/60 bg-[#09120e]/60 p-3 text-xs text-gray-300">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            3
          </div>
          <div>
            <div className="font-semibold text-white">PDF Export</div>
            <div className="text-[11px] text-gray-400">Instant printable routine</div>
          </div>
        </div>
      </div>
    </div>
  );
};
