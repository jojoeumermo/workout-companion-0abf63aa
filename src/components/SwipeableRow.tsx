import { useRef, useEffect, ReactNode } from 'react';
import { Trash2 } from 'lucide-react';

const REVEAL_WIDTH = 80;
const SNAP_THRESHOLD = 30;

interface SwipeableRowProps {
  onDelete: () => void;
  children: ReactNode;
  deleteLabel?: string;
  className?: string;
}

export default function SwipeableRow({
  onDelete,
  children,
  deleteLabel = 'Excluir',
  className = '',
}: SwipeableRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startOffsetRef = useRef(0);
  const dirRef = useRef<'h' | 'v' | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const snap = (x: number, animate = true) => {
      const snapped = Math.round(x);
      content.style.transition = animate
        ? 'transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        : 'none';
      content.style.transform = `translate3d(${snapped}px, 0, 0)`;
      offsetRef.current = snapped;
    };

    const onStart = (e: TouchEvent) => {
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
      startOffsetRef.current = offsetRef.current;
      dirRef.current = null;
      activeRef.current = true;
      content.style.transition = 'none';
    };

    const onMove = (e: TouchEvent) => {
      if (!activeRef.current) return;
      const dx = e.touches[0].clientX - startXRef.current;
      const dy = e.touches[0].clientY - startYRef.current;

      if (dirRef.current === null) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        dirRef.current = Math.abs(dx) >= Math.abs(dy) * 1.1 ? 'h' : 'v';
      }
      if (dirRef.current === 'v') return;

      e.preventDefault();
      const next = Math.max(-REVEAL_WIDTH, Math.min(0, startOffsetRef.current + dx));
      const snapped = Math.round(next);
      content.style.transform = `translate3d(${snapped}px, 0, 0)`;
      offsetRef.current = snapped;
    };

    const onEnd = () => {
      if (!activeRef.current) return;
      activeRef.current = false;
      if (dirRef.current === 'v') return;
      snap(offsetRef.current < -SNAP_THRESHOLD ? -REVEAL_WIDTH : 0, true);
    };

    container.addEventListener('touchstart', onStart, { passive: true });
    container.addEventListener('touchmove', onMove, { passive: false });
    container.addEventListener('touchend', onEnd, { passive: true });
    container.addEventListener('touchcancel', onEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', onStart);
      container.removeEventListener('touchmove', onMove);
      container.removeEventListener('touchend', onEnd);
      container.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  const handleDelete = () => {
    const content = contentRef.current;
    if (content) {
      content.style.transition = 'transform 0.18s ease-in';
      content.style.transform = 'translate3d(0, 0, 0)';
      offsetRef.current = 0;
    }
    onDelete();
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl select-none bg-card ${className}`}
      style={{ isolation: 'isolate' }}
    >
      <div
        className="absolute inset-y-0 right-0 flex items-stretch bg-destructive"
        style={{ width: `${REVEAL_WIDTH}px`, transform: 'translateZ(0)' }}
      >
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={handleDelete}
          className="flex flex-1 flex-col items-center justify-center gap-1 text-destructive-foreground active:opacity-80"
        >
          <Trash2 size={20} strokeWidth={2.5} />
          <span className="text-[10px] font-bold tracking-wide uppercase leading-none">
            {deleteLabel}
          </span>
        </button>
      </div>

      {/* content layer — NO own border-radius: the parent overflow-hidden clips it.
          bg-background ensures the card fully covers the red action layer at rest. */}
      <div
        ref={contentRef}
        className="relative z-10 will-change-transform"
        style={{
          transform: 'translate3d(0, 0, 0)',
          background: 'hsl(var(--background))',
          backfaceVisibility: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
