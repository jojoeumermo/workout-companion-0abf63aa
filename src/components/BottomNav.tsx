import { NavLink as RouterNavLink } from 'react-router-dom';
import { Home, Dumbbell, BookOpen, BarChart3, UtensilsCrossed } from 'lucide-react';
import { haptic } from '@/lib/haptic';

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/treinos', icon: Dumbbell, label: 'Treinos' },
  { to: '/exercicios', icon: BookOpen, label: 'Exercícios' },
  { to: '/nutricao', icon: UtensilsCrossed, label: 'Nutrição' },
  { to: '/progresso', icon: BarChart3, label: 'Progresso' },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div className="float-nav glass-strong border border-border/40 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map(({ to, icon: Icon, label }) => (
            <RouterNavLink
              key={to}
              to={to}
              end={to === '/'}
              draggable={false}
              onClick={() => haptic('light')}
              onContextMenu={e => e.preventDefault()}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all duration-200 gap-0.5 ${
                  isActive ? 'text-primary' : 'text-muted-foreground/70'
                }`
              }
              style={{ WebkitTouchCallout: 'none', WebkitUserDrag: 'none' } as React.CSSProperties}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute inset-0 rounded-xl bg-primary/10" />}
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.2 : 1.6}
                    className={`relative z-10 transition-all ${isActive ? 'drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]' : ''}`}
                  />
                  <span className={`text-[9px] relative z-10 leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {label}
                  </span>
                </>
              )}
            </RouterNavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
