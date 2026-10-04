import { Phone, Mail, Instagram, Youtube, Facebook, Clock } from 'lucide-react';
import { SITE } from '../../content/site';

/**
 * The thin strip above the navigation: how to reach the temple, whether the
 * doors are open right now, and where to follow FOLK.
 *
 * Darshan hours are the temple's published daily schedule, so "open now" is
 * worked out from the clock in India rather than the visitor's own timezone —
 * a boy checking from another state still sees the truth.
 */

// Hare Krishna Movement Visakhapatnam, from harekrishnavizag.org.
const DARSHAN = [
  { from: '04:30', to: '13:00' },
  { from: '16:30', to: '20:30' },
];

const istNow = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date()).reduce((o, p) => ({ ...o, [p.type]: p.value }), {});
  return `${parts.hour}:${parts.minute}`;
};

const darshanState = () => {
  const now = istNow();
  const open = DARSHAN.find((w) => now >= w.from && now < w.to);
  if (open) return { open: true, text: `Darshan open · till ${open.to}` };
  const next = DARSHAN.find((w) => now < w.from) || DARSHAN[0];
  return { open: false, text: `Darshan from ${next.from}` };
};

const SOCIALS = [
  { href: SITE.social.instagram, label: 'Instagram', Icon: Instagram },
  { href: SITE.social.youtube, label: 'YouTube', Icon: Youtube },
  { href: SITE.social.facebook, label: 'Facebook', Icon: Facebook },
].filter((s) => s.href);

const UtilityBar = () => {
  const darshan = darshanState();

  return (
    <div className="hidden sm:block bg-[#2B1F17] text-white/80 text-[12.5px]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 h-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 min-w-0">
          {SITE.contact.phone && (
            <a href={`tel:${SITE.contact.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone size={13} aria-hidden="true" /> {SITE.contact.phone}
            </a>
          )}
          {SITE.contact.email && (
            <a href={`mailto:${SITE.contact.email}`} className="hidden md:inline-flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail size={13} aria-hidden="true" /> {SITE.contact.email}
            </a>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${darshan.open ? 'bg-emerald-400' : 'bg-white/35'}`} aria-hidden="true" />
            <Clock size={13} aria-hidden="true" className="hidden md:block" />
            {darshan.text}
          </span>
          {SOCIALS.length > 0 && (
            <span className="hidden md:flex items-center gap-3 border-l border-white/15 pl-4">
              {SOCIALS.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="hover:text-white transition-colors">
                  <Icon size={14} />
                </a>
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default UtilityBar;
