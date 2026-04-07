# FitAI Coach

A mobile-first fitness and nutrition tracking app with AI coaching, built with React + Vite + Express.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite, styled with Tailwind CSS and shadcn/ui
- **Backend**: Express server (`server/index.ts`) running on port 5000
- **Dev proxy**: Vite proxies `/api` requests to the Express server in development
- **Data storage**: localStorage (client-side) for all user data (workouts, meals, goals, etc.)
- **AI**: Google Gemini (`gemini-1.5-flash`) via `@google/generative-ai`
- **Android**: Capacitor (`com.fitai.coach`), build guide in `BUILD_ANDROID.md`

## Key Features

- Workout tracking with templates, history, personal records, and real-time volume tracking
- AI Coach chat powered by Gemini (streaming SSE)
- AI meal analysis via photo or text description (Gemini Vision)
- Real-time pose detection using TensorFlow.js MoveNet
- Progress tracking with rich charts: volume, frequency, day-of-week, avg duration, heatmap, PRs
- Nutrition tracking with macros, goals, and meal history
- Haptic feedback via Vibration API (mobile/Android)
- Offline detection with user-friendly messaging
- PWA support (installable on mobile)
- Lazy-loaded routes for fast initial load

## API Routes

- `POST /api/ai-coach` — Gemini fitness coach chat (streaming SSE)
- `POST /api/analyze-meal` — Gemini Vision meal nutritional analysis (image or text)

## Workflows

- **Start application**: `npm run server` → runs Express on port 5000
- **Start Vite**: `npm run dev:vite` → runs Vite dev server on port 5173 (proxied to port 80)

## Environment Variables / Secrets

- `GEMINI_API_KEY` — Required for all AI features (coach chat + meal analysis)
- `OPENAI_API_KEY` — No longer used (migrated to Gemini)

## Project Structure

```
server/index.ts              — Express backend (Gemini AI routes)
src/
  App.tsx                    — Routes with React.lazy + Suspense
  pages/                     — Page components (all lazy-loaded)
  hooks/
    useStorage.ts            — All localStorage data hooks
    useNetwork.ts            — Online/offline detection
    usePoseDetection.ts      — TensorFlow pose detection
  lib/
    haptic.ts                — Vibration API haptic feedback
    api.ts                   — apiFetch with VITE_API_BASE_URL support
  components/
    BottomNav.tsx            — Animated active tab indicator + haptics
  integrations/supabase/     — Legacy types only (no Supabase client)
capacitor.config.ts          — Android app config (appId: com.fitai.coach)
BUILD_ANDROID.md             — Android APK build guide
```

## Deployment

- Run command: `tsx server/index.ts`
- Build command: `npm run build`
- Deploy target: autoscale
- Production serves `dist/` as static files; dev uses Vite proxy
