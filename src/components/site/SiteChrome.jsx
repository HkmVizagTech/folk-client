import { useEffect, useState } from 'react';
import { Menu, X, Phone, MessageCircle, MapPin, ArrowUpRight } from 'lucide-react';
import { SITE, whatsappLink } from '../../content/site';
import { Button } from '../ui';
import { cn } from '../../lib/utils';
import UtilityBar from './UtilityBar';
import { Lotus } from './Ornament';
import SiteLink from './SiteLink';

export const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/programs', label: 'Programs' },
  { href: '/events', label: 'Events' },
  { href: '/trips', label: 'Yatras' },
  { href: '/residency', label: 'Residency' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

const telHref = (phone) => `tel:${phone.replace(/\s/g, '')}`;

/**
 * Public site header: utility strip that scrolls away, then a sticky bar with
 * the logo, plain links and one saffron action.
 */
export const SiteHeader = ({ onLoginClick, active }) => {
  const [open, setOpen] = useState(false);
  const [raised, setRaised] = useState(false);

  useEffect(() => {
    const onScroll = () => setRaised(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <UtilityBar />
      <header
        className={cn(
          'sticky top-0 z-50 border-b border-line/80 bg-white/90 backdrop-blur-md transition-shadow duration-300',
          raised && 'shadow-premium-xl',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:h-[72px] sm:px-6 lg:px-8">
          <SiteLink href="/" className="flex shrink-0 items-center gap-3 rounded-lg" aria-label={`${SITE.name} home`}>
            <img src="/folk_logo_blue.png" alt="" className="h-10 w-auto sm:h-12" />
            <span className="hidden leading-tight text-ink sm:block">
              <span className="block font-display text-[16px] font-semibold">{SITE.tagline}</span>
              <span className="block text-[12.5px] text-ink-muted">Hare Krishna Movement, Visakhapatnam</span>
            </span>
          </SiteLink>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV_LINKS.map((l) => (
              <SiteLink
                key={l.href}
                href={l.href}
                aria-current={active === l.href ? 'page' : undefined}
                className={cn(
                  'relative rounded-full px-3.5 py-2 text-[15px] font-semibold transition-colors',
                  active === l.href ? 'bg-saffron-50 text-saffron-dark' : 'text-ink hover:bg-paper hover:text-saffron-dark',
                )}
              >
                {l.label}
              </SiteLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button onClick={onLoginClick} size="md" className="px-6">Login</Button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-paper lg:hidden"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="animate-fade-in border-t border-line bg-white lg:hidden" aria-label="Main">
            <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
              {NAV_LINKS.map((l) => (
                <SiteLink
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[48px] items-center justify-between border-b border-line text-[16px] font-semibold text-ink last:border-0 hover:text-saffron-dark"
                >
                  {l.label}
                </SiteLink>
              ))}
            </div>
          </nav>
        )}
      </header>
    </>
  );
};

const FooterHeading = ({ children }) => (
  <h2 className="font-sans text-[13px] font-bold uppercase tracking-label text-marigold">{children}</h2>
);

export const SiteFooter = () => {
  const wa = whatsappLink();
  const year = new Date().getFullYear();
  const linkClass = 'transition-colors hover:text-marigold-light';
  return (
    <footer className="relative overflow-hidden bg-navy-900 text-white/70">
      <div className="h-1 bg-gradient-to-r from-saffron via-marigold to-saffron" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-16">
        <div className="max-w-md sm:col-span-2 lg:col-span-5">
          <img src="/folk_logo_white.png" alt={SITE.name} className="h-16 w-auto" />
          <p className="mt-5 text-[15px] leading-relaxed">
            {SITE.fullName} ({SITE.name}) is the youth wing of the {SITE.parent}, for students and
            young working professionals.
          </p>
          {SITE.parentUrl && (
            <a
              href={SITE.parentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn('mt-5 inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-semibold text-marigold', linkClass)}
            >
              Visit the temple website <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          )}
        </div>

        <div className="lg:col-span-3">
          <FooterHeading>Explore</FooterHeading>
          <ul className="mt-4 space-y-1 text-[15px]">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <SiteLink href={l.href} className={cn('inline-flex min-h-[36px] items-center', linkClass)}>{l.label}</SiteLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-4">
          <FooterHeading>Reach us</FooterHeading>
          <ul className="mt-4 space-y-3.5 text-[15px]">
            {SITE.contact.address && (
              <li className="flex gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-marigold" aria-hidden="true" />
                {SITE.contact.mapsUrl
                  ? <a href={SITE.contact.mapsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>{SITE.contact.address}</a>
                  : <span>{SITE.contact.address}</span>}
              </li>
            )}
            {SITE.contact.phone && (
              <li className="flex gap-3">
                <Phone size={18} className="mt-0.5 shrink-0 text-marigold" aria-hidden="true" />
                <a href={telHref(SITE.contact.phone)} className={linkClass}>{SITE.contact.phone}</a>
              </li>
            )}
            {wa && (
              <li className="flex gap-3">
                <MessageCircle size={18} className="mt-0.5 shrink-0 text-marigold" aria-hidden="true" />
                <a href={wa} target="_blank" rel="noopener noreferrer" className={linkClass}>WhatsApp</a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 text-[13px] text-white/55 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <span>© {year} {SITE.name} · {SITE.parent}</span>
          <span className="inline-flex items-center gap-2 text-marigold/80">
            <Lotus className="h-4 w-auto" /> Chant Hare Krishna and be happy
          </span>
        </div>
      </div>
    </footer>
  );
};
