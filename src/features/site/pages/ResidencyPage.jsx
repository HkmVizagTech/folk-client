import StaySection from '../../landing/components/StaySection';
import JoinCta from '../../landing/components/JoinCta';
import PublicPage from '../components/PublicPage';

const banner = {
  kicker: 'Accommodation',
  title: 'Residency',
  description: 'Visiting for a festival, a camp or a weekend of seva? Request a temple stay in a couple of taps.',
};

const ResidencyPage = ({ onLoginClick }) => (
  <PublicPage banner={banner}>
    <StaySection onLoginClick={onLoginClick} />
    <JoinCta onLoginClick={onLoginClick} />
  </PublicPage>
);

export default ResidencyPage;
