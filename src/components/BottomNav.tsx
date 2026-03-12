import { NavLink as RouterNavLink } from 'react-router-dom';
import { Home, Dumbbell, BookOpen, BarChart3, Bot } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/treinos', icon: Dumbbell, label: 'Treinos' },
  { to: '/exercicios', icon: BookOpen, label: 'Exercícios' },
  { to: '/progresso', icon: BarChart3, label: 'Progresso' },
  { to: '/ai-coach', icon: Bot, label: 'FitAI' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon, label }) => (
          <RouterNavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all duration-200 gap-0.5 ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Icon size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">{label}</span>
          </RouterNavLink>
        ))}
      </div>
    </nav>
  );
}
