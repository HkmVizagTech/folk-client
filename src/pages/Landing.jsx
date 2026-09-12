import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFirestore } from '../hooks/useFirestore';
import {
  ArrowRight,
  ArrowUpRight,
  Flame,
  Users,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight,
  Heart,
  CheckCircle2,
  Bell,
  Home,
  User,
  Music,
  Compass,
  Sunrise,
  HandHeart,
  BookOpen,
  MessageCircle,
  Phone,
  Mail,
  Clock3,
  Quote,
  Menu,
  X,
} from 'lucide-react';

import Button from '../components/ui/Button';

const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#programs', label: 'Programs' },
  { href: '#events', label: 'Events' },
  { href: '#seva', label: 'Seva' },
  { href: '#accommodation', label: 'Accommodation' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#contact', label: 'Contact' },
];

/* ---------------------------------------------------------------
   Scoped styles.

   Everything here is local to the landing page so that no other
   file has to change. These give us the things Tailwind cannot
   express inline: the layered "photographic" hero canvas, film
   grain, the mandala motif, outlined display type and the warm
   image surfaces used in place of stock photography.
---------------------------------------------------------------- */
const LANDING_STYLES = `
.folk-hero-canvas {
  background:
    radial-gradient(115% 85% at 76% 8%, rgba(255,153,51,0.45) 0%, rgba(255,153,51,0) 56%),
    radial-gradient(95% 75% at 8% 92%, rgba(212,175,55,0.32) 0%, rgba(212,175,55,0) 62%),
    radial-gradient(70% 55% at 46% 0%, rgba(255,209,102,0.20) 0%, rgba(255,209,102,0) 72%),
    linear-gradient(168deg, #1C1611 0%, #100D0B 46%, #070605 100%);
}
.folk-grain {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
  background-size: 160px 160px;
}
.folk-mandala {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cg fill='none' stroke='%23FFB566' stroke-width='0.8'%3E%3Ccircle cx='100' cy='100' r='30'/%3E%3Ccircle cx='100' cy='100' r='52'/%3E%3Ccircle cx='100' cy='100' r='74'/%3E%3Cg%3E%3Cellipse cx='100' cy='58' rx='13' ry='30'/%3E%3Cellipse cx='100' cy='142' rx='13' ry='30'/%3E%3Cellipse cx='58' cy='100' rx='30' ry='13'/%3E%3Cellipse cx='142' cy='100' rx='30' ry='13'/%3E%3Cellipse cx='70' cy='70' rx='11' ry='26' transform='rotate(45 70 70)'/%3E%3Cellipse cx='130' cy='130' rx='11' ry='26' transform='rotate(45 130 130)'/%3E%3Cellipse cx='130' cy='70' rx='26' ry='11' transform='rotate(45 130 70)'/%3E%3Cellipse cx='70' cy='130' rx='26' ry='11' transform='rotate(45 70 130)'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  background-size: 460px 460px;
  background-position: center;
  background-repeat: repeat;
}
.folk-tilak {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 12 C44 32 44 52 50 92 C56 52 56 32 50 12' stroke='%23FF9933' stroke-width='3' fill='none'/%3E%3Ccircle cx='50' cy='24' r='7' fill='%23FF9933'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-size: contain;
}

/* Outlined display word, in the spirit of a stroked headline lockup. */
.folk-stroke {
  color: transparent;
  -webkit-text-stroke: 1.4px rgba(255,255,255,0.92);
  paint-order: stroke fill;
}
@media (min-width: 768px) {
  .folk-stroke { -webkit-text-stroke-width: 2.4px; }
}
@supports not ((-webkit-text-stroke: 1px #000)) {
  .folk-stroke { color: rgba(255,255,255,0.92); }
}

/* Warm "photographic" surfaces used for image frames. */
.folk-surface-1 { background: radial-gradient(120% 100% at 20% 15%, #FFC36B 0%, #F08A2A 38%, #B4530F 72%, #5E2A06 100%); }
.folk-surface-2 { background: radial-gradient(120% 100% at 78% 20%, #FFD98A 0%, #E8A12C 40%, #9A5B12 75%, #47250A 100%); }
.folk-surface-3 { background: radial-gradient(120% 100% at 30% 80%, #FF9F6B 0%, #D8542F 42%, #83220F 78%, #3A0F08 100%); }
.folk-surface-4 { background: radial-gradient(120% 100% at 70% 25%, #9FD6E8 0%, #3F7FA6 42%, #1C3E5C 78%, #0C1C2B 100%); }
.folk-surface-5 { background: radial-gradient(120% 100% at 25% 25%, #CDE8A8 0%, #6FA24B 42%, #33571F 78%, #16260D 100%); }
.folk-surface-6 { background: radial-gradient(120% 100% at 75% 75%, #E9C3F2 0%, #9A62B8 42%, #4C2A66 78%, #20102C 100%); }

.folk-rule {
  background-image: linear-gradient(90deg, rgba(255,153,51,0) 0%, rgba(255,153,51,0.55) 50%, rgba(255,153,51,0) 100%);
}

@media (prefers-reduced-motion: reduce) {
  .folk-float { animation: none !important; }
}
`;

/* Reusable warm image surface that stands in for photography.
   Layers: colour field + mandala motif + grain + dark scrim. */
const PhotoSurface = ({ tone = 'folk-surface-1', icon, className = '', scrim = true }) => (
  <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
    <div className={`absolute inset-0 ${tone}`} />
    <div className="absolute inset-0 folk-mandala opacity-[0.18] mix-blend-soft-light" />
    <div className="absolute inset-0 folk-grain opacity-[0.35] mix-blend-overlay" />
    {icon && (
      <div className="absolute inset-0 flex items-center justify-center text-white/35">
        {icon}
      </div>
    )}
    {scrim && (
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />
    )}
  </div>
);

/* Consistent section heading so every band shares one typographic scale. */
const SectionHeading = ({ eyebrow, title, accent, body, align = 'left', dark = false }) => (
  <div className={align === 'center' ? 'max-w-3xl mx-auto text-center' : 'max-w-2xl'}>
    <div className={`flex items-center gap-3 ${align === 'center' ? 'justify-center' : ''}`}>
      <span className="h-px w-8 bg-[#FF9933]" />
      <p className="text-[11px] sm:text-xs font-bold text-[#FF9933] uppercase tracking-[0.22em]">
        {eyebrow}
      </p>
    </div>

    <h2
      className={`mt-4 font-black tracking-tight leading-[1.05] ${dark ? 'text-white' : 'text-gray-900'}`}
      style={{ fontSize: 'clamp(1.95rem, 4.4vw, 3.5rem)' }}
    >
      {title}
      {accent && <span className="text-[#FF9933]"> {accent}</span>}
    </h2>

    {body && (
      <p
        className={`mt-5 leading-[1.75] ${dark ? 'text-white/65' : 'text-gray-600'}`}
        style={{ fontSize: 'clamp(1rem, 1.1vw, 1.125rem)' }}
      >
        {body}
      </p>
    )}
  </div>
);

const Landing = ({ onLoginClick }) => {
  const { data: events } = useFirestore('events');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Navbar switches from transparent-over-hero to a solid bar once the
  // user leaves the hero. The bar itself stays `fixed` in both states.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sort upcoming events by their ISO date (fall back to human date string for legacy docs)
  const sortedEvents = [...events].sort((a, b) => {
    const aTime = a.dateISO ? new Date(a.dateISO).getTime() : new Date(a.date).getTime();
    const bTime = b.dateISO ? new Date(b.dateISO).getTime() : new Date(b.date).getTime();
    return (aTime || 0) - (bTime || 0);
  });

  const solidNav = scrolled || mobileMenuOpen;

  const pillars = [
    {
      title: 'Spiritual Guidance',
      icon: <Compass size={24} />,
      tone: 'folk-surface-1',
      body:
        'Every new member is paired with a senior devotee who actually knows your name, your semester and what you are wrestling with. The questions students bring us are rarely abstract, so the answers are not either.',
    },
    {
      title: 'Daily Sadhana',
      icon: <Sunrise size={24} />,
      tone: 'folk-surface-2',
      body:
        'Chanting, reading and early mornings hold up far better when you are not doing them alone. Log your rounds in the app, keep your streak alive and watch the rest of the Vizag circle moving alongside you.',
    },
    {
      title: 'Community & Seva',
      icon: <HandHeart size={24} />,
      tone: 'folk-surface-3',
      body:
        'Serve in the temple kitchen, on book distribution and at city outreach beside people your own age. Seva is where the friendships here are actually made, not at the tea stall afterwards.',
    },
    {
      title: 'Events & Yatras',
      icon: <MapPin size={24} />,
      tone: 'folk-surface-4',
      body:
        'Kirtan nights, Janmashtami, youth camps and yatras across Andhra, all bookable from your phone in under a minute. Come along once and the reason people keep returning stops needing an explanation.',
    },
  ];

  const programs = [
    {
      title: 'Youth Programs',
      meta: 'Weekly',
      description:
        'Sessions built around what college life in Vizag actually looks like — focus, friendships, pressure and purpose.',
      icon: <Users size={24} />,
    },
    {
      title: 'Spiritual Sessions',
      meta: 'Weekly',
      description:
        'Bhagavad-gita discussion, kirtan and open Q&A where nothing is too basic and no question gets brushed aside.',
      icon: <Sparkles size={24} />,
    },
    {
      title: 'Workshops',
      meta: 'Monthly',
      description:
        'Practical, hands-on formats on mind management, time, relationships and staying steady through exam season.',
      icon: <BookOpen size={24} />,
    },
    {
      title: 'Festivals & Events',
      meta: 'Year-round',
      description:
        'Janmashtami, Gaura Purnima, Govardhan and the kirtan nights in between — the calendar the whole club plans around.',
      icon: <Calendar size={24} />,
    },
    {
      title: 'Seva',
      meta: 'Ongoing',
      description:
        'Prasadam distribution, temple service and outreach across the city. Pick a slot, show up, and you are part of it.',
      icon: <HandHeart size={24} />,
    },
    {
      title: 'Yatras & Trips',
      meta: 'Seasonal',
      description:
        'Pilgrimage journeys and weekend trips with the crew — the part of the year most members mark on the calendar first.',
      icon: <Compass size={24} />,
    },
  ];

  const heroStats = [
    { value: '2,500+', label: 'Active members' },
    { value: '120+', label: 'Events hosted' },
    { value: '15,000+', label: 'Sadhana streaks' },
    { value: '500+', label: 'Temple stays' },
  ];

  const heroLockups = [
    { label: 'Sadhana Tracker', icon: <Flame size={15} /> },
    { label: 'Youth Programs', icon: <Users size={15} /> },
    { label: 'Seva & Outreach', icon: <HandHeart size={15} /> },
    { label: 'Yatras & Camps', icon: <Compass size={15} /> },
    { label: 'Temple Stays', icon: <Home size={15} /> },
  ];

  const appFeatures = [
    { title: 'Event Bookings', body: 'Reserve your spot before it fills up.' },
    { title: 'Digital ID Card', body: 'Your membership, scannable at the gate.' },
    { title: 'Stay Approvals', body: 'Request a temple stay and track it live.' },
    { title: 'Sadhana Streaks', body: 'Log rounds and keep the chain unbroken.' },
  ];

  const quickAccess = [
    { title: 'Upcoming Events', icon: <Calendar size={18} /> },
    { title: 'Seva Activities', icon: <Heart size={18} /> },
    { title: 'Accommodation', icon: <Home size={18} /> },
  ];

  const galleryItems = [
    { title: 'Festivals', caption: 'Janmashtami, Gaura Purnima & more', tone: 'folk-surface-1', icon: <Sparkles size={34} />, size: 'lg:col-span-2 lg:row-span-2 min-h-[280px] lg:min-h-[440px]' },
    { title: 'Youth Programs', caption: 'Weekly sessions across the city', tone: 'folk-surface-4', icon: <Users size={30} />, size: 'min-h-[200px]' },
    { title: 'Seva', caption: 'Kitchen, outreach & distribution', tone: 'folk-surface-3', icon: <Heart size={30} />, size: 'min-h-[200px]' },
    { title: 'Workshops', caption: 'Mind, focus & daily discipline', tone: 'folk-surface-5', icon: <BookOpen size={30} />, size: 'min-h-[200px]' },
    { title: 'Kirtan Nights', caption: 'Music that runs past midnight', tone: 'folk-surface-6', icon: <Music size={30} />, size: 'min-h-[200px]' },
    { title: 'Yatras', caption: 'Journeys across Andhra & beyond', tone: 'folk-surface-2', icon: <MapPin size={34} />, size: 'lg:col-span-2 min-h-[200px]' },
  ];

  const voices = [
    {
      quote:
        'I came for one kirtan night because a friend dragged me along, and ended up staying for the people. Three years later this is the part of my week I plan everything else around.',
      role: 'Member since 2022',
      detail: 'B.Tech student, Vizag',
    },
    {
      quote:
        'The sadhana streak sounds like a small thing until you have kept one for ninety days. Having the whole group visible in the app is what got me past the first two weeks.',
      role: 'Sadhana group',
      detail: 'Joined through a campus program',
    },
    {
      quote:
        'Seva was where I actually made friends here. You work a shift together, you eat together afterwards, and by the third time nobody is a stranger any more.',
      role: 'Seva volunteer',
      detail: 'Weekend outreach team',
    },
  ];

  const accommodationInfo = [
    { title: 'Location', description: 'Where the stay is, how to reach it and what is nearby.', icon: <MapPin size={21} /> },
    { title: 'Room Information', description: 'Room types, sharing options and what each stay includes.', icon: <Home size={21} /> },
    { title: 'Facilities', description: 'Meals, prasadam timings and the essentials provided on site.', icon: <CheckCircle2 size={21} /> },
    { title: 'Availability', description: 'Check open dates before you send a stay request.', icon: <Calendar size={21} /> },
    { title: 'Daily Schedule', description: 'Morning program, aarti and session timings during your stay.', icon: <Clock3 size={21} /> },
    { title: 'Rules & Guidelines', description: 'What to bring, what to expect and how the house runs.', icon: <BookOpen size={21} /> },
  ];

  return (
    <div className="min-h-screen bg-[#FDF9F1] text-gray-900 overflow-x-hidden font-sans">

      <style>{LANDING_STYLES}</style>

      {/* =========================================================
          NAVBAR  (fixed in both states — transparent over the hero,
          solid once scrolled)
      ========================================================= */}

      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          solidNav
            ? 'bg-white/92 backdrop-blur-xl border-b border-gray-200/80 shadow-[0_6px_28px_-14px_rgba(0,0,0,0.25)]'
            : 'bg-transparent border-b border-white/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="h-16 sm:h-[74px] flex items-center justify-between gap-4">

            {/* BRAND — the mark sits on a white chip so it reads at full
                contrast over the dark hero and over the solid white bar.
                No brightness filter is applied in either state. */}
            <a href="#" className="shrink-0 flex items-center gap-3 group" aria-label="FOLK Vizag — home">
              <span className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-[0_8px_22px_-10px_rgba(0,0,0,0.45)] ring-1 ring-black/5 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Folk Vizag logo"
                  className="h-8 w-8 object-contain"
                />
              </span>

              <span className="hidden sm:block leading-tight">
                <span className={`block text-[15px] font-black tracking-tight transition-colors ${solidNav ? 'text-gray-900' : 'text-white'}`}>
                  FOLK Vizag
                </span>
                <span className={`block text-[9px] font-bold uppercase tracking-[0.18em] transition-colors ${solidNav ? 'text-gray-400' : 'text-white/60'}`}>
                  Hare Krishna Movement
                </span>
              </span>
            </a>

            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`relative text-[13px] font-semibold tracking-wide transition-colors hover:text-[#FF9933] ${
                    solidNav ? 'text-gray-600' : 'text-white/80'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">

              <Button
                onClick={onLoginClick}
                className={`min-h-[44px] px-5 sm:px-7 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  solidNav
                    ? 'bg-gray-900 text-white hover:bg-[#FF9933]'
                    : 'bg-[#FF9933] text-white hover:bg-[#e88822] shadow-[0_10px_30px_-10px_rgba(255,153,51,0.9)]'
                }`}
              >
                Login
              </Button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileMenuOpen}
                className={`lg:hidden w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center transition ${
                  solidNav
                    ? 'border-gray-200 text-gray-700 hover:text-[#FF9933] hover:border-[#FF9933]'
                    : 'border-white/25 text-white hover:text-[#FF9933] hover:border-[#FF9933]'
                }`}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

            </div>

          </div>

          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden mb-4 bg-white border border-gray-100 rounded-2xl shadow-premium-xl p-3 flex flex-col gap-1"
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3.5 min-h-[44px] flex items-center justify-between rounded-xl text-sm font-semibold text-gray-700 hover:text-[#FF9933] hover:bg-orange-50 transition"
                >
                  {link.label}
                  <ChevronRight size={16} className="text-gray-300" />
                </a>
              ))}
            </motion.div>
          )}

        </div>
      </nav>


      {/* =========================================================
          HERO — full-bleed, dark, photographic
      ========================================================= */}

      <section className="relative isolate min-h-[100svh] flex flex-col justify-end overflow-hidden bg-[#0B0A09]">

        {/* Layered background */}
        <div className="absolute inset-0 folk-hero-canvas" aria-hidden="true" />
        <div className="absolute inset-0 folk-mandala opacity-[0.14] mix-blend-soft-light" aria-hidden="true" />

        <motion.img
          src="/krishna_toy.png"
          alt=""
          aria-hidden="true"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="pointer-events-none select-none absolute right-[-14%] sm:right-[-8%] lg:right-[2%] bottom-0 h-[58%] sm:h-[72%] lg:h-[86%] w-auto max-w-none object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.65)]"
        />

        {/* Scrims — guarantee text contrast over the imagery */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070605] via-[#070605]/70 to-[#070605]/25" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070605] via-[#070605]/78 to-transparent" aria-hidden="true" />
        <div className="absolute inset-0 folk-grain opacity-[0.28] mix-blend-overlay" aria-hidden="true" />

        {/* Content */}
        <div className="relative z-10 w-full">

          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-40 pb-12 lg:pb-16">

            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
              className="max-w-3xl"
            >

              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                <span className="w-2 h-2 rounded-full bg-[#FF9933] shadow-[0_0_12px_3px_rgba(255,153,51,0.7)]" />
                <span className="text-[10px] sm:text-[11px] font-bold text-white/85 uppercase tracking-[0.2em]">
                  HKMV Folk · Visakhapatnam
                </span>
              </div>

              <h1
                className="mt-7 font-black tracking-[-0.03em] leading-[0.92] text-white"
                style={{ fontSize: 'clamp(2.75rem, 8.4vw, 6.75rem)' }}
              >
                <span className="folk-stroke block">Connect.</span>
                <span className="block">Participate.</span>
                <span className="block text-[#FF9933]">Serve.</span>
              </h1>

              <p
                className="mt-7 max-w-xl text-white/75 leading-[1.75]"
                style={{ fontSize: 'clamp(1.0625rem, 1.35vw, 1.1875rem)' }}
              >
                The youth club of the Hare Krishna Movement, Visakhapatnam. Spiritual
                sessions, workshops, seva, yatras and a circle of people your own age
                who actually show up — all in one place.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row gap-3.5 sm:gap-4">

                <Button
                  onClick={onLoginClick}
                  className="min-h-[52px] px-8 py-4 bg-[#FF9933] text-white rounded-full font-bold text-[15px] shadow-[0_18px_45px_-14px_rgba(255,153,51,0.85)] hover:bg-[#e88822] transition-all flex items-center justify-center gap-2"
                >
                  Join HKMV Folk
                  <ArrowRight size={18} />
                </Button>

                <a
                  href="#events"
                  className="min-h-[52px] px-8 py-4 rounded-full border border-white/25 bg-white/5 backdrop-blur-md text-white font-bold text-[15px] hover:bg-white hover:text-gray-900 hover:border-white transition-all flex items-center justify-center gap-2"
                >
                  See what is on
                  <ChevronRight size={18} />
                </a>

              </div>

              {/* Trust / stat strip */}
              <div className="mt-11 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6 max-w-2xl">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="sm:border-l sm:border-white/15 sm:pl-5 sm:first:border-l-0 sm:first:pl-0">
                    <div className="text-2xl sm:text-[28px] font-black text-white tracking-tight">
                      {stat.value}
                    </div>
                    <p className="mt-1 text-[11px] sm:text-xs font-semibold text-white/50 uppercase tracking-[0.12em]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

            </motion.div>

          </div>

          {/* Sub-brand lockup strip */}
          <div className="relative z-10 border-t border-white/10 bg-black/35 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-4 sm:py-5">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:gap-x-9">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  Inside FOLK
                </span>
                {heroLockups.map((item) => (
                  <span
                    key={item.label}
                    className="flex items-center gap-2 text-[12px] sm:text-[13px] font-semibold text-white/75"
                  >
                    <span className="text-[#FF9933]">{item.icon}</span>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* =========================================================
          ABOUT + THREE/FOUR PILLARS
      ========================================================= */}

      <section
        id="about"
        className="relative py-20 sm:py-24 lg:py-28 px-5 sm:px-6 lg:px-8 bg-[#FDF9F1] overflow-hidden"
      >
        <div className="absolute top-[-10rem] right-[-10rem] w-[32rem] h-[32rem] rounded-full bg-orange-200/25 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto">

          {/* Intro: copy + framed image */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.55 }}
              className="lg:col-span-7"
            >
              <SectionHeading
                eyebrow="About HKMV Folk"
                title="A youth club built around"
                accent="practice, not attendance."
                body="FOLK Vizag is where students and young professionals across Visakhapatnam come to build something steadier than a weekend routine. We run weekly sessions, monthly workshops, city-wide seva and yatras through the year — and behind all of it sits a simple idea: spiritual life holds up when it is practised together."
              />

              <p className="mt-5 max-w-2xl text-gray-600 leading-[1.75]" style={{ fontSize: 'clamp(1rem, 1.1vw, 1.125rem)' }}>
                Nobody is asked to arrive already convinced. Come to one kirtan, sit
                through one Gita session, serve one shift — and decide from there.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  onClick={onLoginClick}
                  className="min-h-[48px] px-7 py-3.5 bg-gray-900 text-white rounded-full font-bold text-sm hover:bg-[#FF9933] transition-all flex items-center gap-2"
                >
                  Become a member
                  <ArrowRight size={17} />
                </Button>

                <a
                  href="#programs"
                  className="min-h-[48px] px-7 py-3.5 rounded-full border border-gray-300 bg-white text-gray-800 font-bold text-sm hover:border-[#FF9933] hover:text-[#FF9933] transition-all flex items-center gap-2"
                >
                  Browse programs
                  <ChevronRight size={17} />
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-premium-2xl min-h-[340px] sm:min-h-[420px]">
                <PhotoSurface tone="folk-surface-1" icon={<Sparkles size={56} />} />

                <div className="relative z-10 h-full min-h-[340px] sm:min-h-[420px] flex flex-col justify-end p-7 sm:p-9">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                    Since 2016 · Visakhapatnam
                  </p>
                  <p className="mt-3 text-2xl sm:text-3xl font-black text-white leading-tight">
                    One temple. One city.
                    <br />
                    A few thousand friendships.
                  </p>
                </div>
              </div>

              {/* Floating accent card */}
              <div className="relative -mt-10 ml-6 mr-6 sm:ml-10 z-20 bg-white rounded-2xl shadow-premium-xl border border-orange-50 p-5 flex items-center gap-4">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-orange-50 text-[#FF9933] flex items-center justify-center">
                  <Flame size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.16em]">
                    Daily Sadhana
                  </p>
                  <p className="text-sm font-black text-gray-900">
                    15,000+ streaks logged
                  </p>
                </div>
              </div>
            </motion.div>

          </div>

          {/* PILLARS */}
          <div className="mt-20 sm:mt-24">

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
              <div className="max-w-xl">
                <div className="flex items-center gap-3">
                  <span className="h-px w-8 bg-[#FF9933]" />
                  <p className="text-[11px] sm:text-xs font-bold text-[#FF9933] uppercase tracking-[0.22em]">
                    What we actually do
                  </p>
                </div>
                <h3
                  className="mt-4 font-black tracking-tight leading-[1.08] text-gray-900"
                  style={{ fontSize: 'clamp(1.75rem, 3.6vw, 2.75rem)' }}
                >
                  Four pillars the club is
                  <span className="text-[#FF9933]"> built on.</span>
                </h3>
              </div>

              <p className="md:max-w-sm text-gray-500 leading-7 text-[15px]">
                Guidance, daily practice, service and the calendar. Each one holds the
                others up — that is why we do not run them separately.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
              {pillars.map((pillar, index) => (
                <motion.article
                  key={pillar.title}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: index * 0.07 }}
                  className="group relative bg-white rounded-[1.75rem] border border-orange-50 shadow-premium hover:shadow-premium-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Top accent strip */}
                  <div className="relative h-[104px] overflow-hidden">
                    <PhotoSurface tone={pillar.tone} scrim={false} />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />
                    <span className="absolute top-4 right-5 text-[44px] font-black text-white/45 leading-none tracking-tight">
                      {`0${index + 1}`}
                    </span>
                  </div>

                  <div className="relative px-6 sm:px-7 pb-7 -mt-8 flex flex-col flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-white text-[#FF9933] flex items-center justify-center shadow-premium-xl border border-orange-50 group-hover:bg-[#FF9933] group-hover:text-white transition-colors duration-300">
                      {pillar.icon}
                    </div>

                    <h4 className="mt-5 text-lg font-black text-gray-900 tracking-tight">
                      {pillar.title}
                    </h4>

                    <p className="mt-3 text-[14.5px] text-gray-600 leading-[1.7] flex-1">
                      {pillar.body}
                    </p>

                    <div className="mt-6 h-px w-full bg-gray-100" />

                    <button
                      type="button"
                      onClick={onLoginClick}
                      className="mt-4 min-h-[44px] -mx-1 px-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 group-hover:text-[#FF9933] transition-colors"
                    >
                      Get started
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================
          PROGRAMS
      ========================================================= */}

      <section
        id="programs"
        className="py-20 sm:py-24 lg:py-28 px-5 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-14">
            <SectionHeading
              eyebrow="Programs & Activities"
              title="Everything FOLK Vizag"
              accent="runs through the year."
              body="Six tracks, one calendar. Members move freely between them — most people start with a session or a festival and end up in all six."
            />

            <a
              href="#contact"
              className="shrink-0 min-h-[44px] inline-flex items-center gap-2 text-sm font-bold text-[#FF9933] hover:gap-3 transition-all"
            >
              Talk to a coordinator
              <ArrowRight size={17} />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {programs.map((program, index) => (
              <motion.div
                key={program.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="group relative bg-[#FDF9F1] rounded-[1.75rem] border border-orange-100/70 p-7 sm:p-8 shadow-premium hover:bg-white hover:shadow-premium-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] to-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="flex items-start justify-between gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white text-[#FF9933] flex items-center justify-center shadow-premium border border-orange-50 group-hover:bg-[#FF9933] group-hover:text-white transition-colors duration-300">
                    {program.icon}
                  </div>

                  <span className="px-3 py-1.5 rounded-full bg-white border border-orange-100 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
                    {program.meta}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-black text-gray-900 tracking-tight">
                  {program.title}
                </h3>

                <p className="mt-3 text-[14.5px] text-gray-600 leading-[1.7]">
                  {program.description}
                </p>

                <div className="mt-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 group-hover:text-[#FF9933] transition-colors">
                  Explore program
                  <ChevronRight size={15} />
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>


      {/* =========================================================
          EVENTS  (live Firestore feed)
      ========================================================= */}

      <section
        id="events"
        className="py-20 sm:py-24 lg:py-28 px-5 sm:px-6 lg:px-8 bg-[#FDF9F1]"
      >
        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <SectionHeading
              eyebrow="Events"
              title="What is coming up"
              accent="next."
              body="Kirtan nights, festivals, workshops and yatras. Members book straight from the app — most of them fill well before the day."
            />

            <a
              href="#events"
              className="shrink-0 min-h-[44px] inline-flex items-center gap-2 text-sm font-bold text-[#FF9933] hover:gap-3 transition-all"
            >
              View all events
              <ArrowRight size={17} />
            </a>
          </div>

          {sortedEvents.length > 0 ? (

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {sortedEvents.slice(0, 3).map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="group bg-white rounded-[1.75rem] border border-orange-50 overflow-hidden shadow-premium hover:shadow-premium-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
                >
                  {/* Event visual */}
                  <div className="relative h-48 overflow-hidden">
                    <PhotoSurface
                      tone={['folk-surface-1', 'folk-surface-3', 'folk-surface-2'][index % 3]}
                      icon={<Calendar size={38} strokeWidth={1.6} />}
                    />

                    <span className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-[0.14em] text-[#FF9933] shadow-premium">
                      {event.category || 'Event'}
                    </span>

                    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 text-white">
                      <Calendar size={14} className="text-[#FFC97A]" />
                      <span className="text-xs font-bold tracking-wide">
                        {event.date}
                        {event.time ? ` · ${event.time}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Event content */}
                  <div className="p-6 sm:p-7 flex flex-col flex-1">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight group-hover:text-[#FF9933] transition-colors">
                      {event.title}
                    </h3>

                    {event.location && (
                      <p className="mt-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-gray-400">
                        <MapPin size={14} className="text-[#FF9933]" />
                        {event.location}
                      </p>
                    )}

                    {event.description && (
                      <p className="mt-3 text-[14.5px] text-gray-600 leading-[1.7]">
                        {event.description}
                      </p>
                    )}

                    <button
                      onClick={onLoginClick}
                      className="mt-6 sm:mt-auto pt-6 w-full"
                      aria-label={`View details for ${event.title || 'this event'}`}
                      type="button"
                    >
                      <span className="w-full min-h-[48px] py-3.5 bg-gray-900 text-white rounded-full text-[11px] font-bold uppercase tracking-[0.14em] hover:bg-[#FF9933] transition-all duration-300 flex items-center justify-center gap-2">
                        View details
                        <ArrowRight size={14} />
                      </span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

          ) : (

            <div className="relative overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-premium py-20 px-6 text-center">
              <div className="absolute inset-0 folk-mandala opacity-[0.05]" aria-hidden="true" />

              <div className="relative">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-50 text-[#FF9933] flex items-center justify-center">
                  <Calendar size={30} />
                </div>

                <p className="mt-6 text-lg font-black text-gray-900">
                  Nothing on the calendar right now.
                </p>

                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-7">
                  New sessions, kirtans and yatras are added regularly. Sign in to be
                  notified the moment the next one opens for booking.
                </p>

                <Button
                  onClick={onLoginClick}
                  className="mt-7 min-h-[48px] px-7 py-3.5 bg-[#FF9933] text-white rounded-full font-bold text-sm hover:bg-[#e88822] transition-all inline-flex items-center gap-2"
                >
                  Notify me
                  <Bell size={16} />
                </Button>
              </div>
            </div>

          )}

        </div>
      </section>


      {/* =========================================================
          DARK ANCHOR — COMMUNITY / APP SHOWCASE
      ========================================================= */}

      <section
        id="seva"
        className="relative py-20 sm:py-24 lg:py-32 bg-[#0B0A09] overflow-hidden"
      >
        <div className="absolute inset-0 folk-mandala opacity-[0.07]" aria-hidden="true" />
        <div className="absolute top-[-12rem] right-[-10rem] w-[32rem] h-[32rem] bg-[#FF9933]/12 blur-3xl rounded-full" aria-hidden="true" />
        <div className="absolute bottom-[-14rem] left-[-12rem] w-[32rem] h-[32rem] bg-[#D4AF37]/10 blur-3xl rounded-full" aria-hidden="true" />
        <div className="absolute inset-0 folk-grain opacity-[0.22] mix-blend-overlay" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-14 h-14 bg-white/10 border border-white/15 rounded-2xl flex items-center justify-center mb-7">
              <Heart className="text-[#FF9933]" size={26} />
            </div>

            <SectionHeading
              dark
              eyebrow="The FOLK app"
              title="Your whole membership,"
              accent="in one place."
              body="Bookings, your digital ID, stay requests and your sadhana record — no group chats to scroll, no forms to chase. Built for the club, by the club."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-9">
              {appFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white/[0.06] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.1] hover:border-[#FF9933]/40 transition-all duration-300"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-[#FF9933] shrink-0" />
                    <span className="text-sm font-bold text-white">{feature.title}</span>
                  </div>
                  <p className="mt-2 text-[13px] text-white/55 leading-6">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>

            <Button
              onClick={onLoginClick}
              className="mt-9 min-h-[52px] px-8 py-4 bg-[#FF9933] text-white rounded-full font-bold text-[15px] hover:bg-[#e88822] transition-all inline-flex items-center gap-2 shadow-[0_18px_45px_-14px_rgba(255,153,51,0.75)]"
            >
              Open the app
              <ArrowRight size={18} />
            </Button>
          </motion.div>


          {/* PHONE MOCKUP */}
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8 }}
              className="relative w-full max-w-[330px]"
            >
              <div className="absolute inset-6 bg-[#FF9933]/25 blur-[80px] rounded-full" aria-hidden="true" />

              <div className="relative bg-[#1A1A1A] rounded-[3.4rem] p-3 shadow-[0_50px_90px_-25px_rgba(0,0,0,0.9)] ring-1 ring-white/10">

                <div className="bg-white rounded-[2.8rem] p-4">
                  <div className="bg-[#FDF9F1] rounded-[2.3rem] p-5 min-h-[560px]">

                    {/* PHONE HEADER */}
                    <div className="flex items-center justify-between mb-7">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF9933] to-[#D4AF37] flex items-center justify-center text-white">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.16em] text-gray-400 font-bold">
                            Member
                          </p>
                          <p className="font-black text-gray-900 text-[15px]">
                            HKMV Folk
                          </p>
                        </div>
                      </div>

                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-premium">
                        <Bell size={17} className="text-[#FF9933]" />
                      </div>
                    </div>

                    {/* DIGITAL CARD */}
                    <div className="bg-gray-900 rounded-3xl p-6 text-white mb-6 relative overflow-hidden">
                      <div className="absolute inset-0 folk-mandala opacity-[0.12]" aria-hidden="true" />
                      <div className="absolute top-[-50px] right-[-40px] w-32 h-32 rounded-full bg-[#FF9933]/20 blur-2xl" aria-hidden="true" />

                      <div className="flex justify-between items-start relative z-10">
                        <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                          <img src="/logo.png" alt="" className="h-6 w-6 object-contain" />
                        </span>
                        <Sparkles size={18} className="text-[#FFD166]" />
                      </div>

                      <div className="mt-12 relative z-10">
                        <p className="text-[9px] uppercase tracking-[0.18em] text-gray-500">
                          Digital identity
                        </p>
                        <p className="mt-1 text-lg font-black">HKMV Folk</p>
                      </div>
                    </div>

                    {/* QUICK ACCESS */}
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 px-1 mb-4">
                      Quick access
                    </p>

                    <div className="space-y-3">
                      {quickAccess.map((item) => (
                        <div
                          key={item.title}
                          className="p-4 bg-white rounded-2xl flex items-center justify-between shadow-premium"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF9933] flex items-center justify-center">
                              {item.icon}
                            </div>
                            <span className="text-sm font-bold">{item.title}</span>
                          </div>
                          <ChevronRight size={15} className="text-gray-300" />
                        </div>
                      ))}
                    </div>

                    {/* PHONE NAV */}
                    <div className="mt-8 h-14 bg-white rounded-full shadow-premium flex items-center justify-around">
                      <div className="w-9 h-9 rounded-full bg-[#FF9933] text-white flex items-center justify-center">
                        <Heart size={16} />
                      </div>
                      <Calendar size={18} className="text-gray-300" />
                      <Home size={18} className="text-gray-300" />
                      <User size={18} className="text-gray-300" />
                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          </div>

        </div>
      </section>


      {/* =========================================================
          ACCOMMODATION
      ========================================================= */}

      <section
        id="accommodation"
        className="py-20 sm:py-24 lg:py-28 px-5 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-7xl mx-auto">

          <SectionHeading
            eyebrow="Accommodation"
            title="Stay close to"
            accent="the practice."
            body="Visiting for a festival, a camp or a weekend of seva? Members can request a temple stay in a couple of taps and track the approval in the app."
          />

          <div className="mt-12 sm:mt-14 grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">

            {/* FEATURE CARD */}
            <motion.div
              initial={{ opacity: 0, x: -22 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55 }}
              className="lg:col-span-2 relative overflow-hidden rounded-[2rem] min-h-[420px] flex flex-col justify-end shadow-premium-2xl"
            >
              <PhotoSurface tone="folk-surface-2" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0A09] via-[#0B0A09]/70 to-[#0B0A09]/25" aria-hidden="true" />

              <div className="relative z-10 p-7 sm:p-9">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <Home size={26} className="text-[#FF9933]" />
                </div>

                <p className="mt-7 text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">
                  Temple stay
                </p>

                <h3 className="mt-3 text-3xl sm:text-4xl font-black text-white leading-[1.08] tracking-tight">
                  A simple room,
                  <br />
                  <span className="text-[#FF9933]">a full morning program.</span>
                </h3>

                <p className="mt-4 text-[15px] text-white/70 leading-7 max-w-md">
                  Check rooms, facilities and availability, then send your request —
                  approvals come straight back to your phone.
                </p>

                <Button
                  onClick={onLoginClick}
                  className="mt-7 w-full sm:w-fit min-h-[50px] px-7 py-3.5 bg-[#FF9933] text-white rounded-full font-bold text-sm hover:bg-[#e88822] transition-all flex items-center justify-center gap-2"
                >
                  Request accommodation
                  <ArrowRight size={17} />
                </Button>
              </div>
            </motion.div>


            {/* INFO GRID */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {accommodationInfo.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group bg-[#FDF9F1] rounded-2xl border border-orange-100/70 p-6 shadow-premium hover:bg-white hover:shadow-premium-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white text-[#FF9933] flex items-center justify-center shadow-premium border border-orange-50 group-hover:bg-[#FF9933] group-hover:text-white transition-colors">
                      {item.icon}
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-[#FF9933] transition-colors" />
                  </div>

                  <h3 className="mt-5 text-[17px] font-black text-gray-900 tracking-tight">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-[14px] text-gray-600 leading-[1.65]">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================
          GALLERY
      ========================================================= */}

      <section
        id="gallery"
        className="py-20 sm:py-24 lg:py-28 px-5 sm:px-6 lg:px-8 bg-[#FDF9F1]"
      >
        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-14">
            <SectionHeading
              eyebrow="Gallery"
              title="Moments that bring"
              accent="the club together."
              body="Festivals, youth sessions, seva shifts and the long road trips in between — a look at what an ordinary year at FOLK Vizag looks like."
            />

            <a
              href="#contact"
              className="shrink-0 min-h-[44px] inline-flex items-center gap-2 text-sm font-bold text-[#FF9933] hover:gap-3 transition-all"
            >
              View more
              <ArrowRight size={17} />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {galleryItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className={`group relative overflow-hidden rounded-[1.75rem] shadow-premium hover:shadow-premium-2xl transition-all duration-300 ${item.size}`}
              >
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.06]">
                  <PhotoSurface tone={item.tone} icon={item.icon} />
                </div>

                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-[0.14em] text-gray-700 shadow-premium">
                    HKMV Folk
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6">
                  <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-[12px] sm:text-[13px] text-white/65 leading-5">
                        {item.caption}
                      </p>
                    </div>

                    <div className="w-11 h-11 shrink-0 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white group-hover:bg-[#FF9933] group-hover:border-[#FF9933] transition-all">
                      <ArrowUpRight size={18} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>


      {/* =========================================================
          COMMUNITY VOICES
      ========================================================= */}

      <section
        id="testimonials"
        className="py-20 sm:py-24 lg:py-28 px-5 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-7xl mx-auto">

          <SectionHeading
            align="center"
            eyebrow="Community voices"
            title="Why members"
            accent="keep coming back."
            body="Reflections from people in the club. We are collecting more as the circle grows."
          />

          <div className="mt-12 sm:mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {voices.map((item, index) => (
              <motion.figure
                key={item.role}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="group relative bg-[#FDF9F1] rounded-[1.75rem] border border-orange-100/70 p-7 sm:p-8 shadow-premium hover:bg-white hover:shadow-premium-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5 text-[#FF9933]" aria-label="Five out of five">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-sm" aria-hidden="true">★</span>
                    ))}
                  </div>

                  <Quote size={26} className="text-orange-200 group-hover:text-[#FF9933]/40 transition-colors" />
                </div>

                <blockquote className="mt-6 text-[15px] text-gray-700 leading-[1.8] flex-1">
                  {item.quote}
                </blockquote>

                <figcaption className="mt-7 pt-5 border-t border-gray-200 flex items-center gap-3">
                  <div className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-[#FF9933] to-[#D4AF37] flex items-center justify-center text-white">
                    <Users size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900">{item.role}</p>
                    <p className="text-xs text-gray-400">{item.detail}</p>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </div>

        </div>
      </section>


      {/* =========================================================
          CTA
      ========================================================= */}

      <section
        id="join"
        className="py-20 sm:py-24 lg:py-28 px-5 sm:px-6 lg:px-8 bg-[#FDF9F1]"
      >
        <div className="max-w-6xl mx-auto">

          <div className="relative overflow-hidden bg-[#0B0A09] rounded-[2.25rem] lg:rounded-[3rem] px-7 py-14 sm:p-16 lg:p-24 text-center shadow-premium-2xl">

            <div className="absolute inset-0 folk-mandala opacity-[0.08]" aria-hidden="true" />
            <div className="absolute top-[-9rem] left-[-7rem] w-80 h-80 bg-[#FF9933]/18 rounded-full blur-3xl" aria-hidden="true" />
            <div className="absolute bottom-[-9rem] right-[-7rem] w-80 h-80 bg-[#D4AF37]/14 rounded-full blur-3xl" aria-hidden="true" />
            <div className="absolute inset-0 folk-grain opacity-[0.2] mix-blend-overlay" aria-hidden="true" />

            <div className="relative z-10">

              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 bg-white/10 border border-white/15 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-md"
              >
                <Sparkles size={32} className="text-[#FF9933]" />
              </motion.div>

              <p className="mt-8 text-[11px] sm:text-xs font-bold text-[#FF9933] uppercase tracking-[0.22em]">
                Be part of the community
              </p>

              <h2
                className="mt-5 font-black tracking-[-0.03em] text-white leading-[0.95]"
                style={{ fontSize: 'clamp(2.25rem, 6.4vw, 4.75rem)' }}
              >
                <span className="folk-stroke">Connect.</span>
                <br />
                <span className="text-[#FF9933]">Participate.</span>
                <br />
                Serve.
              </h2>

              <p className="mt-7 text-white/65 max-w-2xl mx-auto leading-[1.75]" style={{ fontSize: 'clamp(1rem, 1.2vw, 1.125rem)' }}>
                Create your membership in a minute. Book your first event, log your
                first round and meet the rest of the Vizag circle.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3.5 sm:gap-4">
                <Button
                  onClick={onLoginClick}
                  className="min-h-[52px] px-9 py-4 bg-[#FF9933] text-white rounded-full font-bold text-[15px] hover:bg-[#e88822] transition-all flex items-center justify-center gap-2 shadow-[0_18px_45px_-14px_rgba(255,153,51,0.8)]"
                >
                  Join HKMV Folk
                  <ArrowRight size={18} />
                </Button>

                <a
                  href="#events"
                  className="min-h-[52px] px-9 py-4 bg-white/8 border border-white/20 backdrop-blur-md text-white rounded-full font-bold text-[15px] hover:bg-white hover:text-gray-900 transition-all flex items-center justify-center gap-2"
                >
                  Explore events
                  <ChevronRight size={18} />
                </a>
              </div>

              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex flex-wrap justify-center gap-x-7 gap-y-3">
                  {['Events', 'Seva', 'Sadhana', 'Accommodation', 'Community'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-white/55">
                      <CheckCircle2 size={15} className="text-[#FF9933]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =========================================================
          CONTACT
      ========================================================= */}

      <section
        id="contact"
        className="py-20 sm:py-24 lg:py-28 px-5 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          <div className="lg:col-span-6">
            <SectionHeading
              eyebrow="Contact"
              title="Come by, or just"
              accent="say hello first."
              body="Questions about programs, events, seva or a temple stay? The FOLK coordinators are the fastest way in — most people start with a single message and end up at a kirtan that weekend."
            />

            <div className="mt-10 space-y-4">

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#FDF9F1] border border-orange-100/70 shadow-premium">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white text-[#FF9933] flex items-center justify-center shadow-premium border border-orange-50">
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-[15px]">Visit us</h3>
                  <p className="mt-1 text-sm text-gray-600 leading-6">
                    Hare Krishna Movement, Visakhapatnam, Andhra Pradesh.
                    Youth sessions run at the temple through the week.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#FDF9F1] border border-orange-100/70 shadow-premium">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white text-[#FF9933] flex items-center justify-center shadow-premium border border-orange-50">
                  <Phone size={22} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-[15px]">Youth desk</h3>
                  <p className="mt-1 text-sm text-gray-600 leading-6">
                    Reach a FOLK coordinator for programs, seva slots or a stay
                    request. Sign in and your message routes straight to the team.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#FDF9F1] border border-orange-100/70 shadow-premium">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white text-[#FF9933] flex items-center justify-center shadow-premium border border-orange-50">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-[15px]">Stay in the loop</h3>
                  <p className="mt-1 text-sm text-gray-600 leading-6">
                    Members get event announcements, yatra dates and booking links
                    before they go public.
                  </p>
                </div>
              </div>

            </div>
          </div>


          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55 }}
            className="lg:col-span-6 w-full"
          >
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0B0A09] p-8 sm:p-10 shadow-premium-2xl">
              <div className="absolute inset-0 folk-mandala opacity-[0.08]" aria-hidden="true" />
              <div className="absolute top-[-6rem] right-[-6rem] w-72 h-72 bg-[#FF9933]/16 rounded-full blur-3xl" aria-hidden="true" />

              <div className="relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#FF9933]">
                  Getting started
                </p>

                <h3 className="mt-4 text-3xl sm:text-4xl font-black text-white leading-[1.08] tracking-tight">
                  Three steps and
                  <span className="text-[#FF9933]"> you are in.</span>
                </h3>

                <div className="mt-8 space-y-5">
                  {[
                    { step: '01', title: 'Create your membership', body: 'Name, phone, done. You get a digital ID card straight away.' },
                    { step: '02', title: 'Book your first session', body: 'Pick anything on the calendar — a kirtan night is the easiest start.' },
                    { step: '03', title: 'Find your people', body: 'Join a sadhana group and a seva team. That is where it sticks.' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <span className="shrink-0 w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[13px] font-black text-[#FF9933]">
                        {item.step}
                      </span>
                      <div>
                        <p className="text-[15px] font-black text-white">{item.title}</p>
                        <p className="mt-1 text-[13.5px] text-white/55 leading-6">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={onLoginClick}
                  className="mt-9 w-full min-h-[52px] px-8 py-4 bg-[#FF9933] text-white rounded-full font-bold text-[15px] hover:bg-[#e88822] transition-all flex items-center justify-center gap-2"
                >
                  Create my membership
                  <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          </motion.div>

        </div>
      </section>


      {/* =========================================================
          FOOTER
      ========================================================= */}

      <footer className="relative bg-[#0B0A09] border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 folk-mandala opacity-[0.05]" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-12">

            {/* BRAND */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-[0_10px_28px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
                  <img src="/logo.png" alt="Folk Vizag logo" className="h-9 w-9 object-contain" />
                </span>
                <span className="leading-tight">
                  <span className="block text-[15px] font-black text-white tracking-tight">FOLK Vizag</span>
                  <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">
                    Hare Krishna Movement
                  </span>
                </span>
              </div>

              <p className="mt-6 text-sm text-white/55 leading-7 max-w-xs">
                The youth club of the Hare Krishna Movement, Visakhapatnam —
                connecting people through practice, community and seva.
              </p>
            </div>

            {/* EXPLORE */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">Explore</h3>
              <div className="mt-5 flex flex-col gap-3">
                {[
                  { href: '#about', label: 'About' },
                  { href: '#programs', label: 'Programs' },
                  { href: '#events', label: 'Events' },
                  { href: '#gallery', label: 'Gallery' },
                ].map((link) => (
                  <a key={link.href} href={link.href} className="text-sm text-white/55 hover:text-[#FF9933] transition">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* COMMUNITY */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">Community</h3>
              <div className="mt-5 flex flex-col gap-3">
                {[
                  { href: '#seva', label: 'Seva' },
                  { href: '#accommodation', label: 'Accommodation' },
                  { href: '#testimonials', label: 'Community voices' },
                  { href: '#join', label: 'Join HKMV Folk' },
                ].map((link) => (
                  <a key={link.href} href={link.href} className="text-sm text-white/55 hover:text-[#FF9933] transition">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* CONNECT */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">Connect</h3>

              <p className="mt-5 text-sm text-white/55 leading-7">
                Stay close to what is happening — events, yatras and everything
                the club is planning next.
              </p>

              <div className="mt-5 flex gap-3">
                {[
                  { label: 'Community channel', icon: <MessageCircle size={17} /> },
                  { label: 'Kirtan playlist', icon: <Music size={17} /> },
                  { label: 'Updates channel', icon: <Bell size={17} /> },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    aria-label={item.label}
                    className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/55 hover:text-[#FF9933] hover:border-[#FF9933] transition"
                  >
                    {item.icon}
                  </button>
                ))}
              </div>

              <Button
                onClick={onLoginClick}
                className="mt-6 min-h-[46px] px-6 py-3 bg-white/10 border border-white/15 text-white rounded-full font-bold text-[13px] hover:bg-[#FF9933] hover:border-[#FF9933] transition-all inline-flex items-center gap-2"
              >
                Member login
                <ArrowUpRight size={15} />
              </Button>
            </div>

          </div>

          <div className="mt-14 h-px w-full folk-rule" aria-hidden="true" />

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/35">
              © {new Date().getFullYear()} FOLK VIZAG. All rights reserved.
            </p>

            <p className="text-xs text-white/35 tracking-wide">
              Spirituality · Community · Seva
            </p>
          </div>

        </div>
      </footer>


      {/* =========================================================
          FLOATING CONTACT BUTTON
      ========================================================= */}

      <a
        href="#contact"
        aria-label="Contact FOLK Vizag"
        className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40 w-14 h-14 rounded-full bg-[#FF9933] text-white flex items-center justify-center shadow-[0_18px_40px_-10px_rgba(255,153,51,0.8)] ring-4 ring-[#FF9933]/15 hover:bg-[#e88822] hover:scale-105 active:scale-95 transition-all"
      >
        <MessageCircle size={24} />
      </a>

    </div>
  );
};

export default Landing;
