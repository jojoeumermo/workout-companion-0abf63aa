# FitApp - Treino Inteligente

A fitness tracker PWA with an AI coach, built with React + Vite + TypeScript. Originally from Lovable, migrated to Replit.

## Architecture

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express server (`server/index.ts`) — handles API routes and serves the frontend in production
- **Data storage**: All workout data is stored in the browser's `localStorage` (no database)
- **AI**: OpenAI GPT-4o-mini via the `/api/ai-coach` endpoint (streaming SSE)

## Project Structure

```
src/           - React frontend source
  pages/       - App pages (Dashboard, Workouts, AICoach, etc.)
  components/  - Reusable UI components
  hooks/       - Custom hooks (useStorage — localStorage wrappers)
  data/        - Static exercise data
  types/       - TypeScript type definitions
server/
  index.ts     - Express server: /api/ai-coach endpoint + static file serving
```

## Running Locally (Development)

Two workflows run in parallel:
- **Start application** (`npm run server`) — Express server on port 5000, proxies non-API requests to Vite
- **Start Vite** (`npm run dev:vite`) — Vite dev server on port 5173 with HMR

## Environment Variables

- `OPENAI_API_KEY` (secret) — Required for the FitAI Coach chat feature

## Key Features

- Workout template creation and management
- Active workout tracker with sets/reps/weight logging
- Workout history and progress charts
- Personal records tracking
- AI coach powered by OpenAI (Portuguese language)
- **Camera AI Analysis** — in-browser pose detection (MoveNet via TensorFlow.js) with automatic rep counting and execution feedback. Runs 100% locally, no video sent to servers. Supports: Agachamento, Flexão, Rosca Direta, Desenvolvimento.
- PWA support (installable on mobile)
- Theme customization
- Goals tracking
