import { useCountUp } from '../../../hooks/useCountUp';
import { HERO_STATS } from '../lib/content';

const Stat = ({ value, suffix, label }) => {
  const n = useCountUp(value, { duration: 1.6 });
  return (
    <div data-hero="stat" className="px-2 text-center sm:px-5">
      <p className="font-display text-[26px] font-bold leading-none tabular-nums text-white sm:text-[32px]">
        {n.toLocaleString('en-IN')}<span className="text-marigold">{suffix}</span>
      </p>
      <p className="mt-2 text-[12px] font-semibold uppercase tracking-label text-white/60">{label}</p>
    </div>
  );
};

const HeroStats = () => (
  <div className="grid grid-cols-2 gap-y-6 rounded-3xl border border-white/15 bg-white/[0.06] py-6 backdrop-blur-sm sm:grid-cols-4 sm:divide-x sm:divide-white/10">
    {HERO_STATS.map((s) => <Stat key={s.label} {...s} />)}
  </div>
);

export default HeroStats;
