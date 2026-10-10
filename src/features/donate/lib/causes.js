import { HeartHandshake, UtensilsCrossed, BookOpen, PartyPopper } from 'lucide-react';

export const CAUSES = [
  { id: 'general', icon: HeartHandshake, title: 'General Donation', desc: 'Support the ongoing programs and maintenance of the temple and community.', tone: 'from-saffron to-marigold', preset: 1101 },
  { id: 'sundaylovefeast', icon: UtensilsCrossed, title: 'Sunday Love Feast', desc: 'Sponsor the free Sunday feast that feeds every visitor prasadam.', tone: 'from-navy-600 to-navy-800', preset: 501 },
  { id: 'gitadaan', icon: BookOpen, title: 'Gita Daan', desc: 'Gift an authentic Bhagavad-gita to a devotee, student or family.', tone: 'from-marigold-dark to-saffron-dark', preset: 301 },
  { id: 'festival', icon: PartyPopper, title: 'Festival Donation', desc: 'Help fund Janmastami, Ratha Yatra and the other great festivals.', tone: 'from-navy-400 to-saffron', preset: 1101 },
];

export const presetsFor = (causeId) => (causeId === 'gitadaan' ? [301, 501, 1101, 5101] : [501, 1101, 2101, 5101]);

export const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
