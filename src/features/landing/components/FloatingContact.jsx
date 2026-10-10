import { MessageCircle } from 'lucide-react';
import SiteLink from '../../../components/site/SiteLink';

const FloatingContact = () => (
  <SiteLink
    href="/contact"
    aria-label="Contact FOLK Vizag"
    className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-saffron text-white shadow-premium-2xl ring-4 ring-saffron/20 transition-all hover:scale-105 hover:bg-saffron-dark active:scale-95 sm:bottom-7 sm:right-7"
  >
    <MessageCircle size={24} aria-hidden="true" />
  </SiteLink>
);

export default FloatingContact;
