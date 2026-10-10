import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

const NavArrow = ({ side, onClick, children, label }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={cn(
      'absolute top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-ink/60 text-white backdrop-blur transition-colors hover:bg-saffron',
      side === 'left' ? 'left-0 sm:left-4' : 'right-0 sm:right-4',
    )}
  >
    {children}
  </button>
);

/** The nearest poster centre stage with its neighbours peeking in (desktop). */
const PosterStage = ({ slides, index, onPrev, onNext, onPause }) => (
  <div className="relative" onMouseEnter={() => onPause(true)} onMouseLeave={() => onPause(false)}>
    <div className="flex items-center justify-center gap-4 sm:gap-6">
      {slides.map((s, i) => {
        const offset = i - index;
        const isCurrent = offset === 0;
        if (Math.abs(offset) > 1) return null;
        const body = (
          <>
            <img
              src={s.image}
              alt={isCurrent ? `${s.title} poster` : ''}
              loading={isCurrent ? 'eager' : 'lazy'}
              className="h-full w-full object-cover"
            />
            {!isCurrent && <div className="absolute inset-0 bg-ink/60" aria-hidden="true" />}
          </>
        );
        const cls = cn(
          'relative shrink-0 overflow-hidden rounded-2xl transition-all duration-500',
          isCurrent
            ? 'aspect-[16/10] w-[min(88vw,640px)] shadow-premium-2xl ring-1 ring-marigold/50 hover:ring-marigold'
            : 'hidden aspect-[16/10] w-[180px] opacity-55 lg:block',
        );
        return s.href && isCurrent ? (
          <a key={s.id} href={s.href} className={cls} aria-label={s.title}>{body}</a>
        ) : (
          <div key={s.id} className={cls} aria-hidden={!isCurrent}>{body}</div>
        );
      })}
    </div>

    {slides.length > 1 && (
      <>
        <NavArrow side="left" onClick={onPrev} label="Previous"><ChevronLeft size={20} /></NavArrow>
        <NavArrow side="right" onClick={onNext} label="Next"><ChevronRight size={20} /></NavArrow>
      </>
    )}
  </div>
);

export default PosterStage;
