import { cn } from '../../../lib/utils';
import { Lotus } from '../../../components/site/Ornament';

/** One heading style for every band: kicker, display title, lotus rule, lead copy, optional action. */
const SectionHeading = ({ eyebrow, title, accent, body, action, align = 'left', dark = false, className }) => {
  const centered = align === 'center';
  return (
    <div
      data-reveal
      className={cn(
        'flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
        centered && 'items-center text-center md:flex-col md:items-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', centered && 'mx-auto')}>
        <p className={cn('kicker', dark && 'text-marigold')}>{eyebrow}</p>
        <h2 className={cn('display-lg mt-3', dark && 'text-white')}>
          {title}
          {accent && <span className={dark ? 'text-marigold' : 'text-saffron'}> {accent}</span>}
        </h2>
        <Lotus className={cn('mt-4 h-[18px] w-auto', dark ? 'text-marigold' : 'text-marigold-dark', centered && 'mx-auto')} />
        {body && <p className={cn('mt-4 text-[16px] leading-relaxed sm:text-[17px]', dark ? 'text-white/70' : 'text-ink-muted')}>{body}</p>}
      </div>
      {action}
    </div>
  );
};

export default SectionHeading;
