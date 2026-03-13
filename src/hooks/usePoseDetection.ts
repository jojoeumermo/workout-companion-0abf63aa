import { useRef, useState, useCallback, useEffect } from 'react';

export type ExerciseType = 'squat' | 'pushup' | 'bicep_curl' | 'shoulder_press';

export interface ExerciseConfig {
  id: ExerciseType;
  label: string;
  description: string;
  jointA: number;
  jointB: number;
  jointC: number;
  downThreshold: number;
  upThreshold: number;
  invert: boolean;
  feedbackDown: string;
  feedbackUp: string;
  feedbackGood: string;
}

export const EXERCISES: ExerciseConfig[] = [
  {
    id: 'squat',
    label: 'Agachamento',
    description: 'Fique de frente ou de lado para a câmera',
    jointA: 11, // left_hip
    jointB: 13, // left_knee
    jointC: 15, // left_ankle
    downThreshold: 100,
    upThreshold: 160,
    invert: false,
    feedbackDown: 'Desça um pouco mais 🏋️',
    feedbackUp: 'Suba completamente ⬆️',
    feedbackGood: 'Boa execução! 💪',
  },
  {
    id: 'pushup',
    label: 'Flexão',
    description: 'Posicione-se de lado para a câmera',
    jointA: 5,  // left_shoulder
    jointB: 7,  // left_elbow
    jointC: 9,  // left_wrist
    downThreshold: 90,
    upThreshold: 150,
    invert: false,
    feedbackDown: 'Desça o peito até o chão 🏊',
    feedbackUp: 'Estenda os braços completamente ⬆️',
    feedbackGood: 'Ótima flexão! 🔥',
  },
  {
    id: 'bicep_curl',
    label: 'Rosca Direta',
    description: 'Fique de frente para a câmera',
    jointA: 5,  // left_shoulder
    jointB: 7,  // left_elbow
    jointC: 9,  // left_wrist
    downThreshold: 150,
    upThreshold: 55,
    invert: true,
    feedbackDown: 'Abaixe completamente o braço ⬇️',
    feedbackUp: 'Suba até o ombro 💪',
    feedbackGood: 'Perfeito! Continue assim 🎯',
  },
  {
    id: 'shoulder_press',
    label: 'Desenvolvimento',
    description: 'Fique de frente ou de lado para a câmera',
    jointA: 5,  // left_shoulder
    jointB: 7,  // left_elbow
    jointC: 9,  // left_wrist
    downThreshold: 100,
    upThreshold: 160,
    invert: false,
    feedbackDown: 'Abaixe até a altura dos ombros ⬇️',
    feedbackUp: 'Empurre para cima completamente ⬆️',
    feedbackGood: 'Excelente desenvolvimento! ✅',
  },
];

// MoveNet skeleton connections
export const SKELETON_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12],
  [11, 13], [13, 15], [12, 14], [14, 16],
];

function calcAngle(
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number
): number {
  const ab = { x: ax - bx, y: ay - by };
  const cb = { x: cx - bx, y: cy - by };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const cross = ab.x * cb.y - ab.y * cb.x;
  return Math.abs(Math.atan2(Math.abs(cross), dot) * (180 / Math.PI));
}

export type RepPhase = 'idle' | 'down' | 'up';

export interface PoseState {
  reps: number;
  phase: RepPhase;
  angle: number | null;
  feedback: string;
  confidence: number;
}

export function usePoseDetection(exercise: ExerciseConfig) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<import('@tensorflow-models/pose-detection').PoseDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef<RepPhase>('idle');
  const mountedRef = useRef(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poseState, setPoseState] = useState<PoseState>({
    reps: 0,
    phase: 'idle',
    angle: null,
    feedback: 'Aguardando...',
    confidence: 0,
  });

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsRunning(false);
  }, []);

  const recalibrate = useCallback(() => {
    phaseRef.current = 'idle';
    setPoseState(prev => ({ ...prev, phase: 'idle', reps: 0, feedback: 'Recalibrado! Comece o movimento.' }));
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Request camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve, reject) => {
          const v = videoRef.current!;
          v.onloadedmetadata = () => v.play().then(resolve).catch(reject);
        });
      }

      // Load detector lazily
      if (!detectorRef.current) {
        const tf = await import('@tensorflow/tfjs-core');
        await import('@tensorflow/tfjs-backend-webgl');
        await tf.ready();

        const poseDetection = await import('@tensorflow-models/pose-detection');
        detectorRef.current = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            enableSmoothing: true,
          }
        );
      }

      setIsLoading(false);
      setIsRunning(true);
      phaseRef.current = 'idle';
      setPoseState({ reps: 0, phase: 'idle', angle: null, feedback: 'Pronto! Comece o movimento.', confidence: 0 });

      // Detection loop
      const detect = async () => {
        if (!mountedRef.current || !videoRef.current || !detectorRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(detect);
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Mirror draw
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        try {
          const poses = await detectorRef.current.estimatePoses(video);
          if (poses.length > 0) {
            const kps = poses[0].keypoints;
            const score = poses[0].score ?? 0;

            // Draw skeleton
            const scaleX = canvas.width;
            const scaleY = canvas.height;

            const kpCanvas = kps.map(kp => ({
              x: canvas.width - kp.x * (canvas.width / video.videoWidth),
              y: kp.y * (canvas.height / video.videoHeight),
              score: kp.score ?? 0,
            }));

            // Draw connections
            ctx.strokeStyle = 'rgba(130, 230, 130, 0.85)';
            ctx.lineWidth = 2.5;
            for (const [a, b] of SKELETON_CONNECTIONS) {
              const kpa = kpCanvas[a];
              const kpb = kpCanvas[b];
              if ((kpa.score ?? 0) > 0.3 && (kpb.score ?? 0) > 0.3) {
                ctx.beginPath();
                ctx.moveTo(kpa.x, kpa.y);
                ctx.lineTo(kpb.x, kpb.y);
                ctx.stroke();
              }
            }

            // Draw keypoints
            for (const kp of kpCanvas) {
              if (kp.score > 0.3) {
                ctx.beginPath();
                ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = '#4ade80';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              }
            }

            // Angle calculation
            const ex = exercise;
            const a = kps[ex.jointA];
            const b = kps[ex.jointB];
            const c = kps[ex.jointC];

            const minScore = Math.min(a.score ?? 0, b.score ?? 0, c.score ?? 0);
            if (minScore > 0.4) {
              const angle = calcAngle(a.x, a.y, b.x, b.y, c.x, c.y);
              let feedback = 'Mantenha a postura estável 🧍';
              let newPhase = phaseRef.current;
              let newReps = 0;

              if (!ex.invert) {
                if (angle < ex.downThreshold) {
                  if (phaseRef.current === 'idle' || phaseRef.current === 'up') {
                    newPhase = 'down';
                  }
                  feedback = ex.feedbackDown;
                } else if (angle > ex.upThreshold) {
                  if (phaseRef.current === 'down') {
                    newPhase = 'up';
                    newReps = 1;
                    feedback = ex.feedbackGood;
                  } else {
                    feedback = ex.feedbackUp;
                  }
                }
              } else {
                if (angle > ex.downThreshold) {
                  if (phaseRef.current === 'idle' || phaseRef.current === 'up') {
                    newPhase = 'down';
                  }
                  feedback = ex.feedbackDown;
                } else if (angle < ex.upThreshold) {
                  if (phaseRef.current === 'down') {
                    newPhase = 'up';
                    newReps = 1;
                    feedback = ex.feedbackGood;
                  } else {
                    feedback = ex.feedbackUp;
                  }
                }
              }

              if (newPhase !== phaseRef.current) {
                phaseRef.current = newPhase;
              }

              if (newReps > 0) {
                phaseRef.current = 'idle';
              }

              setPoseState(prev => ({
                reps: prev.reps + newReps,
                phase: phaseRef.current,
                angle: Math.round(angle),
                feedback,
                confidence: Math.round(score * 100),
              }));
            } else {
              setPoseState(prev => ({
                ...prev,
                feedback: 'Aproxime-se da câmera ou melhore a iluminação 💡',
                confidence: Math.round(score * 100),
              }));
            }
          } else {
            setPoseState(prev => ({ ...prev, feedback: 'Nenhuma pose detectada. Fique na frente da câmera 📷', confidence: 0 }));
          }
        } catch {
          // silently continue on frame errors
        }

        rafRef.current = requestAnimationFrame(detect);
      };

      rafRef.current = requestAnimationFrame(detect);
    } catch (err) {
      setIsLoading(false);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Permissão de câmera negada. Permita o acesso à câmera nas configurações do navegador.');
      } else {
        setError('Erro ao iniciar a câmera. Verifique se ela está disponível e tente novamente.');
      }
    }
  }, [exercise]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [stopCamera]);

  return { videoRef, canvasRef, isLoading, isRunning, error, poseState, startCamera, stopCamera, recalibrate };
}
