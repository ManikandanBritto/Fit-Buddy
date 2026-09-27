import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Download,
  Printer,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Flame,
  Apple,
  Moon,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  History,
  Send,
  Loader2,
  CheckCircle2,
  SlidersHorizontal,
  ArrowLeft,
  FileText
} from 'lucide-react';
import { UserRecord, WorkoutPlan, DayPlan, Exercise } from '../types';
import { generateFitnessPlanPDF } from '../utils/pdfGenerator';

interface PlanViewProps {
  user: UserRecord;
  plan: WorkoutPlan;
  onPlanUpdated: (updatedUser: UserRecord, updatedPlan: WorkoutPlan) => void;
  onBackToGenerator: () => void;
}

export const PlanView: React.FC<PlanViewProps> = ({
  user,
  plan,
  onPlanUpdated,
  onBackToGenerator,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'raw'>('cards');
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Feedback Revision State (Scenario 2)
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [showOriginalComparison, setShowOriginalComparison] = useState(false);

  // Exercise completion state tracking
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});

  const activePlan = (showOriginalComparison && user.originalPlan) ? user.originalPlan : plan;
  const isUpdatedRevision = (user.updatedPlan && !showOriginalComparison) || (plan.revision && plan.revision > 1);

  const toggleExerciseCheck = (dayIndex: number, exerciseIndex: number) => {
    const key = `d${dayIndex}-e${exerciseIndex}`;
    setCompletedExercises((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDownloadPDFViaPrint = () => {
    // Trigger celebratory confetti
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#34d399', '#10b981', '#6ee7b7', '#059669'],
    });

    // Small delay to ensure any layout paints cleanly before opening system print/PDF dialog
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDownloadDirectPDF = () => {
    try {
      setIsGeneratingPdf(true);

      const doc = generateFitnessPlanPDF(
        {
          name: user.name,
          userId: user.id,
          age: user.age,
          weight: user.weight,
          goal: user.goal,
          intensity: user.intensity,
        },
        activePlan
      );

      const cleanName = user.name.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`FitBuddy_7Day_Plan_${cleanName}_${user.id}.pdf`);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#34d399', '#10b981', '#6ee7b7', '#059669'],
      });
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyText = () => {
    let text = `# FitBuddy 7-Day Plan: ${activePlan.planTitle}\n`;
    text += `Client: ${user.name} (${user.id}) | Goal: ${user.goal} | Intensity: ${user.intensity}\n\n`;
    text += `Strategy Summary: ${activePlan.planSummary}\n\n`;
    text += `Nutrition Tip: ${activePlan.nutritionTip}\n`;
    text += `Recovery Tip: ${activePlan.recoveryTip}\n\n`;
    text += `--- 7-DAY WORKOUT SCHEDULE ---\n\n`;

    activePlan.days.forEach((day) => {
      text += `### ${day.dayName || `Day ${day.day}`}: ${day.title} (${day.isRestDay ? 'Rest Day' : `${day.estimatedDurationMinutes} mins`})\n`;
      text += `Focus: ${day.focus}\n`;
      if (day.warmup) text += `Warm-up: ${day.warmup}\n`;
      if (day.exercises && day.exercises.length > 0) {
        text += `Exercises:\n`;
        day.exercises.forEach((ex, i) => {
          text += `  ${i + 1}. ${ex.name} - ${ex.sets} | ${ex.reps} (${ex.notes || 'Good form'})\n`;
        });
      }
      if (day.cooldown) text += `Cooldown: ${day.cooldown}\n`;
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApplyPresetFeedback = (preset: string) => {
    setFeedbackText((prev) => (prev ? `${prev}, and ${preset.toLowerCase()}` : preset));
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmittingFeedback(true);
    setFeedbackError(null);

    try {
      const res = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          feedback: feedbackText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update plan with feedback.');
      }

      onPlanUpdated(data.user, data.updatedPlan);
      setFeedbackText('');
      setShowOriginalComparison(false);

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#38bdf8', '#34d399', '#a7f3d0'],
      });
    } catch (err: any) {
      console.error('Feedback revision failed:', err);
      setFeedbackError(err.message || 'Error revising plan.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const currentDay = activePlan.days[selectedDayIndex] || activePlan.days[0];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-8 sm:px-6">
      {/* Top action bar */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950/60 pb-5">
        <button
          onClick={onBackToGenerator}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-900/40 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:bg-emerald-900/40 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>New Profile / Edit</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Download PDF Action (using print-friendly CSS & window.print()) */}
          <button
            onClick={handleDownloadPDFViaPrint}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6ee7b7] px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-950 shadow-md shadow-emerald-500/25 transition-all hover:bg-[#86efac] active:scale-95 cursor-pointer"
            title="Download / Save as clean PDF document"
          >
            <Download className="h-4 w-4 text-gray-950" />
            <span>Download PDF</span>
          </button>

          {/* Direct Vector PDF Export Option */}
          <button
            onClick={handleDownloadDirectPDF}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-900/60 bg-[#0c1612] px-3 py-2 text-xs font-semibold text-gray-200 transition-colors hover:bg-emerald-950/50 cursor-pointer disabled:opacity-50"
            title="Direct download .pdf file via jsPDF generator"
          >
            {isGeneratingPdf ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
            ) : (
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span className="hidden sm:inline">Direct File Export</span>
          </button>

          {/* Copy plan */}
          <button
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-900/60 bg-[#0c1612] px-3 py-2 text-xs font-semibold text-gray-200 transition-colors hover:bg-emerald-950/50 cursor-pointer"
            title="Copy plan text to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-gray-400" />
                <span className="hidden sm:inline">Copy Text</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Plan Header Card */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-emerald-900/60 bg-gradient-to-br from-[#0c1612] to-[#07100c] p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                {user.goal}
              </span>
              <span className="rounded-md bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-300">
                {user.intensity} Intensity
              </span>
              {isUpdatedRevision && (
                <span className="rounded-md bg-teal-500/20 px-2.5 py-0.5 text-xs font-bold text-teal-300 border border-teal-500/30">
                  Revision #{activePlan.revision || 2} (Feedback Updated)
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
              {activePlan.planTitle}
            </h1>

            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-gray-300 leading-relaxed">
              {activePlan.planSummary}
            </p>
          </div>

          {/* User profile capsule */}
          <div className="rounded-xl border border-emerald-900/50 bg-[#09120e] p-3 text-right">
            <div className="text-xs font-bold text-white">{user.name}</div>
            <div className="text-[11px] font-mono text-emerald-400">ID: {user.id}</div>
            <div className="mt-1 text-[11px] text-gray-400">
              {user.age} yrs • {user.weight} kg
            </div>
          </div>
        </div>

        {/* Toggle between original and updated version if updated exists (Screen only) */}
        {user.updatedPlan && (
          <div className="no-print mt-5 flex items-center justify-between border-t border-emerald-950/60 pt-4">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <History className="h-4 w-4 text-emerald-400" />
              <span>
                {showOriginalComparison
                  ? 'Currently previewing: Original 7-Day Plan'
                  : 'Currently viewing: AI Updated Plan (Feedback incorporated)'}
              </span>
            </div>
            <button
              onClick={() => setShowOriginalComparison(!showOriginalComparison)}
              className="rounded-lg border border-emerald-800/40 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 transition-colors cursor-pointer"
            >
              {showOriginalComparison ? 'Switch to Updated Plan →' : 'View Original Plan'}
            </button>
          </div>
        )}
      </div>

      {/* Scenario 3: Nutrition & Recovery Tip Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Nutrition Tip */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-900/50 bg-[#0a1510] p-4 shadow-sm">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Apple className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Practical Nutrition Advice
              </h3>
              <p className="text-[11px] text-gray-400">Tailored for {user.goal}</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-gray-200">
            {activePlan.nutritionTip}
          </p>
        </div>

        {/* Recovery Tip */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-900/50 bg-[#0a1510] p-4 shadow-sm">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
              <Moon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400">
                Rest & Recovery Protocol
              </h3>
              <p className="text-[11px] text-gray-400">Optimal for {user.intensity} intensity</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-gray-200">
            {activePlan.recoveryTip}
          </p>
        </div>
      </div>

      {/* View Mode Switcher (Screen only) */}
      <div className="no-print mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-white sm:text-lg flex items-center gap-2">
          <span>7-Day Schedule</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            {activePlan.days.length} Days
          </span>
        </h2>

        <div className="flex rounded-lg border border-emerald-900/60 bg-[#07100c] p-0.5 text-xs">
          <button
            onClick={() => setViewMode('cards')}
            className={`rounded-md px-3 py-1 font-medium transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Day View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`rounded-md px-3 py-1 font-medium transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            All 7 Days
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`rounded-md px-3 py-1 font-medium transition-all cursor-pointer ${
              viewMode === 'raw'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Raw Format
          </button>
        </div>
      </div>

      {/* Screen Interactive Mode (hidden in print) */}
      <div className="print:hidden">
        {/* Mode 1: Interactive Day Cards */}
        {viewMode === 'cards' && (
          <div className="space-y-4">
            {/* Day Selector Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {activePlan.days.map((day, idx) => {
                const isSelected = selectedDayIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`flex shrink-0 flex-col items-center rounded-xl border px-3.5 py-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/15 shadow-sm shadow-emerald-500/20'
                        : 'border-emerald-950/60 bg-[#0c1612]/70 hover:border-emerald-800 hover:bg-[#0c1612]'
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-emerald-400' : 'text-gray-400'}`}>
                      Day {day.day}
                    </span>
                    <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {day.isRestDay ? 'Rest & Reset' : `${day.estimatedDurationMinutes}m`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Day Detail Box */}
            {currentDay && (
              <div className="rounded-2xl border border-emerald-900/60 bg-[#0c1612] p-5 sm:p-6 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950/70 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        {currentDay.dayName || `Day ${currentDay.day}`}
                      </span>
                      {currentDay.isRestDay && (
                        <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-500/30">
                          Active Recovery
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 text-xl font-bold text-white">
                      {currentDay.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-300">
                      Focus: <span className="text-emerald-300">{currentDay.focus}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-lg bg-[#07100c] px-3 py-1.5 text-xs text-gray-300 border border-emerald-950">
                    <Clock className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Est. {currentDay.estimatedDurationMinutes || 40} mins</span>
                  </div>
                </div>

                {/* Warmup */}
                {currentDay.warmup && (
                  <div className="mt-4 rounded-xl border border-emerald-950 bg-[#07120c] p-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <Flame className="h-3.5 w-3.5" />
                      <span>Dynamic Warm-Up (5-10 mins)</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-300 leading-relaxed">
                      {currentDay.warmup}
                    </p>
                  </div>
                )}

                {/* Exercise List with Interactive Checkbox */}
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Target Exercises ({currentDay.exercises?.length || 0})
                    </h4>
                    <span className="text-[11px] text-gray-500">
                      Click checkbox when completed
                    </span>
                  </div>

                  {currentDay.exercises?.map((exercise, exIdx) => {
                    const checkKey = `d${selectedDayIndex}-e${exIdx}`;
                    const isDone = completedExercises[checkKey];

                    return (
                      <div
                        key={exIdx}
                        onClick={() => toggleExerciseCheck(selectedDayIndex, exIdx)}
                        className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                          isDone
                            ? 'border-emerald-500/40 bg-emerald-950/20 opacity-80'
                            : 'border-emerald-950/70 bg-[#07100c] hover:border-emerald-800 hover:bg-[#091510]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                              isDone
                                ? 'border-emerald-400 bg-emerald-500 text-black'
                                : 'border-emerald-900 bg-[#0a1611]'
                            }`}
                          >
                            {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>

                          <div>
                            <h5
                              className={`text-sm font-semibold transition-all ${
                                isDone ? 'text-gray-400 line-through' : 'text-white'
                              }`}
                            >
                              {exercise.name}
                            </h5>
                            {exercise.notes && (
                              <p className="mt-1 text-xs text-gray-400">
                                💡 {exercise.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="rounded-md bg-emerald-950/50 px-2 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-900/60">
                            {exercise.sets}
                          </div>
                          <div className="mt-1 text-[11px] text-gray-400">
                            {exercise.reps}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cooldown */}
                {currentDay.cooldown && (
                  <div className="mt-5 rounded-xl border border-sky-950/60 bg-[#061118]/60 p-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                      <Moon className="h-3.5 w-3.5" />
                      <span>Cooldown & Tissue Recovery</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-300 leading-relaxed">
                      {currentDay.cooldown}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mode 2: Full 7-Day Table */}
        {viewMode === 'table' && (
          <div className="space-y-4">
            {activePlan.days.map((day, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-emerald-950/80 bg-[#0c1612] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-950 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                      {day.dayName || `Day ${day.day}`}
                    </span>
                    <span className="font-bold text-white text-sm">{day.title}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Focus: {day.focus} • {day.estimatedDurationMinutes} mins
                  </span>
                </div>

                {day.warmup && (
                  <p className="mt-2 text-xs text-emerald-300/90">
                    <span className="font-semibold">Warm-up:</span> {day.warmup}
                  </p>
                )}

                <div className="mt-3 divide-y divide-emerald-950/60">
                  {day.exercises?.map((ex, exI) => (
                    <div key={exI} className="flex items-center justify-between py-2 text-xs">
                      <span className="font-medium text-gray-200">
                        {exI + 1}. {ex.name}
                      </span>
                      <span className="font-mono text-emerald-400">
                        {ex.sets} × {ex.reps}
                      </span>
                    </div>
                  ))}
                </div>

                {day.cooldown && (
                  <p className="mt-2 text-xs text-sky-300/80">
                    <span className="font-semibold">Cooldown:</span> {day.cooldown}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Mode 3: Raw / Preformatted Output (matches result.html from project spec) */}
        {viewMode === 'raw' && (
          <div className="rounded-xl border border-emerald-950 bg-[#060c09] p-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-950">
              <span className="text-xs font-mono text-emerald-400">Plain Plan Export &lt;pre&gt;</span>
              <button
                onClick={handleCopyText}
                className="text-xs font-semibold text-emerald-400 hover:underline"
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
            <pre className="mt-3 max-h-96 overflow-auto font-mono text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(activePlan, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Print-Only Layout: Renders all 7 days with clean printable tables when printing to PDF */}
      <div className="hidden print:block space-y-4">
        <div className="border-b border-gray-300 pb-2 mb-4">
          <h2 className="text-base font-bold uppercase tracking-wider text-emerald-800">
            Complete 7-Day Workout & Recovery Schedule
          </h2>
          <p className="text-xs text-gray-600">
            Follow this day-wise routine tailored to your target goal of {user.goal}.
          </p>
        </div>

        {activePlan.days.map((day, idx) => (
          <div
            key={idx}
            className="print-avoid-break rounded-lg border border-gray-300 p-4 bg-white"
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2">
              <div>
                <span className="font-bold text-sm text-emerald-800 mr-2">
                  {day.dayName || `Day ${day.day}`}:
                </span>
                <span className="font-semibold text-sm text-gray-900">{day.title}</span>
                {day.isRestDay && (
                  <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">
                    Active Recovery
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-600 font-medium">
                ~{day.estimatedDurationMinutes || 40} mins • Focus: {day.focus}
              </span>
            </div>

            {day.warmup && (
              <div className="mb-2 text-xs">
                <span className="font-bold text-emerald-800">Dynamic Warm-Up: </span>
                <span className="text-gray-700">{day.warmup}</span>
              </div>
            )}

            {day.exercises && day.exercises.length > 0 && (
              <table className="w-full text-left text-xs border border-gray-200 my-2">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-700">
                    <th className="py-1 px-2 w-8">#</th>
                    <th className="py-1 px-2">Exercise</th>
                    <th className="py-1 px-2 w-24">Sets</th>
                    <th className="py-1 px-2 w-28">Reps / Time</th>
                    <th className="py-1 px-2">Trainer Form Cue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-800">
                  {day.exercises.map((ex, exIdx) => (
                    <tr key={exIdx} className={exIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-1 px-2 font-bold text-gray-500">{exIdx + 1}</td>
                      <td className="py-1 px-2 font-semibold text-gray-900">{ex.name}</td>
                      <td className="py-1 px-2 text-gray-700">{ex.sets}</td>
                      <td className="py-1 px-2 text-gray-700">{ex.reps}</td>
                      <td className="py-1 px-2 text-gray-600 italic text-[11px]">{ex.notes || 'Strict control'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {day.cooldown && (
              <div className="mt-2 text-xs">
                <span className="font-bold text-sky-800">Cooldown & Recovery: </span>
                <span className="text-gray-700">{day.cooldown}</span>
              </div>
            )}
          </div>
        ))}

        {/* Coach notes in print view */}
        <div className="print-avoid-break mt-4 rounded-lg border border-gray-300 p-3 bg-gray-50 text-xs">
          <div className="font-bold text-gray-900 mb-1">Coach Advice & Consistency Strategy:</div>
          <p className="text-gray-700 leading-relaxed">
            {activePlan.coachingNotes || 'Stay consistent and listen to your body. Gradual progression leads to lifelong results.'}
          </p>
          <div className="mt-2 pt-2 border-t border-gray-200 text-[9px] text-gray-500">
            Disclaimer: FitBuddy provides general fitness information, not medical advice. Consult a healthcare professional before beginning any new exercise routine.
          </div>
        </div>
      </div>

      {/* Scenario 2: Feedback & Dynamic Plan Revision Box (Screen only) */}
      <div className="no-print mt-8 rounded-2xl border border-emerald-900/60 bg-gradient-to-b from-[#0c1612] to-[#07100c] p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <h3 className="text-base font-bold text-white sm:text-lg">
            Scenario 2: Refine or Update Plan with AI Feedback
          </h3>
        </div>

        <p className="text-xs text-gray-300 mb-4">
          Need adjustments? Tell Gemini what to modify (e.g. adding yoga, more cardio, swapping exercises, or scheduling an extra rest day). The AI will regenerate your plan while keeping your core profile intact.
        </p>

        {/* Quick Suggestion Chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            'Include 15 minutes of Yoga & mobility',
            'More focus on Cardio & Core',
            'Include an extra Rest Day',
            'No Dumbbells (Bodyweight only)',
            'Lower back & Knee friendly',
            'Shorten workouts to 30 mins',
          ].map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyPresetFeedback(chip)}
              className="rounded-full border border-emerald-900/60 bg-emerald-950/30 px-3 py-1 text-xs text-emerald-300 transition-colors hover:border-emerald-600 hover:bg-emerald-900/40"
            >
              + {chip}
            </button>
          ))}
        </div>

        {feedbackError && (
          <div className="mb-4 rounded-xl border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-300">
            {feedbackError}
          </div>
        )}

        <form onSubmit={handleFeedbackSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="e.g. I have slight knee pain so substitute jump squats with glute bridges, and add 10 mins of gentle yoga on Thursday..."
              className="w-full rounded-xl border border-emerald-900/60 bg-[#07100c] p-3 text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-gray-400">
              {user.feedbackList && user.feedbackList.length > 0 && (
                <span>Previous updates: {user.feedbackList.length} feedback revisions logged</span>
              )}
            </span>

            <button
              type="submit"
              disabled={isSubmittingFeedback || !feedbackText.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-gray-950 transition-all hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmittingFeedback ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-gray-950" />
                  <span>Gemini Updating Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-gray-950" />
                  <span>Update Plan with AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
