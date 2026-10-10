import ContactSection from '../../landing/components/ContactSection';
import PublicPage from '../components/PublicPage';

const banner = {
  kicker: 'Get in touch',
  title: 'Contact us',
  description: 'Talk to a coordinator, ask about your first session or find us on the map.',
};

const ContactPage = ({ onLoginClick }) => (
  <PublicPage banner={banner}>
    <ContactSection onLoginClick={onLoginClick} />
  </PublicPage>
);

export default ContactPage;
