import { NavLink as RouterNavLink } from 'react-router-dom';
import { Home, Dumbbell, BookOpen, Clock, TrendingUp } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/treinos', icon: Dumbbell, label: 'Treinos' },
  { to: '/exercicios', icon: BookOpen, label: 'Exercícios' },
  { to: '/historico', icon: Clock, label: 'Histórico' },
  { to: '/progresso', icon: TrendingUp, label: 'Progresso' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon }) => (
          <RouterNavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Icon size={24} strokeWidth={1.8} />
          </RouterNavLink>
        ))}
      </div>
    </nav>
  );
}
