import { useEffect } from 'react';
import { SiteHeader, SiteFooter } from '../../../components/site/SiteChrome';
import FloatingContact from '../../landing/components/FloatingContact';

/** Public website chrome: header, footer and the quick-contact button around one page. */
const PublicLayout = ({ path, onLoginClick, children }) => {
  useEffect(() => { window.scrollTo({ top: 0 }); }, [path]);
  return (
    <div className="min-h-screen overflow-x-clip bg-paper font-sans text-ink">
      <SiteHeader onLoginClick={onLoginClick} active={path} />
      <main>{children}</main>
      <SiteFooter />
      {path !== '/contact' && <FloatingContact />}
    </div>
  );
};

export default PublicLayout;
