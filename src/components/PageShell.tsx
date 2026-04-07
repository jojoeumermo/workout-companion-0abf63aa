import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageShellProps {
  title?: string;
  children: ReactNode;
  rightAction?: ReactNode;
}

export default function PageShell({ title, children, rightAction }: PageShellProps) {
  return (
    <div className="min-h-screen bg-background pb-24">
      {title && (
        <header className="sticky top-0 z-40 glass-strong border-b border-border/40 px-5 pt-14 pb-4">
          <div className="flex items-center justify-between max-w-lg mx-auto">
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
      <main className="px-5">
        {children}
      </main>
    </div>
  );
}
