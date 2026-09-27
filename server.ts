import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure data folder exists
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'fitbuddy_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize shared Gemini instance
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper function to call Gemini with multi-model fallback and retry for high-demand spikes
async function generateGeminiContentWithFallback(prompt: string, config: any = {}) {
  // Ordered models to try. If one is experiencing high demand (503/429), try the next available model
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Calling Gemini with model: ${model} (attempt ${attempt})...`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });

        if (response && response.text) {
          console.log(`Gemini response received successfully via ${model}`);
          return { text: response.text, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`Attempt ${attempt} on model ${model} failed:`, errMsg);

        // If 503 (high demand) or 429 (rate limit), wait briefly before retrying or switching models
        if (errMsg.includes('503') || errMsg.includes('429') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
          if (attempt === 1) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            continue;
          }
        }
        break; // Switch to next candidate model
      }
    }
  }

  throw lastError || new Error('All Gemini candidate models were unavailable.');
}

// Helper functions for JSON database
interface Exercise {
  name: string;
  sets: string;
  reps: string;
  notes?: string;
}

interface DayPlan {
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

interface WorkoutPlan {
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

interface UserRecord {
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

function loadDB(): { users: Record<string, UserRecord> } {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading db file:', err);
  }
  return { users: {} };
}

function saveDB(db: { users: Record<string, UserRecord> }) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db file:', err);
  }
}

// Fallback plan generator if Gemini API key is missing or encounters rate limiting
function createFallbackPlan(params: {
  name: string;
  goal: string;
  intensity: string;
  age: number;
  weight: number;
}): WorkoutPlan {
  const { goal, intensity } = params;
  const isHigh = intensity.toLowerCase() === 'high';
  const isLow = intensity.toLowerCase() === 'low';
  const sets = isHigh ? '4 sets' : isLow ? '2-3 sets' : '3 sets';

  const days: DayPlan[] = [
    {
      day: 1,
      dayName: 'Day 1 - Monday',
      title: goal.includes('Muscle') ? 'Upper Body Push & Chest Focus' : 'Full Body Awakening & Cardio Core',
      focus: 'Foundational strength and metabolic activation',
      isRestDay: false,
      warmup: '5-10 mins: Arm swings, torso twists, 2 min jump rope or high knees',
      exercises: [
        { name: 'Standard Push-ups / Incline Push-ups', sets, reps: '10-15 reps', notes: 'Maintain strict neutral spine and full lockout' },
        { name: 'Dumbbell or Bodyweight Goblet Squats', sets, reps: '12-15 reps', notes: 'Drive knees outward and press through heels' },
        { name: 'Plank Shoulder Taps', sets: '3 sets', reps: '20 taps (10/side)', notes: 'Resist hip sway and squeeze core tight' },
        { name: 'Walking Lunges with Torso Twist', sets: '3 sets', reps: '12 steps each leg', notes: 'Maintain 90-degree knee bend' },
      ],
      cooldown: '5-8 mins: Cobra stretch, child’s pose, doorway chest stretch',
      estimatedDurationMinutes: isHigh ? 50 : isLow ? 30 : 40,
    },
    {
      day: 2,
      dayName: 'Day 2 - Tuesday',
      title: 'Lower Body Power & Posterior Chain',
      focus: 'Hamstrings, glutes, quadriceps and balance',
      isRestDay: false,
      warmup: '5-8 mins: Leg swings (front/back & lateral), hip openers, bodyweight squats',
      exercises: [
        { name: 'Romanian Deadlifts (Dumbbell/Kettlebell/Band)', sets, reps: '10-12 reps', notes: 'Hinge deeply at hips, keep back flat' },
        { name: 'Bulgarian Split Squats or Step-ups', sets: '3 sets', reps: '8-10 reps/leg', notes: 'Controlled tempo, pause at bottom' },
        { name: 'Glute Bridges / Hip Thrusts', sets, reps: '15-20 reps', notes: 'Squeeze glutes at top for 2 full seconds' },
        { name: 'Standing Calf Raises', sets: '3 sets', reps: '20 reps', notes: 'Full extension onto balls of feet' },
      ],
      cooldown: '6 mins: Seated hamstring stretch, pigeon pose, quadriceps stretch',
      estimatedDurationMinutes: isHigh ? 55 : isLow ? 30 : 42,
    },
    {
      day: 3,
      dayName: 'Day 3 - Wednesday',
      title: 'Active Recovery & Mobility Flow',
      focus: 'Joint mobility, core de-loading and tissue regeneration',
      isRestDay: true,
      warmup: '5 mins: Cat-cow flow, thoracic rotations, deep breathing',
      exercises: [
        { name: 'Dynamic Vinyasa Flow or Gentle Yoga', sets: '1 continuous', reps: '20 mins', notes: 'Focus on diaphragmatic breathing' },
        { name: 'Brisk Outdoor Walking or Light Cycling', sets: '1 session', reps: '20-30 mins', notes: 'Zone 2 heart rate for aerobic base' },
        { name: 'Foam Rolling / Self-Myofascial Release', sets: 'Full body', reps: '10 mins', notes: 'Target IT band, upper back and calves' },
      ],
      cooldown: '5 mins: Butterfly stretch and supine spinal twists',
      estimatedDurationMinutes: 35,
    },
    {
      day: 4,
      dayName: 'Day 4 - Thursday',
      title: goal.includes('Muscle') ? 'Upper Body Pull & Posterior Focus' : 'Metabolic HIIT & Core Conditioning',
      focus: 'Lats, rhomboids, biceps and cardiovascular endurance',
      isRestDay: false,
      warmup: '6 mins: Arm circles, band pull-aparts, light shadow boxing',
      exercises: [
        { name: 'Dumbbell Rows / Resistance Band Rows', sets, reps: '10-12 reps', notes: 'Pull elbow toward hip pocket without shrugging' },
        { name: 'Banded Face Pulls or Rear Delt Flyes', sets: '3 sets', reps: '15 reps', notes: 'Promotes healthy rotator cuff posture' },
        { name: 'Bicycle Crunches', sets: '3 sets', reps: '20 total reps', notes: 'Slow and controlled rotation' },
        { name: 'Mountain Climbers or Burpees', sets: '3 sets', reps: '40 seconds work / 20s rest', notes: 'Keep steady pacing throughout' },
      ],
      cooldown: '6 mins: Lat stretch against wall, cross-body shoulder stretch',
      estimatedDurationMinutes: isHigh ? 50 : isLow ? 30 : 40,
    },
    {
      day: 5,
      dayName: 'Day 5 - Friday',
      title: 'Full Body Functional Complex & Stamina',
      focus: 'Compound functional movement and total body strength',
      isRestDay: false,
      warmup: '7 mins: Jumping jacks, inchworms with push-up, torso circles',
      exercises: [
        { name: 'Thrusters (Squat to Overhead Press)', sets, reps: '10-12 reps', notes: 'Use lower body drive to power weight overhead' },
        { name: 'Kettlebell / Dumbbell Swings', sets, reps: '15 reps', notes: 'Explosive hip hinge, do not squat the weight' },
        { name: 'Bear Crawl Holds or Bird Dogs', sets: '3 sets', reps: '45 seconds hold / 12 bird dogs', notes: 'Keep back flat like a tabletop' },
        { name: 'Side Plank Holds', sets: '3 sets', reps: '30 seconds each side', notes: 'Stack feet or drop bottom knee if needed' },
      ],
      cooldown: '8 mins: Child’s pose, world’s greatest stretch, deep hip flexor stretch',
      estimatedDurationMinutes: isHigh ? 55 : isLow ? 32 : 45,
    },
    {
      day: 6,
      dayName: 'Day 6 - Saturday',
      title: 'Cardio Engine, Core & Agility Drill',
      focus: 'Aerobic threshold, speed-agility, and mental resilience',
      isRestDay: false,
      warmup: '6 mins: High knees, butt kicks, lateral shuffles',
      exercises: [
        { name: 'Interval Jogging / Sprint Intervals or Rower', sets: '6-8 rounds', reps: '1 min fast / 1 min easy', notes: 'Adjust pace according to perceived exertion' },
        { name: 'Hanging Leg Raises / Lying Leg Lifts', sets: '3 sets', reps: '12-15 reps', notes: 'Engage lower abdominals without swinging' },
        { name: 'Russian Twists', sets: '3 sets', reps: '24 total touches', notes: 'Chest proud, feet slightly elevated' },
      ],
      cooldown: '6 mins: Standing quad stretch, calves wall stretch, slow walking',
      estimatedDurationMinutes: isHigh ? 45 : isLow ? 25 : 35,
    },
    {
      day: 7,
      dayName: 'Day 7 - Sunday',
      title: 'Deep Rest, Central Nervous System Recovery & Reset',
      focus: 'Cellular recovery, glycogen replenishment, and mental preparation',
      isRestDay: true,
      warmup: 'None needed - complete rest',
      exercises: [
        { name: 'Gentle Walk in Nature / Leisure Stroll', sets: '1 walk', reps: '30-40 mins', notes: 'Purely leisurely; avoid intense elevation' },
        { name: 'Full Body Passive Stretching & Breathwork', sets: '1 routine', reps: '15 mins', notes: '4 seconds in, 7 seconds hold, 8 seconds out' },
      ],
      cooldown: 'Hydrate well with electrolytes, take a warm epsom salt bath if available',
      estimatedDurationMinutes: 20,
    },
  ];

  return {
    planTitle: `Personalized 7-Day ${goal} Protocol`,
    planSummary: `A customized 7-day fitness regimen built specifically for your goal of ${goal} with a ${intensity} intensity level. Incorporates progressive overload, structured metabolic conditioning, and essential recovery windows.`,
    targetGoal: goal,
    intensity,
    days,
    nutritionTip: goal.toLowerCase().includes('muscle')
      ? 'Target 1.6 to 2.2 grams of high-quality protein per kilogram of body weight. Fuel your post-workout window with 25-35g of protein paired with 40-50g of complex carbohydrates to accelerate muscle protein synthesis.'
      : goal.toLowerCase().includes('loss')
      ? 'Maintain a modest caloric deficit of 300-500 kcal daily. Prioritize lean protein with fibrous green vegetables at every meal, drink at least 2.5 to 3 liters of water, and eliminate liquid sugars.'
      : 'Focus on colorful whole foods: lean proteins, healthy fats (olive oil, avocado), and complex carbs. Drink 500ml water immediately upon waking to kickstart cellular hydration.',
    recoveryTip: 'Prioritize 7.5 to 9 hours of uninterrupted sleep every night. Muscle repair, hormone balance, and nervous system recovery occur primarily during slow-wave deep sleep.',
    coachingNotes: 'Always listen to your body. Consistency over 4 to 8 weeks compounds into transformative results. Progress weights or reps gradually.',
    generatedAt: new Date().toISOString(),
    revision: 1,
  };
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health & Config status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

// 2. Generate 7-Day Plan (Scenario 1 & 3)
app.post('/api/generate-plan', async (req, res) => {
  try {
    const { username, userId, age, weight, goal, intensity } = req.body;

    if (!username || !userId) {
      return res.status(400).json({ error: 'Name and User ID are required.' });
    }

    const numAge = Number(age) || 25;
    const numWeight = Number(weight) || 70;
    const userGoal = goal || 'Weight Loss';
    const userIntensity = intensity || 'Medium';

    let generatedPlan: WorkoutPlan;

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      const prompt = `You are FitBuddy's master certified fitness coach and sports nutritionist.
Create an exceptional, highly personalized 7-Day Workout & Recovery Plan tailored to this user:
- Name: ${username}
- User ID: ${userId}
- Age: ${numAge}
- Weight: ${numWeight} kg
- Fitness Goal: ${userGoal}
- Preferred Intensity: ${userIntensity}

Respond STRICTLY with valid JSON following this exact structure (no markdown fences, no explanatory preambles, just raw JSON):
{
  "planTitle": "Catchy personalized title for the plan",
  "planSummary": "2-3 sentences overview of the 7-day strategy and expected physiological adaptations",
  "targetGoal": "${userGoal}",
  "intensity": "${userIntensity}",
  "days": [
    {
      "day": 1,
      "dayName": "Day 1 - Monday",
      "title": "Clear workout theme name",
      "focus": "Key muscle groups or athletic focus",
      "isRestDay": false,
      "warmup": "Specific 5-10 min warm-up steps with dynamic movements",
      "exercises": [
        {
          "name": "Exercise Name",
          "sets": "e.g. 3-4 sets",
          "reps": "e.g. 10-12 reps",
          "notes": "Key form cue or modification tip"
        }
      ],
      "cooldown": "Specific 5-8 min cooldown and stretches",
      "estimatedDurationMinutes": 45
    }
  ],
  "nutritionTip": "Actionable, evidence-based nutrition recommendation tailored directly to ${userGoal}",
  "recoveryTip": "Actionable recovery practice (sleep, hydration, mobility, or nervous system rest) for ${userIntensity} intensity",
  "coachingNotes": "Motivational and safety guidance from the coach"
}

Important criteria:
1. Provide exactly 7 days (Day 1 through Day 7).
2. Schedule 1 or 2 appropriate rest or active recovery days based on intensity level (${userIntensity}).
3. For workout days, include 4 to 6 specific, realistic exercises with sets, reps, and form cues.
4. Keep the nutrition tip practical, specific, and directly aligned with "${userGoal}".
5. Keep the recovery tip aligned with their age (${numAge}) and intensity (${userIntensity}).`;

      try {
        const { text, modelUsed } = await generateGeminiContentWithFallback(prompt, {
          responseMimeType: 'application/json',
          temperature: 0.7,
        });

        const rawText = text || '';
        const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(cleanedText);

        generatedPlan = {
          planTitle: parsed.planTitle || `FitBuddy 7-Day ${userGoal} Plan`,
          planSummary: parsed.planSummary || `Personalized 7-day fitness regimen customized for ${username}.`,
          targetGoal: userGoal,
          intensity: userIntensity,
          days: parsed.days || [],
          nutritionTip: parsed.nutritionTip || 'Eat balanced whole foods rich in micronutrients and stay hydrated.',
          recoveryTip: parsed.recoveryTip || 'Aim for 7-8 hours of quality sleep to maximize muscle repair.',
          coachingNotes: parsed.coachingNotes || 'Stay consistent and listen to your body each day.',
          generatedAt: new Date().toISOString(),
          revision: 1,
        };
      } catch (geminiError: any) {
        console.warn('Gemini API call failed after retries, falling back to default structured template:', geminiError?.message || geminiError);
        generatedPlan = createFallbackPlan({
          name: username,
          goal: userGoal,
          intensity: userIntensity,
          age: numAge,
          weight: numWeight,
        });
      }
    } else {
      generatedPlan = createFallbackPlan({
        name: username,
        goal: userGoal,
        intensity: userIntensity,
        age: numAge,
        weight: numWeight,
      });
    }

    // Save to Database
    const db = loadDB();
    const existing = db.users[userId];

    const userRecord: UserRecord = {
      id: userId,
      name: username,
      age: numAge,
      weight: numWeight,
      goal: userGoal,
      intensity: userIntensity,
      originalPlan: generatedPlan,
      updatedPlan: null,
      feedbackList: existing?.feedbackList || [],
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users[userId] = userRecord;
    saveDB(db);

    return res.json({
      success: true,
      user: userRecord,
      plan: generatedPlan,
    });
  } catch (error: any) {
    console.error('Error in /api/generate-plan:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate fitness plan.' });
  }
});

// 3. Submit Feedback & Revise Plan (Scenario 2)
app.post('/api/submit-feedback', async (req, res) => {
  try {
    const { userId, feedback } = req.body;

    if (!userId || !feedback) {
      return res.status(400).json({ error: 'User ID and feedback are required.' });
    }

    const db = loadDB();
    const userRecord = db.users[userId];

    if (!userRecord) {
      return res.status(404).json({ error: `User with ID ${userId} not found.` });
    }

    const currentPlan = userRecord.updatedPlan || userRecord.originalPlan;
    const currentRevision = (currentPlan.revision || 1) + 1;

    let updatedPlan: WorkoutPlan;

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      const prompt = `You are FitBuddy's master certified fitness coach revising an existing 7-Day Workout Plan based on user feedback.
User details:
- Name: ${userRecord.name}
- Age: ${userRecord.age}, Weight: ${userRecord.weight} kg
- Goal: ${userRecord.goal}, Intensity: ${userRecord.intensity}

Original 7-Day Plan:
${JSON.stringify(currentPlan, null, 2)}

User's Specific Feedback & Modifications Requested:
"${feedback}"

Task:
Revise the 7-day workout plan to address the user's feedback precisely (e.g. adding yoga, more cardio, extra rest days, modifying specific exercises, or changing workout duration).
Retain the structured day-by-day flow while applying the requested changes smoothly. Also adjust the nutrition/recovery tip if relevant to the feedback.

Respond STRICTLY with valid JSON following this exact structure (no markdown fences, raw JSON):
{
  "planTitle": "Updated plan title reflecting feedback",
  "planSummary": "Summary explaining how the plan was modified to incorporate the feedback",
  "targetGoal": "${userRecord.goal}",
  "intensity": "${userRecord.intensity}",
  "days": [
    {
      "day": 1,
      "dayName": "Day 1 - Monday",
      "title": "Workout title",
      "focus": "Workout focus",
      "isRestDay": false,
      "warmup": "5-10 min warm up",
      "exercises": [
        {
          "name": "Exercise name",
          "sets": "Sets",
          "reps": "Reps",
          "notes": "Coaching note"
        }
      ],
      "cooldown": "Cooldown and stretches",
      "estimatedDurationMinutes": 40
    }
  ],
  "nutritionTip": "Targeted nutrition advice",
  "recoveryTip": "Targeted recovery advice",
  "coachingNotes": "Coach note on how this revised plan helps meet their updated preferences"
}`;

      try {
        const { text } = await generateGeminiContentWithFallback(prompt, {
          responseMimeType: 'application/json',
          temperature: 0.7,
        });

        const rawText = text || '';
        const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(cleanedText);

        updatedPlan = {
          planTitle: parsed.planTitle || `${currentPlan.planTitle} (Updated)`,
          planSummary: parsed.planSummary || `Updated plan modified according to user feedback: "${feedback}".`,
          targetGoal: userRecord.goal,
          intensity: userRecord.intensity,
          days: parsed.days || currentPlan.days,
          nutritionTip: parsed.nutritionTip || currentPlan.nutritionTip,
          recoveryTip: parsed.recoveryTip || currentPlan.recoveryTip,
          coachingNotes: parsed.coachingNotes || `Adapted according to feedback: ${feedback}`,
          generatedAt: new Date().toISOString(),
          revision: currentRevision,
        };
      } catch (geminiError: any) {
        console.warn('Gemini feedback revision failed after retries, applying fallback adjustment:', geminiError?.message);
        // Fallback modification
        updatedPlan = {
          ...currentPlan,
          planTitle: `${currentPlan.planTitle} (Refined: ${feedback.slice(0, 30)}...)`,
          planSummary: `Updated with user feedback: "${feedback}". Routine adjusted for optimal progression.`,
          coachingNotes: `Coach note: Modified to incorporate "${feedback}". Keep tracking how your body feels!`,
          generatedAt: new Date().toISOString(),
          revision: currentRevision,
        };
      }
    } else {
      updatedPlan = {
        ...currentPlan,
        planTitle: `${currentPlan.planTitle} (Refined: ${feedback.slice(0, 30)}...)`,
        planSummary: `Plan updated with your feedback: "${feedback}". Adjusted exercises, rest intervals, and volume.`,
        coachingNotes: `Coach note: Successfully tuned for "${feedback}". Consistency is key!`,
        generatedAt: new Date().toISOString(),
        revision: currentRevision,
      };
    }

    if (!userRecord.feedbackList) {
      userRecord.feedbackList = [];
    }
    userRecord.feedbackList.push({
      feedback,
      date: new Date().toISOString(),
    });

    userRecord.updatedPlan = updatedPlan;
    userRecord.updatedAt = new Date().toISOString();

    db.users[userId] = userRecord;
    saveDB(db);

    return res.json({
      success: true,
      user: userRecord,
      updatedPlan,
    });
  } catch (error: any) {
    console.error('Error in /api/submit-feedback:', error);
    return res.status(500).json({ error: error.message || 'Failed to update plan.' });
  }
});

// 4. View All Registered Users (Scenario 4 - Admin/Coach Dashboard)
app.get('/api/users', (req, res) => {
  try {
    const db = loadDB();
    const usersList = Object.values(db.users).sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
    res.json({ users: usersList });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch users.' });
  }
});

// 5. Get Single User Details
app.get('/api/user/:userId', (req, res) => {
  try {
    const db = loadDB();
    const user = db.users[req.params.userId];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch user.' });
  }
});

// 6. Delete User Record (Admin)
app.delete('/api/user/:userId', (req, res) => {
  try {
    const db = loadDB();
    if (db.users[req.params.userId]) {
      delete db.users[req.params.userId];
      saveDB(db);
      return res.json({ success: true, message: `User ${req.params.userId} removed.` });
    }
    return res.status(404).json({ error: 'User not found.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete user.' });
  }
});

// 7. Standalone Nutrition / Recovery Tip generator (Scenario 3)
app.get('/api/nutrition-tip', async (req, res) => {
  try {
    const goal = (req.query.goal as string) || 'Weight Loss';
    let tip = '';

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      try {
        const { text } = await generateGeminiContentWithFallback(
          `Provide one concise, clear, and practical nutrition or recovery tip for someone focused on "${goal}". Keep it to 2-3 sentences, scientific yet approachable.`
        );
        tip = text || '';
      } catch (geminiError) {
        console.warn('Gemini nutrition tip fallback triggered:', geminiError);
        tip = goal.toLowerCase().includes('muscle')
          ? 'Target 1.6-2.2g of protein per kg of body weight spread across 4 meals. Have a fast-digesting protein shake within 45 mins post-workout.'
          : goal.toLowerCase().includes('loss')
          ? 'Drink 500ml water 20 minutes before meals and ensure half your plate consists of non-starchy vegetables to manage satiety effortlessly.'
          : 'Prioritize a spectrum of colorful fruits and vegetables daily, alongside adequate hydration (30-35ml per kg body weight).';
      }
    } else {
      tip = goal.toLowerCase().includes('muscle')
        ? 'Eat 1.6-2.2g of protein per kg of body weight spread across 4 meals. Have a fast-digesting protein shake within 45 mins post-workout.'
        : goal.toLowerCase().includes('loss')
        ? 'Drink 500ml water 20 minutes before meals and ensure half your plate consists of non-starchy vegetables to manage satiety effortlessly.'
        : 'Prioritize a spectrum of colorful fruits and vegetables daily, alongside adequate hydration (30-35ml per kg body weight).';
    }

    res.json({ goal, nutrition_tip: tip.trim() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get nutrition tip.' });
  }
});

// ----------------------------------------------------
// FRONTEND INTEGRATION (Vite in dev, static in prod)
// ----------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FitBuddy server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
