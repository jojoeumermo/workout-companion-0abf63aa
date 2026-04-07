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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/40 safe-bottom">
      <div className="flex items-center justify-around h-[68px] max-w-lg mx-auto px-2">
        {tabs.map(({ to, icon: Icon, label }) => (
          <RouterNavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => haptic('light')}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center w-[52px] h-[52px] rounded-2xl transition-all duration-250 gap-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl bg-primary/8 transition-all duration-300" />
                )}
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.3 : 1.7}
                  className={`relative z-10 transition-all duration-250 ${isActive ? 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]' : ''}`}
                />
                <span className={`text-[10px] relative z-10 transition-all duration-250 leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {label}
                </span>
              </>
            )}
          </RouterNavLink>
        ))}
      </div>
    </nav>
  );
}
