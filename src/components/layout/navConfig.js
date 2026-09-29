import {
  Home, Flame, CalendarDays, HandHeart, Compass, Building2, BedDouble, Gift, UserRound,
  ShieldCheck, Users, QrCode, Map, Info, Images, CalendarRange, Phone, HeartHandshake, GraduationCap, BarChart3,
} from 'lucide-react';

export const ALL = ['admin', 'folks_head', 'devotee'];
export const STAFF = ['admin', 'folks_head'];

// One source of truth for app navigation: the desktop sidebar, the mobile
// tab bar and its "More" sheet all read from here.
export const NAV_GROUPS = [
  {
    title: 'My FOLK',
    items: [
      { id: 'dashboard', label: 'Home', icon: Home, roles: ALL },
      { id: 'sadhana', label: 'Sadhana', icon: Flame, roles: ALL },
      { id: 'events', label: 'Events', icon: CalendarDays, roles: ALL },
      { id: 'seva', label: 'Seva', icon: HandHeart, roles: ALL },
      { id: 'courses', label: 'Courses', icon: GraduationCap, roles: ALL },
      { id: 'trips', label: 'Yatras', icon: Compass, roles: ALL },
      { id: 'hostels', label: 'Residency', icon: Building2, roles: ALL },
      { id: 'accommodation', label: 'Stay requests', icon: BedDouble, roles: ALL },
      { id: 'donate', label: 'Donate', icon: Gift, roles: ALL },
      { id: 'profile', label: 'My profile', icon: UserRound, roles: ALL },
    ],
  },
  {
    title: 'Team',
    items: [
      { id: 'my-members', label: 'My members', icon: HeartHandshake, roles: STAFF },
      { id: 'admin', label: 'Command center', icon: ShieldCheck, roles: STAFF },
      { id: 'devotees', label: 'Members', icon: Users, roles: STAFF },
      { id: 'attendance', label: 'Check-in', icon: QrCode, roles: STAFF },
      { id: 'reports', label: 'Reports & broadcasts', icon: BarChart3, roles: STAFF },
      { id: 'trips-admin', label: 'Manage yatras', icon: Map, roles: STAFF },
    ],
  },
  {
    title: 'About',
    items: [
      { id: 'about', label: 'About FOLK', icon: Info, roles: ALL },
      { id: 'calendar', label: 'Festival calendar', icon: CalendarRange, roles: ALL },
      { id: 'gallery', label: 'Gallery', icon: Images, roles: ALL },
      { id: 'contact', label: 'Contact', icon: Phone, roles: ALL },
    ],
  },
];

// The four tabs always visible at the bottom on phones (the fifth is "More").
export const MOBILE_PRIMARY = {
  devotee: ['dashboard', 'sadhana', 'events', 'trips'],
  staff: ['dashboard', 'my-members', 'attendance', 'events'],
};

export const visibleGroups = (role) =>
  NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role || 'devotee')) }))
    .filter((g) => g.items.length > 0);

export const findNavItem = (id) => {
  for (const g of NAV_GROUPS) {
    const hit = g.items.find((i) => i.id === id);
    if (hit) return hit;
  }
  return null;
};

export const roleLabel = (role) =>
  role === 'admin' ? 'Admin' : role === 'folks_head' ? 'FOLK guide' : 'Member';
