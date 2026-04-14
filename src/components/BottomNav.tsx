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
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-5"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div
        className="w-full max-w-sm border border-white/[0.06]"
        style={{
          background: 'linear-gradient(145deg, hsl(225 15% 8% / 0.92) 0%, hsl(225 12% 5% / 0.95) 100%)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          borderRadius: '20px',
          boxShadow: '0 -4px 32px hsl(0 0% 0% / 0.5), 0 0 0 1px hsl(0 0% 100% / 0.03)',
        }}
      >
        <div className="flex items-center justify-around h-[60px] px-1">
          {tabs.map(({ to, icon: Icon, label }) => (
            <RouterNavLink
              key={to}
              to={to}
              end={to === '/'}
              draggable={false}
              onClick={() => haptic('light')}
              onContextMenu={e => e.preventDefault()}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center flex-1 h-11 rounded-2xl transition-all duration-200 gap-[3px] ${
                  isActive ? 'text-primary' : 'text-white/35'
                }`
              }
              style={{ WebkitTouchCallout: 'none', WebkitUserDrag: 'none' } as React.CSSProperties}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-2xl"
                      style={{ background: 'hsl(var(--primary) / 0.08)' }}
                    />
                  )}
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.4 : 1.5}
                    className={`relative z-10 transition-all ${isActive ? 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]' : ''}`}
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
