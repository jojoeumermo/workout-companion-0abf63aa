export const MUSCLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Peito':              { bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/20' },
  'Costas':             { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/20' },
  'Ombros':             { bg: 'bg-purple-500/15',  text: 'text-purple-400',  border: 'border-purple-500/20' },
  'Bíceps':             { bg: 'bg-green-500/15',   text: 'text-green-400',   border: 'border-green-500/20' },
  'Tríceps':            { bg: 'bg-teal-500/15',    text: 'text-teal-400',    border: 'border-teal-500/20' },
  'Quadríceps':         { bg: 'bg-orange-500/15',  text: 'text-orange-400',  border: 'border-orange-500/20' },
  'Posterior de coxa':  { bg: 'bg-yellow-500/15',  text: 'text-yellow-400',  border: 'border-yellow-500/20' },
  'Glúteos':            { bg: 'bg-pink-500/15',    text: 'text-pink-400',    border: 'border-pink-500/20' },
  'Panturrilha':        { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    border: 'border-cyan-500/20' },
  'Abdômen':            { bg: 'bg-indigo-500/15',  text: 'text-indigo-400',  border: 'border-indigo-500/20' },
  'Cardio':             { bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/20' },
  'Antebraço':          { bg: 'bg-lime-500/15',    text: 'text-lime-400',    border: 'border-lime-500/20' },
  'Peitoral Menor':     { bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/20' },
  'Trapézio':           { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/20' },
  'Lombar':             { bg: 'bg-sky-500/15',     text: 'text-sky-400',     border: 'border-sky-500/20' },
};

export function getMuscleColor(muscleGroup: string) {
  return MUSCLE_COLORS[muscleGroup] || { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' };
}

export const MUSCLE_EMOJI: Record<string, string> = {
  'Peito':              '🫁',
  'Costas':             '🔙',
  'Ombros':             '💪',
  'Bíceps':             '💪',
  'Tríceps':            '🦾',
  'Quadríceps':         '🦵',
  'Posterior de coxa':  '🦵',
  'Glúteos':            '🍑',
  'Panturrilha':        '🦶',
  'Abdômen':            '🏋️',
  'Cardio':             '🏃',
  'Antebraço':          '🦾',
  'Peitoral Menor':     '🫁',
  'Trapézio':           '🔙',
  'Lombar':             '🔙',
};
