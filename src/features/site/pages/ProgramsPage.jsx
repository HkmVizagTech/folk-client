import ProgramsSection from '../../landing/components/ProgramsSection';
import AppSection from '../../landing/components/AppSection';
import JoinCta from '../../landing/components/JoinCta';
import PublicPage from '../components/PublicPage';

const banner = {
  kicker: 'Programs & activities',
  title: 'Programs',
  description: 'Six tracks, one calendar. Start with a session or a festival and move freely between them.',
};

const ProgramsPage = ({ onLoginClick }) => (
  <PublicPage banner={banner}>
    <ProgramsSection />
    <AppSection onLoginClick={onLoginClick} />
    <JoinCta onLoginClick={onLoginClick} />
  </PublicPage>
);

export default ProgramsPage;
