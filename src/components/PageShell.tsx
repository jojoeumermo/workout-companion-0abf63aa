import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageShellProps {
  title?: string;
  children: ReactNode;
  rightAction?: ReactNode;
}

export default function PageShell({ title, children, rightAction }: PageShellProps) {
  return (
    <div className="min-h-screen min-h-dvh bg-background" style={{ paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))' }}>
      {title && (
        <header className="sticky top-0 z-40 glass-strong border-b border-border/30 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-primary/10 after:to-transparent">
          <div
            className="flex items-center justify-between max-w-lg mx-auto px-6 pb-4"
            style={{ paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 56px), 70px)' }}
          >
            <motion.h1
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-2xl font-black tracking-tight"
              style={{ letterSpacing: '-0.03em' }}
            >
              {title}
            </motion.h1>
            {rightAction}
          </div>
        </header>
      )}
      <main className="px-5 sm:px-6">
        {children}
      </main>
    </div>
  );
}
