import React, { useEffect, useState } from 'react';
import { Menu, X, Phone, MessageCircle, Instagram, Youtube, Facebook, MapPin } from 'lucide-react';
import { SITE, whatsappLink } from '../../content/site';

export const NAV_LINKS = [
  { href: '/#about', label: 'About' },
  { href: '/#programs', label: 'Programs' },
  { href: '/#events', label: 'Events' },
  { href: '/trips', label: 'Yatras' },
  { href: '/#residency', label: 'Residency' },
  { href: '/#contact', label: 'Contact' },
];

const socialLinks = () => [
  SITE.social.instagram && { href: SITE.social.instagram, label: 'Instagram', icon: Instagram },
  SITE.social.youtube && { href: SITE.social.youtube, label: 'YouTube', icon: Youtube },
  SITE.social.facebook && { href: SITE.social.facebook, label: 'Facebook', icon: Facebook },
].filter(Boolean);

/** Thin black strip above the header: phone, WhatsApp, socials. */
const TopStrip = () => {
  const wa = whatsappLink();
  return (
    <div className="bg-navy text-white/90 text-[13px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 min-w-0">
          {SITE.contact.phone && (
            <a href={`tel:${SITE.contact.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-ink">
              <Phone size={13} aria-hidden="true" /> <span>{SITE.contact.phone}</span>
            </a>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1.5 hover:text-ink">
              <MessageCircle size={13} aria-hidden="true" /> WhatsApp us
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          {socialLinks().map(({ href, label, icon: Icon }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="hover:text-ink">
              <Icon size={15} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Public site header, folknet-style: black utility strip, dark bar with the
 * white logo and plain links, one saffron action.
 */
export const SiteHeader = ({ onLoginClick, active }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 shadow-[0_1px_0_#EADFCB]">
      <TopStrip />
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] sm:h-20 flex items-center justify-between gap-6">
          <a href="/" className="flex items-center gap-3 shrink-0" aria-label={`${SITE.name} home`}>
            <img src="/folk_logo_blue.png" alt="" className="h-11 sm:h-14 w-auto" />
            <span className="hidden sm:block leading-tight text-ink">
              <span className="block font-display text-[16px] font-semibold">{SITE.tagline}</span>
              <span className="block text-[13px] text-ink-muted">Hare Krishna Movement, Visakhapatnam</span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-7" aria-label="Main">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`text-[15px] font-semibold transition-colors ${
                  active === l.label ? 'text-saffron-dark' : 'text-ink hover:text-saffron-dark'
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onLoginClick} className="btn-primary min-h-[42px] px-5">
              Login
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="lg:hidden w-11 h-11 inline-flex items-center justify-center rounded-full text-ink hover:bg-paper"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="lg:hidden border-t border-line bg-white" aria-label="Main">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-3.5 text-[16px] font-semibold text-ink border-b border-line last:border-0 hover:text-saffron-dark"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export const SiteFooter = () => {
  const wa = whatsappLink();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-paper-dark text-ink-muted border-t border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2 max-w-md">
          <img src="/folk_logo_blue.png" alt={SITE.name} className="h-16 w-auto" />
          <p className="mt-4 text-[15px] leading-relaxed">
            {SITE.fullName} ({SITE.name}) is the youth wing of the {SITE.parent}, for students and
            young working professionals.
          </p>
        </div>

        <div>
          <h2 className="font-sans text-sm font-bold uppercase tracking-label text-navy">Explore</h2>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            {NAV_LINKS.map((l) => (
              <li key={l.href}><a href={l.href} className="hover:text-ink">{l.label}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-sans text-sm font-bold uppercase tracking-label text-navy">Reach us</h2>
          <ul className="mt-4 space-y-3 text-[15px]">
            {SITE.contact.address && (
              <li className="flex gap-2.5">
                <MapPin size={17} className="mt-0.5 shrink-0 text-saffron" aria-hidden="true" />
                {SITE.contact.mapsUrl
                  ? <a href={SITE.contact.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ink">{SITE.contact.address}</a>
                  : <span>{SITE.contact.address}</span>}
              </li>
            )}
            {SITE.contact.phone && (
              <li className="flex gap-2.5">
                <Phone size={17} className="mt-0.5 shrink-0 text-saffron" aria-hidden="true" />
                <a href={`tel:${SITE.contact.phone.replace(/\s/g, '')}`} className="hover:text-ink">{SITE.contact.phone}</a>
              </li>
            )}
            {wa && (
              <li className="flex gap-2.5">
                <MessageCircle size={17} className="mt-0.5 shrink-0 text-saffron" aria-hidden="true" />
                <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-ink">WhatsApp</a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-[13px] text-ink-muted flex flex-wrap gap-x-6 gap-y-2 justify-between">
          <span>© {year} {SITE.name} · {SITE.parent}</span>
          <span>Chant Hare Krishna and be happy</span>
        </div>
      </div>
    </footer>
  );
};
