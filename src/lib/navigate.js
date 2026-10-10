/** Client-side navigation for plain links: pushState, then let App's popstate handler re-route. */
export const navigate = (path) => {
  if (window.location.pathname + window.location.search === path) return;
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};
