// Real-world facts shown on the public site, kept in one place so they are
// easy to correct. Nothing here should be invented: if a detail isn't known,
// leave it empty and the page hides that line instead of showing filler.

export const SITE = {
  name: 'FOLK Vizag',
  fullName: 'Friends of Lord Krishna',
  tagline: 'Youth Empowerment Club',
  parent: 'Hare Krishna Movement, Visakhapatnam',

  // All of this is the temple's own published contact, taken from
  // harekrishnavizag.org so the two never disagree.
  contact: {
    phone: '+91 89777 61187',
    whatsapp: '918977761187',
    email: 'social@hkmvizag.org',
    address: 'Chaitanya Bhavan, Hare Krishna Vaikuntham Cultural Centre, IIM Rd, opp. Akshaya Patra Foundation, Gambhiram, Visakhapatnam, Andhra Pradesh 531163',
    mapsUrl: 'https://maps.app.goo.gl/Yg2imkSEDxuY5u2K9',
  },

  social: {
    // FOLK keeps its own Instagram; the rest are the temple's channels.
    instagram: 'https://www.instagram.com/folkvizag/',
    youtube: 'https://www.youtube.com/user/harekrishnavizag',
    facebook: 'https://www.facebook.com/hkm.vizag/',
  },

  // The temple's own site, linked from the footer.
  parentUrl: 'https://harekrishnavizag.org',
};

export const whatsappLink = (text = 'Hare Krishna! I would like to know more about FOLK Vizag.') =>
  SITE.contact.whatsapp ? `https://wa.me/${SITE.contact.whatsapp}?text=${encodeURIComponent(text)}` : '';

// The six things FOLK offers, in the order a newcomer usually meets them.
// `href` is where the tile leads; `login: true` opens sign-in instead.
export const PROGRAMS = [
  {
    key: 'weekly',
    title: 'Weekly Programs',
    body: 'Kirtan, a Bhagavad-gita talk and prasadam with other students and young professionals.',
    href: '#events',
  },
  {
    key: 'retreats',
    title: 'Retreats',
    body: 'Weekend retreats away from screens and deadlines, with practical classes on mind and lifestyle.',
    href: '#events',
  },
  {
    key: 'yatras',
    title: 'Yatras',
    body: 'Pilgrimages to holy places with the FOLK group. Book a seat and pay online.',
    href: '/trips',
  },
  {
    key: 'residency',
    title: 'Residency',
    body: 'Live with like-minded young men near the temple, with a simple daily spiritual routine.',
    href: '#residency',
  },
  {
    key: 'seva',
    title: 'Seva',
    body: 'Serve at festivals, prasadam distribution and outreach alongside people your age.',
    login: true,
  },
  {
    key: 'courses',
    title: 'Courses & Workshops',
    body: 'Step-by-step courses on the Gita, meditation and the art of living well.',
    login: true,
  },
];

// Real photos, served from /public/photos. Leave a slot null until a real
// photo exists; the page then uses a layout that doesn't need one.
// Recommended: landscape JPG/WebP, at least 1600px wide, under 400 KB.
export const PHOTOS = {
  hero: null,         // e.g. '/photos/hero-kirtan.jpg'
  residency: null,
  gallery: [],        // e.g. [{ src: '/photos/janmashtami.jpg', caption: 'Janmashtami 2026' }]
};
