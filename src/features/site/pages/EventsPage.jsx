import { useUpcomingEvents } from '../../landing/hooks/useUpcomingEvents';
import EventsSection from '../../landing/components/EventsSection';
import JoinCta from '../../landing/components/JoinCta';
import PublicPage from '../components/PublicPage';

const banner = {
  kicker: 'Events',
  title: 'What is coming up',
  description: 'Kirtan nights, festivals, workshops and yatras. Members book straight from the app.',
};

const EventsPage = ({ onLoginClick }) => {
  const { events, loading } = useUpcomingEvents();
  return (
    <PublicPage banner={banner} revealDeps={[loading, events.length]}>
      <EventsSection events={events} loading={loading} onLoginClick={onLoginClick} limit={60} />
      <JoinCta onLoginClick={onLoginClick} />
    </PublicPage>
  );
};

export default EventsPage;
