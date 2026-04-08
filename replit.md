# FitAI Coach

A mobile-first fitness and nutrition tracking app with AI coaching, built with React + Vite + Express.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite, styled with Tailwind CSS and shadcn/ui
- **Backend**: Express server (`server/index.ts`) running on port 5000
- **Dev proxy**: Vite proxies `/api` requests to the Express server in development
- **Data storage**: localStorage (client-side) for all user data (workouts, meals, goals, body weight, water, measurements)
- **AI**: Replit AI Integrations (OpenAI `gpt-4o-mini`) via managed billing; falls back to user-provided `OPENAI_API_KEY`
- **Android**: Capacitor (`com.fitai.coach`), build guide in `BUILD_ANDROID.md`

## Key Features

- Workout tracking with templates, history, personal records, and real-time volume tracking
- AI Coach chat powered by OpenAI (streaming SSE) with 8 quick action prompts
- AI meal analysis via photo or text description (vision model)
- Nutrition tracking with macros, goals, water tracking, and meal history
- Body weight tracking with chart, quick-adjust buttons, and history
- Progress tracking with rich charts: volume, frequency, consistency heatmap, PRs
- Settings: color themes (6 options), body measurements, complete backup/export
- iOS safe-area support for Capacitor apps
- Haptic feedback via Vibration API (mobile/Android)
- Offline-first with localStorage; no internet needed for core features
- PWA support (installable on mobile)
- Lazy-loaded routes for fast initial load

## API Routes

- `GET /api/health` — Health check / AI connectivity test
- `POST /api/ai-coach` — AI fitness coach chat (streaming SSE)
- `POST /api/analyze-meal` — AI meal nutritional analysis (image or text)

## Workflows

- **Start application**: `npm run server` → runs Express on port 5000
- **Start Vite**: `npm run dev:vite` → runs Vite dev server on port 5173 (proxied to port 80)

## Environment Variables / Secrets

- `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit-managed OpenAI access (primary, auto-configured)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Replit-managed OpenAI base URL (auto-configured)
- `OPENAI_API_KEY` — User-provided fallback (optional)
- `GEMINI_API_KEY` — Legacy, no longer used (models deprecated)

## Storage Hooks (src/hooks/useStorage.ts)

- `useMeals()` → `{ meals, addMeal, removeMeal, updateMeal }`
- `useNutritionGoals()` → `{ goals, updateGoals }`
- `useBodyWeight()` → `{ entries, addWeight, removeWeight, latest }`
- `useWaterLog()` → `{ water, getTodayWater, addWater, setDayWater, getWaterForDate }`
- `useFolders()` → folder management for workout routines
- `useTheme()` → color theme management (6 preset themes)
- Body measurements stored directly in localStorage via `loadMeasurements()` helper in Settings.tsx

## Project Structure

```
server/index.ts              — Express backend (AI routes via OpenAI)
server/replit_integrations/  — Replit AI integration scaffolding (audio, chat, image, batch)
src/
  App.tsx                    — Routes with React.lazy + Suspense
  pages/
    Dashboard.tsx            — Home with stats strip (calories, water, weight)
    Nutrition.tsx             — Nutrition page with water tracking, daily summary
    NutritionCamera.tsx       — Camera/gallery meal analysis with AI
    AICoach.tsx               — AI fitness coach chat with quick actions
    WeightLog.tsx             — Body weight tracking with chart
    Progress.tsx              — Progress tracking with charts
    Settings.tsx              — Settings with themes, measurements, backup
    Workouts.tsx              — Workout routines management
    ActiveWorkoutPage.tsx     — Live workout tracking
  hooks/
    useStorage.ts            — All localStorage data hooks
    useNetwork.ts            — Online/offline detection
  lib/
    haptic.ts                — Vibration API haptic feedback
    api.ts                   — apiFetch with VITE_API_BASE_URL support
  components/
    PageShell.tsx            — Layout shell with iOS safe-area support
    BottomNav.tsx            — Animated bottom navigation
capacitor.config.ts          — Android app config (appId: com.fitai.coach)
BUILD_ANDROID.md             — Android APK build guide
```

## Deployment

- Run command: `tsx server/index.ts`
- Build command: `npm run build`
- Deploy target: autoscale
- Production serves `dist/` as static files; dev uses Vite proxy
