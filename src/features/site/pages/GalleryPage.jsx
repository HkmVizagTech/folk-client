import GallerySection from '../../landing/components/GallerySection';
import PublicPage from '../components/PublicPage';

const banner = {
  kicker: 'Gallery',
  title: 'Moments together',
  description: 'Festivals, youth sessions, seva shifts and the long road trips in between.',
};

const GalleryPage = () => (
  <PublicPage banner={banner}>
    <GallerySection standalone />
  </PublicPage>
);

export default GalleryPage;
