import { useState, useEffect, useRef, memo } from 'react';
import { Dumbbell } from 'lucide-react';
import { getExerciseMediaUrls } from '@/lib/exerciseMedia';
import { getMuscleColor } from '@/lib/muscleColors';

interface ExerciseMediaProps {
  exerciseId: string;
  exerciseName: string;
  muscleGroup?: string;
  customImage?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showGif?: boolean;
  placeholderLetter?: string;
}

type MediaState = 'loading' | 'gif' | 'image' | 'none';

const sizeMap = {
  sm:   'w-14 h-14 rounded-xl text-xl',
  md:   'w-16 h-16 rounded-xl text-2xl',
  lg:   'w-20 h-20 rounded-2xl text-3xl',
  hero: 'w-full h-52 rounded-2xl text-4xl',
};

function ExerciseMedia({
  exerciseId,
  exerciseName,
  muscleGroup,
  customImage,
  className = '',
  size = 'sm',
  showGif = true,
  placeholderLetter,
}: ExerciseMediaProps) {
  const sizeClass = sizeMap[size];
  const color = getMuscleColor(muscleGroup || '');

  const mediaUrls = getExerciseMediaUrls(exerciseId, exerciseName);

  const [mediaState, setMediaState] = useState<MediaState>('loading');
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || hasInitialized.current) return;
    hasInitialized.current = true;

    if (customImage) {
      setCurrentSrc(customImage);
      setMediaState('image');
      return;
    }

    if (mediaUrls) {
      const firstSrc = showGif ? mediaUrls.gif : mediaUrls.image;
      setCurrentSrc(firstSrc);
      setMediaState('loading');
    } else {
      setMediaState('none');
    }
  }, [isVisible, customImage, mediaUrls, showGif]);

  const handleError = () => {
    if (!mediaUrls) {
      setMediaState('none');
      return;
    }
    if (currentSrc === mediaUrls.gif) {
      setCurrentSrc(mediaUrls.image);
      setMediaState('loading');
    } else {
      setMediaState('none');
    }
  };

  const handleLoad = () => {
    if (currentSrc.endsWith('.gif')) {
      setMediaState('gif');
    } else {
      setMediaState('image');
    }
  };

  const letter = placeholderLetter ?? exerciseName.charAt(0);

  return (
    <div ref={containerRef} className={`${sizeClass} ${className} shrink-0 overflow-hidden relative`}>
      {(mediaState === 'loading' || mediaState === 'gif' || mediaState === 'image') && currentSrc ? (
        <>
          {mediaState === 'loading' && (
            <div className={`absolute inset-0 flex items-center justify-center ${color.bg} ${color.border} border animate-pulse`}>
              <span className={`font-black ${color.text} text-sm`}>{letter}</span>
            </div>
          )}
          <img
            src={currentSrc}
            alt={exerciseName}
            onError={handleError}
            onLoad={handleLoad}
            loading="lazy"
            decoding="async"
            className={`w-full h-full transition-opacity duration-300 ${size === 'hero' ? 'object-contain' : 'object-cover object-top'} ${mediaState === 'loading' ? 'opacity-0 absolute inset-0' : 'opacity-100'}`}
          />
        </>
      ) : (
        <div className={`w-full h-full flex items-center justify-center ${color.bg} ${color.border} border`}>
          {size === 'hero' ? (
            <div className="flex flex-col items-center gap-3">
              <div className={`w-20 h-20 rounded-2xl ${color.bg} border ${color.border} flex items-center justify-center`}>
                <Dumbbell size={40} className={color.text} />
              </div>
              <span className={`text-sm font-black tracking-widest uppercase ${color.text}`}>{muscleGroup}</span>
            </div>
          ) : (
            <span className={`font-black ${color.text}`}>{letter}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(ExerciseMedia);
