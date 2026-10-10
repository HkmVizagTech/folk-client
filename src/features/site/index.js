import { lazy } from 'react';

// Public website routes: path -> page. Home lives in features/landing.
export const PUBLIC_PAGES = {
  '/about': lazy(() => import('./pages/AboutPage')),
  '/programs': lazy(() => import('./pages/ProgramsPage')),
  '/events': lazy(() => import('./pages/EventsPage')),
  '/residency': lazy(() => import('./pages/ResidencyPage')),
  '/gallery': lazy(() => import('./pages/GalleryPage')),
  '/contact': lazy(() => import('./pages/ContactPage')),
};

export { default as PublicLayout } from './components/PublicLayout';
