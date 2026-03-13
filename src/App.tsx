import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import Dashboard from "./pages/Dashboard";
import Workouts from "./pages/Workouts";
import Exercises from "./pages/Exercises";
import ExerciseDetail from "./pages/ExerciseDetail";
import History from "./pages/History";
import WorkoutDetail from "./pages/WorkoutDetail";
import Progress from "./pages/Progress";
import ActiveWorkoutPage from "./pages/ActiveWorkout";
import AICoach from "./pages/AICoach";
import CameraAnalysis from "./pages/CameraAnalysis";
import Settings from "./pages/Settings";
import Programs from "./pages/Programs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<><Dashboard /><BottomNav /></>} />
          <Route path="/treinos" element={<><Workouts /><BottomNav /></>} />
          <Route path="/exercicios" element={<><Exercises /><BottomNav /></>} />
          <Route path="/exercicio/:id" element={<ExerciseDetail />} />
          <Route path="/historico" element={<><History /><BottomNav /></>} />
          <Route path="/historico/:id" element={<WorkoutDetail />} />
          <Route path="/progresso" element={<><Progress /><BottomNav /></>} />
          <Route path="/treino-ativo" element={<ActiveWorkoutPage />} />
          <Route path="/ai-coach" element={<><AICoach /><BottomNav /></>} />
          <Route path="/camera-ia" element={<CameraAnalysis />} />
          <Route path="/configuracoes" element={<><Settings /><BottomNav /></>} />
          <Route path="/programas" element={<><Programs /><BottomNav /></>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
