import AboutSection from '../../landing/components/AboutSection';
import PillarsSection from '../../landing/components/PillarsSection';
import VoicesSection from '../../landing/components/VoicesSection';
import JoinCta from '../../landing/components/JoinCta';
import PublicPage from '../components/PublicPage';

const banner = {
  kicker: 'Who we are',
  title: 'About us',
  description: 'The youth club of the Hare Krishna Movement, Visakhapatnam: students and young professionals practising together.',
};

const AboutPage = ({ onLoginClick }) => (
  <PublicPage banner={banner}>
    <AboutSection onLoginClick={onLoginClick} />
    <PillarsSection onLoginClick={onLoginClick} />
    <VoicesSection />
    <JoinCta onLoginClick={onLoginClick} />
  </PublicPage>
);

export default AboutPage;
