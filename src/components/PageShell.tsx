import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageShellProps {
  title?: string;
  children: ReactNode;
  rightAction?: ReactNode;
}

export default function PageShell({ title, children, rightAction }: PageShellProps) {
  return (
    <div className="min-h-screen min-h-dvh bg-background pb-24 safe-bottom">
      {title && (
        <header className="sticky top-0 z-40 glass-strong border-b border-border/40">
          <div
            className="flex items-center justify-between max-w-lg mx-auto px-5 pb-4"
            style={{ paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 56px), 70px)' }}
          >
            <motion.h1
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-2xl font-bold tracking-tight"
            >
              {title}
            </motion.h1>
            {rightAction}
          </div>
        </header>
      )}
      <main className="px-4 sm:px-5">
        {children}
      </main>
    </div>
  );
}
