# FitAI Coach

A mobile-first fitness and nutrition tracking app with AI coaching, built with React + Vite + Express.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite, styled with Tailwind CSS and shadcn/ui
- **Backend**: Express server (`server/index.ts`) running on port 5000
- **Dev proxy**: Vite proxies `/api` requests to the Express server in development
- **Data storage**: localStorage (client-side) for all user data (workouts, meals, goals, etc.)
- **AI**: OpenAI GPT-4o-mini via the Express server

## Key Features

- Workout tracking with templates, history, and personal records
- AI Coach chat powered by OpenAI
- AI meal analysis (photo or text description) via `/api/analyze-meal`
- Real-time pose detection using TensorFlow.js MoveNet
- Progress tracking with charts
- PWA support (installable on mobile)

## API Routes

- `POST /api/ai-coach` — AI fitness coach chat (streaming SSE)
- `POST /api/analyze-meal` — AI meal nutritional analysis (image or text)

## Workflows

- **Start application**: `npm run server` → runs Express on port 5000
- **Start Vite**: `npm run dev:vite` → runs Vite dev server on port 5173 (proxied to port 80)

## Environment Variables / Secrets

- `OPENAI_API_KEY` — Required for AI coach and meal analysis features

## Project Structure

```
server/index.ts        — Express backend with /api/ai-coach and /api/analyze-meal
src/
  App.tsx              — Routes
  pages/               — Page components
  hooks/useStorage.ts  — All localStorage data hooks
  hooks/usePoseDetection.ts — TensorFlow pose detection
  components/          — Shared UI components
  integrations/supabase/ — Legacy Supabase types (client removed, types kept for reference)
```
