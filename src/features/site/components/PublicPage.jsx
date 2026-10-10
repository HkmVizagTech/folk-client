import { useScrollReveal } from '../../landing/hooks/useLandingMotion';
import PageBanner from './PageBanner';

/** Inner public page: banner, scroll-reveal scope and the sections. */
const PublicPage = ({ banner, revealDeps = [], children }) => {
  const ref = useScrollReveal(revealDeps);
  return (
    <div ref={ref}>
      {banner && <PageBanner {...banner} />}
      {children}
    </div>
  );
};

export default PublicPage;
