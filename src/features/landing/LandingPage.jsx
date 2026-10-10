import { useMemo } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import { SiteHeader, SiteFooter } from '../../components/site/SiteChrome';
import { useScrollReveal } from './hooks/useLandingMotion';
import { sortEventsByDate } from './lib/events';
import Hero from './components/Hero';
import PosterHero from './components/PosterHero';
import AboutSection from './components/AboutSection';
import PillarsSection from './components/PillarsSection';
import ProgramsSection from './components/ProgramsSection';
import EventsSection from './components/EventsSection';
import AppSection from './components/AppSection';
import StaySection from './components/StaySection';
import GallerySection from './components/GallerySection';
import VoicesSection from './components/VoicesSection';
import JoinCta from './components/JoinCta';
import ContactSection from './components/ContactSection';
import FloatingContact from './components/FloatingContact';

/** Container: owns the events feed and the login handler, composes the sections. */
const LandingPage = ({ onLoginClick }) => {
  const { data: events, loading } = useFirestore('events');
  const sortedEvents = useMemo(() => sortEventsByDate(events), [events]);
  const ref = useScrollReveal([loading, sortedEvents.length]);

  return (
    <div ref={ref} className="min-h-screen overflow-x-clip bg-paper font-sans text-ink">
      <SiteHeader onLoginClick={onLoginClick} />
      <main>
        <Hero onLoginClick={onLoginClick} />
        <PosterHero onLoginClick={onLoginClick} />
        <AboutSection onLoginClick={onLoginClick} />
        <PillarsSection onLoginClick={onLoginClick} />
        <ProgramsSection />
        <EventsSection events={sortedEvents} loading={loading} onLoginClick={onLoginClick} />
        <AppSection onLoginClick={onLoginClick} />
        <StaySection onLoginClick={onLoginClick} />
        <GallerySection />
        <VoicesSection />
        <JoinCta onLoginClick={onLoginClick} />
        <ContactSection onLoginClick={onLoginClick} />
      </main>
      <SiteFooter />
      <FloatingContact />
    </div>
  );
};

export default LandingPage;
