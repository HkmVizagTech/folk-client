import { Bell, Calendar, ChevronRight, Heart, Home, Sparkles, User } from 'lucide-react';
import { QUICK_ACCESS } from '../lib/content';

/** Static mock of the member app, shown inside a phone frame. */
const PhonePreview = () => (
  <div className="relative mx-auto w-full max-w-[320px]">
    <div className="absolute inset-6 rounded-full bg-saffron/30 blur-[80px]" aria-hidden="true" />
    <div className="relative rounded-[3rem] bg-ink p-3 shadow-premium-2xl ring-1 ring-white/15">
      <div className="min-h-[540px] rounded-[2.3rem] bg-paper p-5">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-saffron to-marigold text-white">
              <User size={20} aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] font-bold uppercase tracking-label text-ink-muted">Member</span>
              <span className="block font-display text-[16px] font-semibold text-ink">HKMV Folk</span>
            </span>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-saffron shadow-soft">
            <Bell size={17} aria-hidden="true" />
          </span>
        </div>

        <div className="hero-devotional relative mb-6 overflow-hidden rounded-3xl p-6 text-white">
          <div className="flex items-start justify-between">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white">
              <img src="/folk_mark.png" alt="" className="h-7 w-7 object-contain" />
            </span>
            <Sparkles size={18} className="text-marigold-light" aria-hidden="true" />
          </div>
          <p className="mt-10 text-[11px] uppercase tracking-[0.18em] text-white/60">Digital identity</p>
          <p className="font-display text-[18px] font-semibold">HKMV Folk</p>
        </div>

        <p className="mb-3 px-1 text-[11px] font-bold uppercase tracking-label text-ink-muted">Quick access</p>
        <ul className="space-y-3">
          {QUICK_ACCESS.map(({ title, Icon }) => (
            <li key={title} className="flex items-center justify-between rounded-2xl bg-white p-3.5 shadow-soft">
              <span className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-50 text-saffron-dark"><Icon size={18} aria-hidden="true" /></span>
                <span className="text-[14px] font-semibold text-ink">{title}</span>
              </span>
              <ChevronRight size={15} className="text-ink-muted/50" aria-hidden="true" />
            </li>
          ))}
        </ul>

        <div className="mt-7 flex h-14 items-center justify-around rounded-full bg-white shadow-soft">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-saffron text-white"><Heart size={16} aria-hidden="true" /></span>
          <Calendar size={18} className="text-ink-muted/50" aria-hidden="true" />
          <Home size={18} className="text-ink-muted/50" aria-hidden="true" />
          <User size={18} className="text-ink-muted/50" aria-hidden="true" />
        </div>
      </div>
    </div>
  </div>
);

export default PhonePreview;
