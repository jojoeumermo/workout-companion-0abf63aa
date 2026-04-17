import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import ErrorBoundary from "@/components/ErrorBoundary";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Workouts = lazy(() => import("./pages/Workouts"));
const Exercises = lazy(() => import("./pages/Exercises"));
const ExerciseDetail = lazy(() => import("./pages/ExerciseDetail"));
const History = lazy(() => import("./pages/History"));
const WorkoutDetail = lazy(() => import("./pages/WorkoutDetail"));
const Progress = lazy(() => import("./pages/Progress"));
const ActiveWorkoutPage = lazy(() => import("./pages/ActiveWorkout"));
const Settings = lazy(() => import("./pages/Settings"));
const Programs = lazy(() => import("./pages/Programs"));
const Nutrition = lazy(() => import("./pages/Nutrition"));
const NutritionCamera = lazy(() => import("./pages/NutritionCamera"));
const WeightLog = lazy(() => import("./pages/WeightLog"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

const App = () => {
  if (typeof window !== 'undefined') {
    const mode = localStorage.getItem('app-mode');
    if (mode === 'light') document.documentElement.classList.add('light');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<><Dashboard /><BottomNav /></>} />
              <Route path="/treinos" element={<><Workouts /><BottomNav /></>} />
              <Route path="/exercicios" element={<><Exercises /><BottomNav /></>} />
              <Route path="/exercicio/:id" element={<ExerciseDetail />} />
              <Route path="/historico" element={<><History /><BottomNav /></>} />
              <Route path="/historico/:id" element={<WorkoutDetail />} />
              <Route path="/progresso" element={<><Progress /><BottomNav /></>} />
              <Route path="/treino-ativo" element={<ActiveWorkoutPage />} />
              <Route path="/nutricao" element={<><Nutrition /><BottomNav /></>} />
              <Route path="/nutricao/camera" element={<NutritionCamera />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="/programas" element={<><Programs /><BottomNav /></>} />
              <Route path="/peso" element={<WeightLog />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
