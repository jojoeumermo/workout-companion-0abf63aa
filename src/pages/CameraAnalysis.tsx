import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, CameraOff, RefreshCw, Save, ChevronDown, Dumbbell, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '@/components/PageShell';
import { usePoseDetection, EXERCISES, ExerciseConfig } from '@/hooks/usePoseDetection';
import { useActiveWorkout } from '@/hooks/useStorage';
import { useToast } from '@/hooks/use-toast';

function ExerciseSelector({ selected, onSelect }: { selected: ExerciseConfig; onSelect: (e: ExerciseConfig) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3 text-left"
        data-testid="select-exercise"
      >
        <div>
          <p className="font-semibold">{selected.label}</p>
          <p className="text-xs text-muted-foreground font-body">{selected.description}</p>
        </div>
        <ChevronDown size={18} className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute z-50 top-full mt-2 left-0 right-0 bg-card border border-border rounded-2xl overflow-hidden shadow-xl"
          >
            {EXERCISES.map(ex => (
              <button
                key={ex.id}
                onClick={() => { onSelect(ex); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors ${selected.id === ex.id ? 'text-primary' : ''}`}
                data-testid={`exercise-option-${ex.id}`}
              >
                <Dumbbell size={16} className={selected.id === ex.id ? 'text-primary' : 'text-muted-foreground'} />
                <div>
                  <p className="font-medium text-sm">{ex.label}</p>
                  <p className="text-xs text-muted-foreground">{ex.description}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RepCounter({ reps }: { reps: number }) {
  return (
    <motion.div
      key={reps}
      initial={{ scale: 1.3 }}
      animate={{ scale: 1 }}
      className="flex flex-col items-center"
    >
      <span className="text-6xl font-black text-primary tabular-nums leading-none" data-testid="rep-counter">
        {reps}
      </span>
      <span className="text-sm text-muted-foreground font-body mt-1">repetições</span>
    </motion.div>
  );
}

export default function CameraAnalysis() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exercise, setExercise] = useState<ExerciseConfig>(EXERCISES[0]);
  const [savedReps, setSavedReps] = useState<{ label: string; reps: number }[]>([]);
  const [activeWorkout, setActiveWorkout] = useActiveWorkout();

  const { videoRef, canvasRef, isLoading, isRunning, error, poseState, startCamera, stopCamera, recalibrate } = usePoseDetection(exercise);

  const handleExerciseChange = useCallback((ex: ExerciseConfig) => {
    if (isRunning) stopCamera();
    setExercise(ex);
  }, [isRunning, stopCamera]);

  const handleSaveSession = useCallback(() => {
    if (poseState.reps === 0) {
      toast({ title: 'Nenhuma repetição para salvar', description: 'Execute pelo menos uma repetição antes de salvar.' });
      return;
    }
    setSavedReps(prev => [...prev, { label: exercise.label, reps: poseState.reps }]);
    toast({
      title: 'Sessão salva!',
      description: `${poseState.reps} repetições de ${exercise.label} registradas.`,
    });

    if (activeWorkout) {
      toast({
        title: 'Treino ativo detectado',
        description: 'As repetições foram salvas. Registre-as manualmente no treino ativo.',
      });
    }
  }, [poseState.reps, exercise, activeWorkout, toast]);

  const phaseColor = {
    idle: 'text-muted-foreground',
    down: 'text-amber-400',
    up: 'text-primary',
  }[poseState.phase];

  return (
    <PageShell>
      <div className="pt-14 pb-28 space-y-4 max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card flex items-center justify-center" data-testid="button-back">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Análise com IA</h1>
            <p className="text-xs text-muted-foreground font-body">Câmera • Contagem de repetições</p>
          </div>
        </div>

        {/* Privacy notice */}
        <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3">
          <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-300 font-body leading-relaxed">
            A câmera é usada apenas para análise de movimento em tempo real. Nenhum vídeo é gravado ou enviado para servidores.
          </p>
        </div>

        {/* Exercise selector */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground px-1">Exercício</p>
          <ExerciseSelector selected={exercise} onSelect={handleExerciseChange} />
        </div>

        {/* Camera view */}
        <div className="relative bg-black rounded-3xl overflow-hidden aspect-[4/3]">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover opacity-0"
            playsInline
            muted
            data-testid="video-camera"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover"
            data-testid="canvas-overlay"
          />

          {/* Placeholder when not running */}
          {!isRunning && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card/90">
              <Camera size={48} className="text-muted-foreground/40" />
              <p className="text-muted-foreground font-body text-sm text-center px-6">
                Pressione "Iniciar Câmera" para começar a análise
              </p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/90">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground font-body text-center px-6">
                Carregando modelo de IA...{'\n'}Isso pode levar alguns segundos.
              </p>
            </div>
          )}

          {/* Rep counter overlay */}
          {isRunning && (
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-2">
              <RepCounter reps={poseState.reps} />
            </div>
          )}

          {/* Confidence */}
          {isRunning && poseState.confidence > 0 && (
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1.5">
              <p className="text-xs text-muted-foreground font-body">
                Confiança: <span className="text-primary font-semibold">{poseState.confidence}%</span>
              </p>
            </div>
          )}

          {/* Phase indicator */}
          {isRunning && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-4 py-2 text-center">
                <p className={`text-sm font-medium ${phaseColor}`} data-testid="text-feedback">
                  {poseState.feedback}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-2xl p-4"
            >
              <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-body">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Angle debug (when running) */}
        {isRunning && poseState.angle !== null && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-body">
            <span>Ângulo da articulação:</span>
            <span className="font-semibold text-foreground">{poseState.angle}°</span>
            <span className={`font-medium ${phaseColor}`}>
              {poseState.phase === 'idle' ? '• neutro' : poseState.phase === 'down' ? '• baixo' : '• alto'}
            </span>
          </div>
        )}

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3">
          {!isRunning ? (
            <button
              onClick={startCamera}
              disabled={isLoading}
              className="col-span-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-4 font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
              data-testid="button-start-camera"
            >
              <Camera size={20} />
              {isLoading ? 'Carregando...' : 'Iniciar Câmera'}
            </button>
          ) : (
            <>
              <button
                onClick={stopCamera}
                className="flex items-center justify-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl py-3.5 font-medium active:scale-[0.98] transition-transform"
                data-testid="button-stop-camera"
              >
                <CameraOff size={18} />
                Parar
              </button>
              <button
                onClick={recalibrate}
                className="flex items-center justify-center gap-2 bg-card border border-border rounded-2xl py-3.5 font-medium active:scale-[0.98] transition-transform"
                data-testid="button-recalibrate"
              >
                <RefreshCw size={18} />
                Recalibrar
              </button>
            </>
          )}
          <button
            onClick={handleSaveSession}
            disabled={poseState.reps === 0}
            className="col-span-2 flex items-center justify-center gap-2 bg-card border border-border rounded-2xl py-3.5 font-medium disabled:opacity-40 active:scale-[0.98] transition-transform"
            data-testid="button-save-session"
          >
            <Save size={18} />
            Salvar Sessão ({poseState.reps} reps)
          </button>
        </div>

        {/* Saved sessions */}
        <AnimatePresence>
          {savedReps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <p className="text-sm font-medium text-muted-foreground px-1">Sessões salvas</p>
              {savedReps.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-card rounded-2xl px-4 py-3" data-testid={`saved-session-${i}`}>
                  <div className="flex items-center gap-3">
                    <Dumbbell size={16} className="text-primary" />
                    <span className="font-medium text-sm">{s.label}</span>
                  </div>
                  <span className="text-primary font-bold">{s.reps} reps</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        <div className="bg-card rounded-2xl p-4 space-y-3">
          <p className="font-semibold text-sm">Dicas para melhor detecção</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground font-body">
            <li>• Boa iluminação no ambiente</li>
            <li>• Use roupas que contrastem com o fundo</li>
            <li>• Posicione a câmera de lado para agachamento e flexão</li>
            <li>• Mantenha o corpo inteiro visível na câmera</li>
            <li>• Faça movimentos lentos e controlados</li>
          </ul>
        </div>

      </div>
    </PageShell>
  );
}
