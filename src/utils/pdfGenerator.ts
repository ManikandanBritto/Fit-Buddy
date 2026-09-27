import { jsPDF } from 'jspdf';

export interface ExerciseItem {
  name: string;
  sets: string;
  reps: string;
  notes?: string;
}

export interface DayPlanItem {
  day: number;
  dayName: string;
  title: string;
  focus: string;
  isRestDay: boolean;
  warmup: string;
  exercises: ExerciseItem[];
  cooldown: string;
  estimatedDurationMinutes: number;
}

export interface PlanData {
  planTitle: string;
  planSummary: string;
  targetGoal: string;
  intensity: string;
  days: DayPlanItem[];
  nutritionTip: string;
  recoveryTip: string;
  coachingNotes?: string;
  generatedAt?: string;
  revision?: number;
}

export interface UserProfileData {
  name: string;
  userId: string;
  age: number | string;
  weight: number | string;
  goal: string;
  intensity: string;
}

export function generateFitnessPlanPDF(user: UserProfileData, plan: PlanData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = 14;

  // Helper function to check page boundaries and add page
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 16;
      renderHeaderMini();
    }
  };

  const renderHeaderMini = () => {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 8, 'F');
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 7.5, pageWidth, 0.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('FITBUDDY • 7-DAY AI WORKOUT & NUTRITION PROTOCOL', margin, 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text(`User: ${user.name} (${user.userId})`, pageWidth - margin, 5.5, { align: 'right' });
    y = 14;
  };

  // ---------------------------------------------
  // COVER / TOP HEADER
  // ---------------------------------------------
  // Dark header block
  doc.setFillColor(8, 20, 16); // deep dark emerald
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Emerald accent top line
  doc.setFillColor(52, 211, 153); // emerald-400
  doc.rect(0, 41, pageWidth, 1, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('FitBuddy', margin, 18);

  // Gemini Badge
  doc.setFillColor(6, 78, 59); // emerald-900
  doc.roundedRect(52, 11, 48, 8, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208); // emerald-200
  doc.setFont('helvetica', 'bold');
  doc.text('POWERED BY GEMINI AI', 56, 16.5);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(209, 213, 219);
  doc.text('Personalized 7-Day Fitness & Nutrition Blueprint', margin, 27);

  // Date
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  const dateStr = plan.generatedAt
    ? new Date(plan.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  doc.text(`Generated: ${dateStr}${plan.revision && plan.revision > 1 ? ` • Revision #${plan.revision}` : ''}`, margin, 34);

  y = 48;

  // ---------------------------------------------
  // USER PROFILE CARD
  // ---------------------------------------------
  doc.setFillColor(248, 250, 252); // light slate background
  doc.setDrawColor(226, 232, 240); // border
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  // Row 1
  const col1 = margin + 4;
  const col2 = margin + 50;
  const col3 = margin + 96;
  const col4 = margin + 140;

  doc.text('Client Name:', col1, y + 7);
  doc.text('User ID:', col2, y + 7);
  doc.text('Age / Weight:', col3, y + 7);
  doc.text('Target Goal:', col4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(String(user.name), col1, y + 13);
  doc.text(String(user.userId), col2, y + 13);
  doc.text(`${user.age} yrs • ${user.weight} kg`, col3, y + 13);

  // Highlight goal
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(`${user.goal} (${user.intensity})`, col4, y + 13);

  // Plan summary line
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const summaryLines = doc.splitTextToSize(`Strategy: ${plan.planSummary}`, contentWidth - 8);
  doc.text(summaryLines[0] || '', col1, y + 19);

  y += 29;

  // ---------------------------------------------
  // NUTRITION & RECOVERY CALLOUTS
  // ---------------------------------------------
  const boxWidth = (contentWidth - 4) / 2;

  // Nutrition Box
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(margin, y, boxWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text('NUTRITION GUIDANCE', margin + 3, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const nutLines = doc.splitTextToSize(plan.nutritionTip || 'Eat whole nutrient-dense foods.', boxWidth - 6);
  doc.text(nutLines.slice(0, 4), margin + 3, y + 12);

  // Recovery Box
  const recX = margin + boxWidth + 4;
  doc.setFillColor(240, 249, 255); // sky-50
  doc.setDrawColor(186, 230, 253); // sky-200
  doc.roundedRect(recX, y, boxWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(3, 105, 161); // sky-700
  doc.text('RECOVERY & SLEEP PROTOCOL', recX + 3, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const recLines = doc.splitTextToSize(plan.recoveryTip || 'Prioritize 7-8 hours quality rest.', boxWidth - 6);
  doc.text(recLines.slice(0, 4), recX + 3, y + 12);

  y += 31;

  // ---------------------------------------------
  // SECTION TITLE: 7-DAY WORKOUT SCHEDULE
  // ---------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('7-DAY WORKOUT SCHEDULE', margin, y);

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 2, margin + contentWidth, y + 2);

  y += 6;

  // ---------------------------------------------
  // RENDER EACH DAY (Day 1 to Day 7)
  // ---------------------------------------------
  plan.days.forEach((dayPlan, idx) => {
    // Estimate height needed for this day block
    const exerciseCount = dayPlan.exercises ? dayPlan.exercises.length : 0;
    const estHeight = 22 + exerciseCount * 6 + 10;
    checkPageBreak(estHeight);

    const isRest = dayPlan.isRestDay;

    // Day Header Bar
    if (isRest) {
      doc.setFillColor(241, 245, 249); // slate-100
      doc.setDrawColor(203, 213, 225);
    } else {
      doc.setFillColor(236, 253, 245); // emerald-50
      doc.setDrawColor(110, 231, 183); // emerald-300
    }
    doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'FD');

    // Day Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(isRest ? 71 : 4, isRest ? 85 : 120, isRest ? 105 : 87);
    doc.text(`${dayPlan.dayName || `Day ${dayPlan.day}`}: ${dayPlan.title}`, margin + 3, y + 4.8);

    // Duration tag
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Duration: ~${dayPlan.estimatedDurationMinutes || 40} mins • Focus: ${dayPlan.focus}`, pageWidth - margin - 3, y + 4.8, { align: 'right' });

    y += 9;

    // Warm-up row
    if (dayPlan.warmup) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(5, 150, 105);
      doc.text('Warm-Up (5-10 min):', margin + 3, y + 3);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const warmupLines = doc.splitTextToSize(dayPlan.warmup, contentWidth - 40);
      doc.text(warmupLines[0] || dayPlan.warmup, margin + 35, y + 3);
      y += 6;
    }

    // Exercises Table Header
    if (dayPlan.exercises && dayPlan.exercises.length > 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin + 2, y, contentWidth - 4, 4.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('EXERCISE', margin + 4, y + 3.2);
      doc.text('SETS', margin + 70, y + 3.2);
      doc.text('REPS / TIME', margin + 95, y + 3.2);
      doc.text('TRAINER CUES & FORM NOTES', margin + 125, y + 3.2);

      y += 5.5;

      dayPlan.exercises.forEach((ex, exIdx) => {
        checkPageBreak(6);

        if (exIdx % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin + 2, y - 1, contentWidth - 4, 5, 'F');
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`${exIdx + 1}. ${ex.name}`, margin + 4, y + 2.5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(ex.sets || '3 sets', margin + 70, y + 2.5);
        doc.text(ex.reps || '10-12', margin + 95, y + 2.5);

        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        const noteStr = ex.notes || 'Focus on controlled tempo';
        const noteTrunc = noteStr.length > 40 ? `${noteStr.substring(0, 38)}...` : noteStr;
        doc.text(noteTrunc, margin + 125, y + 2.5);

        y += 5;
      });
    }

    // Cooldown row
    if (dayPlan.cooldown) {
      y += 1;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(59, 130, 246);
      doc.text('Cooldown & Mobility:', margin + 3, y + 2.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const coolLines = doc.splitTextToSize(dayPlan.cooldown, contentWidth - 40);
      doc.text(coolLines[0] || dayPlan.cooldown, margin + 35, y + 2.5);
      y += 6;
    }

    y += 3;
  });

  // ---------------------------------------------
  // COACHING NOTES & SAFETY DISCLAIMER
  // ---------------------------------------------
  checkPageBreak(25);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Coach Advice & Consistency Strategy:', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const advice = plan.coachingNotes || 'Stay consistent and hydrate. Adjust weight according to form mastery.';
  const coachLines = doc.splitTextToSize(advice, contentWidth - 6);
  doc.text(coachLines.slice(0, 2), margin + 3, y + 10);

  y += 22;

  // Disclaimer line
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  const disclaimer = 'Disclaimer: FitBuddy provides general fitness information, not medical advice. If you have an injury, medical condition, are pregnant, or are unsure whether exercise is appropriate, consult a qualified healthcare or fitness professional.';
  const discLines = doc.splitTextToSize(disclaimer, contentWidth);
  doc.text(discLines, margin, y);

  // ---------------------------------------------
  // FOOTER ON ALL PAGES
  // ---------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`FitBuddy AI Fitness System • Powered by Google Gemini AI`, margin, pageHeight - 5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }

  return doc;
}
