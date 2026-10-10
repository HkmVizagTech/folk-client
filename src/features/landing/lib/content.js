import {
  Compass, Sunrise, HandHeart, MapPin, Users, Sparkles, BookOpen, Calendar,
  Home, CheckCircle2, Clock3, Heart, Music, Flame,
} from 'lucide-react';

export const HERO_STATS = [
  { value: 2500, suffix: '+', label: 'Active members' },
  { value: 120, suffix: '+', label: 'Events hosted' },
  { value: 15000, suffix: '+', label: 'Sadhana streaks' },
  { value: 500, suffix: '+', label: 'Temple stays' },
];

export const HERO_CHIPS = [
  { label: 'Sadhana Tracker', Icon: Flame },
  { label: 'Youth Programs', Icon: Users },
  { label: 'Seva & Outreach', Icon: HandHeart },
  { label: 'Yatras & Camps', Icon: Compass },
  { label: 'Temple Stays', Icon: Home },
];

export const PILLARS = [
  {
    title: 'Spiritual Guidance',
    Icon: Compass,
    body: 'Every new member is paired with a senior devotee who actually knows your name, your semester and what you are wrestling with. The questions students bring us are rarely abstract, so the answers are not either.',
  },
  {
    title: 'Daily Sadhana',
    Icon: Sunrise,
    body: 'Chanting, reading and early mornings hold up far better when you are not doing them alone. Log your rounds in the app, keep your streak alive and watch the rest of the Vizag circle moving alongside you.',
  },
  {
    title: 'Community & Seva',
    Icon: HandHeart,
    body: 'Serve in the temple kitchen, on book distribution and at city outreach beside people your own age. Seva is where the friendships here are actually made, not at the tea stall afterwards.',
  },
  {
    title: 'Events & Yatras',
    Icon: MapPin,
    body: 'Kirtan nights, Janmashtami, youth camps and yatras across Andhra, all bookable from your phone in under a minute. Come along once and the reason people keep returning stops needing an explanation.',
  },
];

export const PROGRAMS = [
  { title: 'Youth Programs', meta: 'Weekly', Icon: Users, description: 'Sessions built around what college life in Vizag actually looks like: focus, friendships, pressure and purpose.' },
  { title: 'Spiritual Sessions', meta: 'Weekly', Icon: Sparkles, description: 'Bhagavad-gita discussion, kirtan and open Q&A where nothing is too basic and no question gets brushed aside.' },
  { title: 'Workshops', meta: 'Monthly', Icon: BookOpen, description: 'Practical, hands-on formats on mind management, time, relationships and staying steady through exam season.' },
  { title: 'Festivals & Events', meta: 'Year-round', Icon: Calendar, description: 'Janmashtami, Gaura Purnima, Govardhan and the kirtan nights in between, the calendar the whole club plans around.' },
  { title: 'Seva', meta: 'Ongoing', Icon: HandHeart, description: 'Prasadam distribution, temple service and outreach across the city. Pick a slot, show up, and you are part of it.' },
  { title: 'Yatras & Trips', meta: 'Seasonal', Icon: Compass, description: 'Pilgrimage journeys and weekend trips with the crew, the part of the year most members mark on the calendar first.' },
];

export const APP_FEATURES = [
  { title: 'Event Bookings', body: 'Reserve your spot before it fills up.' },
  { title: 'Digital ID Card', body: 'Your membership, scannable at the gate.' },
  { title: 'Stay Approvals', body: 'Request a temple stay and track it live.' },
  { title: 'Sadhana Streaks', body: 'Log rounds and keep the chain unbroken.' },
];

export const QUICK_ACCESS = [
  { title: 'Upcoming Events', Icon: Calendar },
  { title: 'Seva Activities', Icon: Heart },
  { title: 'Accommodation', Icon: Home },
];

export const STAY_INFO = [
  { title: 'Location', Icon: MapPin, description: 'Where the stay is, how to reach it and what is nearby.' },
  { title: 'Room Information', Icon: Home, description: 'Room types, sharing options and what each stay includes.' },
  { title: 'Facilities', Icon: CheckCircle2, description: 'Meals, prasadam timings and the essentials provided on site.' },
  { title: 'Availability', Icon: Calendar, description: 'Check open dates before you send a stay request.' },
  { title: 'Daily Schedule', Icon: Clock3, description: 'Morning program, aarti and session timings during your stay.' },
  { title: 'Rules & Guidelines', Icon: BookOpen, description: 'What to bring, what to expect and how the house runs.' },
];

// `image` uses a real photo from /public; tiles without one fall back to a
// themed gradient so the mosaic never shows an empty frame.
export const GALLERY_TILES = [
  { title: 'Festivals', caption: 'Janmashtami, Gaura Purnima & more', Icon: Sparkles, image: '/krishna_toy.png', position: 'center 30%', span: 'lg:col-span-2 lg:row-span-2', tone: 'from-saffron to-navy-700' },
  { title: 'Youth Programs', caption: 'Weekly sessions across the city', Icon: Users, tone: 'from-navy-600 to-navy-900' },
  { title: 'Seva', caption: 'Kitchen, outreach & distribution', Icon: Heart, tone: 'from-saffron-dark to-navy-800' },
  { title: 'Workshops', caption: 'Mind, focus & daily discipline', Icon: BookOpen, tone: 'from-marigold-dark to-navy-700' },
  { title: 'Kirtan Nights', caption: 'Music that runs past midnight', Icon: Music, tone: 'from-navy-500 to-saffron-dark' },
  { title: 'Yatras', caption: 'Journeys across Andhra & beyond', Icon: MapPin, image: '/hero.png', position: '75% 70%', span: 'sm:col-span-2 lg:col-span-4', tone: 'from-marigold to-navy-700' },
];

export const VOICES = [
  {
    quote: 'I came for one kirtan night because a friend dragged me along, and ended up staying for the people. Three years later this is the part of my week I plan everything else around.',
    role: 'Member since 2022',
    detail: 'B.Tech student, Vizag',
  },
  {
    quote: 'The sadhana streak sounds like a small thing until you have kept one for ninety days. Having the whole group visible in the app is what got me past the first two weeks.',
    role: 'Sadhana group',
    detail: 'Joined through a campus program',
  },
  {
    quote: 'Seva was where I actually made friends here. You work a shift together, you eat together afterwards, and by the third time nobody is a stranger any more.',
    role: 'Seva volunteer',
    detail: 'Weekend outreach team',
  },
];

export const JOIN_STEPS = [
  { step: '01', title: 'Create your membership', body: 'Name, phone, done. You get a digital ID card straight away.' },
  { step: '02', title: 'Book your first session', body: 'Pick anything on the calendar. A kirtan night is the easiest start.' },
  { step: '03', title: 'Find your people', body: 'Join a sadhana group and a seva team. That is where it sticks.' },
];

export const JOIN_PERKS = ['Events', 'Seva', 'Sadhana', 'Accommodation', 'Community'];
