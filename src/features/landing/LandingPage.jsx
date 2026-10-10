import { useScrollReveal } from './hooks/useLandingMotion';
import { useUpcomingEvents } from './hooks/useUpcomingEvents';
import Hero from './components/Hero';
import PosterHero from './components/PosterHero';
import PillarsSection from './components/PillarsSection';
import EventsSection from './components/EventsSection';
import VoicesSection from './components/VoicesSection';
import JoinCta from './components/JoinCta';

/** Home: the short tour. Each topic has its own page, reachable from the header. */
const LandingPage = ({ onLoginClick }) => {
  const { events, loading } = useUpcomingEvents();
  const ref = useScrollReveal([loading, events.length]);

  return (
    <div ref={ref}>
      <Hero onLoginClick={onLoginClick} />
      <PosterHero onLoginClick={onLoginClick} />
      <PillarsSection onLoginClick={onLoginClick} />
      <EventsSection events={events} loading={loading} onLoginClick={onLoginClick} />
      <VoicesSection />
      <JoinCta onLoginClick={onLoginClick} />
    </div>
  );
};

export default LandingPage;
