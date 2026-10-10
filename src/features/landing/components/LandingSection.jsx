import { cn } from '../../../lib/utils';

const TONES = {
  paper: 'bg-paper',
  white: 'bg-white',
  dark: 'bg-navy-900 text-white',
};

/** Page band: anchor id, vertical rhythm, tone and centred container. */
const LandingSection = ({ id, tone = 'paper', className, containerClassName, children }) => (
  <section id={id} className={cn('relative scroll-mt-20 overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28', TONES[tone], className)}>
    <div className={cn('relative mx-auto max-w-7xl', containerClassName)}>{children}</div>
  </section>
);

export default LandingSection;
