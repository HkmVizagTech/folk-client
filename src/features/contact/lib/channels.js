import { MessageCircle, Phone, Mail, MapPin, Instagram } from 'lucide-react';
import { SITE, whatsappLink } from '../../../content/site';

/** Contact channels that are actually configured; unset ones are skipped. */
export const getChannels = () => {
  const { phone, email, address, mapsUrl } = SITE.contact;
  const wa = whatsappLink();
  return [
    wa && { id: 'whatsapp', icon: MessageCircle, tone: 'bg-green-50 text-green-700', label: 'WhatsApp', value: phone, href: wa, external: true },
    phone && { id: 'call', icon: Phone, tone: 'bg-navy-50 text-navy-700', label: 'Call', value: phone, href: `tel:${phone.replace(/\s/g, '')}` },
    email && { id: 'email', icon: Mail, tone: 'bg-marigold/15 text-marigold-dark', label: 'Email', value: email, href: `mailto:${email}`, wrap: true },
    address && { id: 'visit', icon: MapPin, tone: 'bg-saffron-50 text-saffron-dark', label: 'Visit', value: address, href: mapsUrl || null, external: true, wrap: true },
    SITE.social.instagram && { id: 'instagram', icon: Instagram, tone: 'bg-paper-dark text-ink', label: 'Instagram', value: '@folkvizag', href: SITE.social.instagram, external: true },
  ].filter(Boolean);
};
