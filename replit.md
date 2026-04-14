# FitAI Coach

A mobile-first fitness and nutrition tracking app with AI coaching, built with React + Vite + Express.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite, styled with Tailwind CSS and shadcn/ui
- **Backend**: Express server (`server/index.ts`) running on port 5000
- **Dev proxy**: Vite proxies `/api` requests to the Express server in development
- **Data storage**: localStorage (client-side) for all user data (workouts, meals, goals, body weight, water, measurements, custom exercises, programs, user profile)
- **AI**: Google Gemini API (`gemini-1.5-flash`) via `GEMINI_API_KEY` secret — no Replit Agent dependency
- **Android**: Capacitor (`com.fitai.coach`), build guide in `BUILD_ANDROID.md`

## Visual Design

- **Premium dark aesthetic**: near-black background (0 0% 2%), deep card surfaces, green neon accent
- **Floating pill bottom nav**: elevated, rounded, glass-strong, floating above screen edge
- **Cinematic hero banners**: gym/lift/programs hero images with dark gradient overlays on Dashboard and Workouts
- **Inter Black (900)** for all headings; Rubik for body text
- **Custom utility classes**: `.hero-img-overlay`, `.hero-section`, `.float-nav`, `.section-title`, upgraded `.card-premium`
- Hero images: `public/images/hero-gym.png`, `hero-lift.png`, `hero-programs.png`

## Key Features

- Workout tracking with templates, folders, history, personal records, and real-time volume tracking
- AI Coach chat powered by OpenAI (streaming SSE) with 8 data-aware quick action prompts (routine building, weekly analysis, substitutions, load progression, 8-week program, overtraining risk, weekly split, evolution prediction)
- AI meal analysis via photo or text description (vision model)
- Nutrition tracking with macros (grams/percent toggle), calorie balance indicator, editable water goal, custom ml input, and meal history
- Body weight tracking with chart, quick-adjust buttons, and history
- Body composition: BMI, body fat % (US Navy method), BMR (Mifflin-St Jeor), TDEE, lean/fat mass
- Custom exercises: create/delete with CUSTOM badge, merged with built-in 175+ exercises
- Training programs: create/activate/start with template linking, preset program library
- Progress tracking with rich charts: volume, frequency, consistency heatmap, PRs, AI Insights panel (stagnation alerts, overtraining risk, progress predictions)
- Settings: 9 color themes, user profile (height/age/sex/activity/body measurements), body measurements, complete backup/export (JSON + CSV for workouts & nutrition)
- iOS safe-area support for Capacitor apps
- Haptic feedback via Vibration API (mobile/Android)
- Offline-first with localStorage; no internet needed for core features
- PWA support (installable on mobile)
- Lazy-loaded routes for fast initial load

## API Routes

- `GET /api/health` — Health check / AI connectivity test
- `POST /api/ai-coach` — AI fitness coach chat (streaming SSE)
- `POST /api/analyze-meal` — AI meal nutritional analysis (image or text)
- `POST /api/analyze-workout` — Post-workout AI analysis comparing current vs previous workout (non-streaming)

## Workflows

- **Start application**: `npm run server & npm run dev:vite` → runs Express on port 5000 + Vite dev server on port 5173 (proxied via Vite's `/api` proxy)

## Environment Variables / Secrets

- `GEMINI_API_KEY` — Google Gemini API key (required for AI coach, meal analysis, and workout analysis)
- `DATABASE_URL` — Replit PostgreSQL connection string (auto-configured)

## Notes on Migration

- Supabase has been removed; the app was not using any Supabase database tables
- All user data is stored in localStorage (offline-first)
- AI features use Google Gemini directly via the Express server on port 5000

## localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `workout-templates` | WorkoutTemplate[] | Saved workout routines |
| `workout-history` | CompletedWorkout[] | Completed workouts |
| `personal-records` | PersonalRecord[] | PR tracking |
| `workout-goals` | Goal[] | Active goals |
| `favorite-exercises` | string[] | Favorited exercise IDs |
| `active-workout` | ActiveWorkout | Current in-progress workout |
| `meal-history` | Meal[] | Logged meals |
| `nutrition-goals` | NutritionGoals | Calorie/macro targets |
| `body-weight` | WeightEntry[] | Weight log entries |
| `water-log` | Record<string, number> | Daily water intake (ml) |
| `water-goal` | number | Daily water target (default 2500ml) |
| `body-measurements` | Record<string, string> | Body measurements (cm) |
| `workout-folders` | Folder[] | Workout routine folders |
| `app-theme` | string | Color theme ID |
| `user-profile` | UserProfile | Height, age, sex, activity, neck, waist, hip |
| `custom-exercises` | CustomExercise[] | User-created exercises |
| `training-programs` | TrainingProgram[] | Training programs |

## Storage Hooks (src/hooks/useStorage.ts)

- `useMeals()` → `{ meals, addMeal, removeMeal, updateMeal }`
- `useNutritionGoals()` → `{ goals, updateGoals }`
- `useBodyWeight()` → `{ entries, addWeight, removeWeight, latest }`
- `useWaterLog()` → `{ water, getTodayWater, addWater, setDayWater, getWaterForDate }`
- `useWaterGoal()` → `[goal, setGoal]` (default 2500ml)
- `useUserProfile()` → `[profile, setProfile]` (UserProfile interface)
- `useCustomExercises()` → `{ exercises, addExercise, removeExercise }`
- `useFolders()` → folder management for workout routines
- `useTheme()` → color theme management (9 preset themes)

## Key Data Functions (src/data/exercises.ts)

- `exercises` — Built-in 175 exercise list
- `getAllExercises()` — Built-in + custom exercises merged
- `getExerciseById(id)` — Finds in all exercises (built-in + custom)
- `getCustomExercises()` — Reads custom exercises from localStorage
- `muscleGroups`, `equipmentList` — Filter constants

## UserProfile Interface

```typescript
{ height: number, age: number, sex: 'male'|'female',
  activityLevel: 'sedentary'|'light'|'moderate'|'active'|'very_active',
  neck: number, waist: number, hip: number }
```

## Body Composition Formulas (WeightLog.tsx)

- **BMI**: weight / (height/100)²
- **Body Fat %**: US Navy method (requires neck, waist, hip measurements)
- **BMR**: Mifflin-St Jeor equation
- **TDEE**: BMR × activity multiplier
- **Lean/Fat Mass**: derived from body fat %

## Project Structure

```
server/index.ts              — Express backend (AI routes via OpenAI)
server/replit_integrations/  — Replit AI integration scaffolding
src/
  App.tsx                    — Routes with React.lazy + Suspense
  pages/
    Dashboard.tsx            — Home with stats strip (calories, water, weight)
    Nutrition.tsx            — Nutrition page with water tracking, calorie balance, macro toggle
    NutritionCamera.tsx      — Camera/gallery meal analysis with AI
    AICoach.tsx              — AI fitness coach chat with quick actions
    WeightLog.tsx            — Body weight + body composition (BMI, BF%, BMR, TDEE)
    Progress.tsx             — Progress tracking with charts
    Settings.tsx             — Settings: 9 themes, user profile, measurements, backup (v3)
    Workouts.tsx             — Workout routines management (uses getAllExercises)
    Exercises.tsx            — Exercise library + custom exercise creation
    Programs.tsx             — Training programs (create/activate/preset library)
    ActiveWorkoutPage.tsx    — Live workout tracking (uses getAllExercises)
  hooks/
    useStorage.ts            — All localStorage data hooks
    useNetwork.ts            — Online/offline detection
  data/
    exercises.ts             — 175 built-in exercises + custom exercise functions
  lib/
    haptic.ts                — Vibration API haptic feedback
    api.ts                   — apiFetch with VITE_API_BASE_URL support
  components/
    PageShell.tsx            — Layout shell with iOS safe-area support
    BottomNav.tsx            — Animated bottom navigation (5 tabs)
capacitor.config.ts          — Android app config (appId: com.fitai.coach)
BUILD_ANDROID.md             — Android APK build guide
```

## Deployment

- Run command: `tsx server/index.ts`
- Build command: `npm run build`
- Deploy target: autoscale
- Production serves `dist/` as static files; dev uses Vite proxy

## Notes

- Pages WITHOUT PageShell `title` prop must manually set top padding: `paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 60px), 72px)'`
- Custom exercise IDs start with `custom-` prefix
- Backup version is 3 (includes userProfile, customExercises, waterGoal)
- Training programs stored locally with `usePrograms()` hook in Programs.tsx
