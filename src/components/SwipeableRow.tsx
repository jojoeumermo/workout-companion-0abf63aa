import { useRef, useEffect, ReactNode } from 'react';
import { Trash2 } from 'lucide-react';

const REVEAL_WIDTH = 80;
const SNAP_THRESHOLD = 32;

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
  const directionRef = useRef<'h' | 'v' | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const snapTo = (x: number, animate = true) => {
      content.style.transition = animate ? 'transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none';
      content.style.transform = `translateX(${x}px)`;
      offsetRef.current = x;
    };

    const onTouchStart = (e: TouchEvent) => {
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
      startOffsetRef.current = offsetRef.current;
      directionRef.current = null;
      isDraggingRef.current = true;
      content.style.transition = 'none';
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.touches[0].clientX - startXRef.current;
      const dy = e.touches[0].clientY - startYRef.current;

      if (directionRef.current === null) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        directionRef.current = Math.abs(dx) >= Math.abs(dy) * 1.1 ? 'h' : 'v';
      }

      if (directionRef.current === 'v') return;

      e.preventDefault();
      const newOffset = Math.max(-REVEAL_WIDTH, Math.min(0, startOffsetRef.current + dx));
      content.style.transform = `translateX(${newOffset}px)`;
      offsetRef.current = newOffset;
    };

    const onTouchEnd = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      if (directionRef.current === 'v') return;

      if (offsetRef.current < -SNAP_THRESHOLD) {
        snapTo(-REVEAL_WIDTH);
      } else {
        snapTo(0);
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  const handleDelete = () => {
    const content = contentRef.current;
    if (content) {
      content.style.transition = 'transform 0.18s ease-in';
      content.style.transform = 'translateX(0)';
      offsetRef.current = 0;
    }
    onDelete();
  };

  return (
    <div ref={containerRef} className={`relative overflow-hidden rounded-xl select-none ${className}`}>
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center rounded-r-xl bg-destructive"
        style={{ width: REVEAL_WIDTH }}
      >
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={handleDelete}
          className="w-full h-full flex flex-col items-center justify-center gap-1 text-white active:opacity-80"
        >
          <Trash2 size={18} strokeWidth={2.5} />
          <span className="text-[10px] font-bold tracking-wide uppercase leading-none">{deleteLabel}</span>
        </button>
      </div>
      <div ref={contentRef} className="relative will-change-transform">
        {children}
      </div>
    </div>
  );
}
