# FitApp Coach

A mobile-first fitness and nutrition tracking app, built with React + Vite + Express. AI functionality has been fully removed; all analysis now runs locally on the user's data.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite, styled with Tailwind CSS and shadcn/ui
- **Backend**: Express server (`server/index.ts`) running on port 5000 — serves `/api/health` only; no AI routes
- **Dev proxy**: Vite proxies `/api` requests to the Express server in development
- **Data storage**: localStorage (client-side) for all user data (workouts, meals, goals, body weight, water, measurements, custom exercises, programs, micronutrient goals, user profile)
- **Android**: Capacitor (`com.fitai.coach`), build guide in `BUILD_ANDROID.md`

## Visual Design

- **Premium dark aesthetic**: near-black background (0 0% 2%), deep card surfaces, green neon accent
- **Floating pill bottom nav**: elevated, rounded, glass-strong, floating above screen edge
- **Cinematic hero banners**: gym/lift/programs hero images with dark gradient overlays on Dashboard and Workouts
- **Inter Black (900)** for all headings; Rubik for body text
- **Custom utility classes**: `.hero-img-overlay`, `.hero-section`, `.float-nav`, `.section-title`, upgraded `.card-premium`
- Hero images: `public/images/hero-gym.png`, `hero-lift.png`, `hero-programs.png`

## Key Features

- Workout tracking with templates (duplicate/edit/delete), folders, history, personal records, and real-time volume tracking
- Brazilian food database (`src/data/foodDatabase.ts`) with 223 foods across 13 categories: macros per 100g, optional micronutrients (15 micros supported), common portions, search/filter by category
- Manual food entry: search 223-item database → select → adjust grams (with common portion presets) → add to meal; manual custom entry form; edit/remove items; save as typed meal
- Nutrition tracking: calorie circle (SVG stroke-dasharray), meals grouped by type (Café/Almoço/Jantar/Lanche/Outro) with per-type add button, macros bars, water tracking, intermittent fasting timer with live elapsed time and history
- **Full micronutrient tracking (15 micros)** in the Macros tab: fibras, açúcar, sódio, potássio, cálcio, ferro, magnésio, zinco, vitaminas A/B12/C/D/E/K, ômega 3 — with custom goals per micro and "limit" badges for sódio/açúcar
- **Editable micro goals dialog** (saves to localStorage `micro-goals`) and **manual micro entry** (registers a `MealEntry` flagged with `isMicroSupplement: true` whose totals sum into the daily micros — useful for supplements like vitamina D, ômega 3, etc.)
- Intermittent fasting: `useFasting` hook in useStorage, start/stop/history, persists in localStorage (`fasting-data`)
- Body weight tracking with chart, quick-adjust buttons, and history
- Body composition: BMI, body fat % (US Navy method), BMR (Mifflin-St Jeor), TDEE, lean/fat mass
- Custom exercises: create/delete with CUSTOM badge, image upload (base64, up to 2MB stored in localStorage), merged with built-in 175+ exercises; muscle-group color coding throughout
- **Training programs library — 16 preset programs** (PPL, Arnold Split, Heavy Duty, Full Body, ABC, Upper/Lower, PPL 6x, Hipertrofia Iniciante/Intermediário, Força Básico, Cutting, Bulking, Treino em Casa, Treino com Halteres, Treino Feminino Glúteos & Pernas, Treino Express 30min) — each with name, description, level, duration, days/week, and a list of suggested workouts with named exercises. The detail dialog supports **"Copiar para minhas rotinas e ativar"**, which materialises every preset workout into a `WorkoutTemplate` with looked-up exercises (3×10 default) and links them to the program schedule.
- Progress tracking with rich charts: volume, frequency, consistency heatmap, PRs, stagnation alerts, overtraining risk indicators (local math — labelled "análise local")
- Gamification system (`src/lib/gamification.ts`): XP per workout, 10 levels, 15 achievements, streak tracking
- Dashboard gamification card: Level badge, animated XP progress bar, streak display, weekly muscle volume distribution bars, stagnation/overtraining alerts surfaced directly
- Post-workout summary: gradient hero banner with XP gained, per-exercise comparison vs last session, PRs highlighted
- Settings: 9 color themes, user profile (height/age/sex/activity/body measurements), body measurements, complete backup/export (JSON + CSV)
- iOS safe-area support for Capacitor apps
- Haptic feedback via Vibration API (mobile/Android)
- Offline-first with localStorage; no internet needed for core features
- PWA support (installable on mobile)
- Lazy-loaded routes for fast initial load

## API Routes

- `GET /api/health` — Health check (returns `{ status: 'ok' }`)

## Workflows

- **Start application**: `npm run server & npm run dev:vite` → runs Express on port 5000 + Vite dev server on port 5173 (proxied via Vite's `/api` proxy)

## Environment Variables / Secrets

- `DATABASE_URL` — Replit PostgreSQL connection string (auto-configured; not actively used — all data lives in localStorage)

## Notes on Migration

- All AI references and the `/ai-coach` route have been removed from the UI; the app no longer depends on Gemini or OpenAI
- All user data is stored in localStorage (offline-first)

## localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `workout-templates` | WorkoutTemplate[] | Saved workout routines |
| `workout-history` | CompletedWorkout[] | Completed workouts |
| `personal-records` | PersonalRecord[] | PR tracking |
| `workout-goals` | Goal[] | Active goals |
| `favorite-exercises` | string[] | Favorited exercise IDs |
| `active-workout` | ActiveWorkout | Current in-progress workout |
| `meal-history` | MealEntry[] | Logged meals (incl. micro-only supplement entries) |
| `nutrition-goals` | DailyNutritionGoal | Calorie/macro targets |
| `micro-goals` | MicroGoals | Per-micronutrient daily targets (15 micros) |
| `body-weight` | WeightEntry[] | Weight log entries |
| `water-log` | Record<string, number> | Daily water intake (ml) |
| `water-goal` | number | Daily water target (default 2500ml) |
| `fasting-data` | { active, history } | Intermittent fasting state and history |
| `body-measurements` | Record<string, string> | Body measurements (cm) |
| `workout-folders` | Folder[] | Workout routine folders |
| `app-theme` | string | Color theme ID |
| `user-profile` | UserProfile | Height, age, sex, activity, neck, waist, hip |
| `custom-exercises` | CustomExercise[] | User-created exercises |
| `training-programs` | TrainingProgram[] | Training programs |

## Storage Hooks (src/hooks/useStorage.ts)

- `useMeals()` → `{ meals, addMeal, updateMeal, deleteMeal, getMealsForDate }`
- `useNutritionGoals()` → `[goals, setGoals]`
- `useMicroGoals()` → `[microGoals, setMicroGoals]` — backfills new micros from `DEFAULT_MICRO_GOALS`
- `useBodyWeight()` → `{ entries, addWeight, removeWeight, latest }`
- `useWaterLog()` → `{ water, getTodayWater, addWater, setDayWater, getWaterForDate }`
- `useWaterGoal()` → `[goal, setGoal]` (default 2500ml)
- `useFasting()` → `{ data, start, stop, deleteFasting }`
- `useUserProfile()` → `[profile, setProfile]`
- `useCustomExercises()` → `{ exercises, addExercise, removeExercise }`
- `useFolders()` → folder management for workout routines
- `useTheme()` → color theme management (9 preset themes)
- `useTemplates()` → `[templates, setTemplates]` — used by Programs to materialise preset workouts into routines

## Micronutrient Model (`src/types/nutrition.ts`)

- `MicroGoals` interface holds 15 keys: `fiber`, `sugar`, `sodium`, `potassium`, `calcium`, `iron`, `magnesium`, `zinc`, `vitaminA`, `vitaminB12`, `vitaminC`, `vitaminD`, `vitaminE`, `vitaminK`, `omega3`
- `DEFAULT_MICRO_GOALS` ships sensible adult RDIs
- `MICRO_LIMITS = new Set(['sodium', 'sugar'])` — these render with a "limite" badge and turn the bar red when exceeded
- `MICRO_DEFS[]` drives the UI (label, unit, colour) so adding a new micro = one entry
- `MealEntry.isMicroSupplement?: boolean` flags entries created by the manual-micro dialog (kcal/macros = 0; only the chosen micro is non-zero)

## Key Data Functions (src/data/exercises.ts)

- `exercises` — Built-in exercise list (~175)
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
server/index.ts              — Express backend (health-check only)
src/
  App.tsx                    — Routes with React.lazy + Suspense (no /ai-coach route)
  pages/
    Dashboard.tsx            — Home with stats strip, gamification, alerts
    Nutrition.tsx            — Resumo / Refeições / Macros / Jejum tabs (15 micros + edit goals + manual micro entry)
    NutritionCamera.tsx      — Manual food entry (search, portions, custom items)
    WeightLog.tsx            — Body weight + body composition
    Progress.tsx             — Progress tracking with charts (local insights, no AI)
    Settings.tsx             — Settings: 9 themes, user profile, measurements, backup
    Workouts.tsx             — Workout routines management
    Exercises.tsx            — Exercise library + custom exercise creation
    Programs.tsx             — Training programs (16 presets, copy-to-routines)
    ActiveWorkoutPage.tsx    — Live workout tracking
  hooks/
    useStorage.ts            — All localStorage data hooks
    useNetwork.ts            — Online/offline detection
  data/
    exercises.ts             — Built-in exercises + custom exercise functions
    foodDatabase.ts          — 223 BR foods, 13 categories, 15-micro support
  types/
    nutrition.ts             — MicroGoals, MICRO_DEFS, MICRO_LIMITS, MealEntry
    workout.ts               — WorkoutTemplate, ActiveWorkout, Exercise
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
- "Copiar para minhas rotinas" in Programs uses exercise NAME lookup against `getAllExercises()` and pushes new templates with `tmpl-<ts>-<idx>` IDs into `workout-templates`
