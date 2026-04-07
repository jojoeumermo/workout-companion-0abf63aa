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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ to, icon: Icon, label }) => (
          <RouterNavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => haptic('light')}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all duration-200 gap-0.5 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl bg-primary/10 transition-all duration-200" />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} className="relative z-10 transition-all duration-200" />
                <span className={`text-[10px] font-medium relative z-10 transition-all duration-200 ${isActive ? 'font-semibold' : ''}`}>
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
