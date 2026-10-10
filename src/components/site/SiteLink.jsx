import { navigate } from '../../lib/navigate';

const isInternal = (href) => href.startsWith('/') && !href.startsWith('//');

/** <a> that navigates in-app for same-site paths and falls back to a normal link otherwise. */
const SiteLink = ({ href, onClick, children, ...props }) => {
  const handle = (e) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!isInternal(href) || props.target === '_blank') return;
    e.preventDefault();
    navigate(href);
  };
  return <a href={href} onClick={handle} {...props}>{children}</a>;
};

export default SiteLink;
