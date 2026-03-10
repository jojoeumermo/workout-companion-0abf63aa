import { ReactNode } from 'react';

interface PageShellProps {
  title?: string;
  children: ReactNode;
  rightAction?: ReactNode;
}

export default function PageShell({ title, children, rightAction }: PageShellProps) {
  return (
    <div className="min-h-screen bg-background pb-24">
      {title && (
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl px-5 pt-14 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {rightAction}
          </div>
        </header>
      )}
      <main className="px-5">{children}</main>
    </div>
  );
}
