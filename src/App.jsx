import React, { Suspense, lazy, useState, useEffect, useCallback, useRef } from 'react'
import MainLayout from './components/layout/MainLayout'
const AdminDashboard = lazy(() => import('./features/admin-dashboard'))
const AdminSetup = lazy(() => import('./features/auth').then((m) => ({ default: m.AdminSetup })))
const AdminLogin = lazy(() => import('./features/auth').then((m) => ({ default: m.AdminLogin })))
const AdminAccessDenied = lazy(() => import('./features/auth').then((m) => ({ default: m.AdminAccessDenied })))
const Events = lazy(() => import('./features/events'))
const SadhanaTracker = lazy(() => import('./features/sadhana'))
const MemberHome = lazy(() => import('./features/home'))
const MyMembers = lazy(() => import('./features/my-members'))
const Courses = lazy(() => import('./features/courses'))
const Reports = lazy(() => import('./features/reports'))
const Accommodation = lazy(() => import('./features/accommodation'))
const Hostels = lazy(() => import('./features/hostels'))
const Attendance = lazy(() => import('./features/attendance'))
import Login from './features/auth'
const Landing = lazy(() => import('./features/landing'))
const Devotees = lazy(() => import('./features/devotees'))
const SevaDashboard = lazy(() => import('./features/seva'))
const Profile = lazy(() => import('./features/profile'))
const About = lazy(() => import('./features/about'))
const Trips = lazy(() => import('./features/trips'))
const TripDetail = lazy(() => import('./features/trip-detail'))
const TripsAdmin = lazy(() => import('./features/trips-admin'))
const Gallery = lazy(() => import('./features/gallery'))
const Calendar = lazy(() => import('./features/calendar'))
const Contact = lazy(() => import('./features/contact'))
const Donate = lazy(() => import('./features/donate'))
import { useAuth } from './hooks/useAuth'
import UserRoleGuard from './components/auth/UserRoleGuard'
import ScanningOverlay from './components/qr/ScanningOverlay'

// Map every app "tab" to a real URL path. This is what makes links like
// /admin, /events, /hostels actually open their pages instead of reloading
// the home screen.
const TAB_TO_PATH = {
  admin: '/admin',
  'admin-setup': '/createadmin',
  devotees: '/devotees',
  'my-members': '/my-members',
  courses: '/courses',
  reports: '/reports',
  events: '/events',
  dashboard: '/',
  sadhana: '/sadhana',
  accommodation: '/accommodation',
  hostels: '/hostels',
  attendance: '/attendance',
  seva: '/seva',
  profile: '/profile',
  about: '/about',
  trips: '/trips',
  'trips-admin': '/trips/manage',
  gallery: '/gallery',
  calendar: '/calendar',
  contact: '/contact',
  donate: '/donate',
};

// Longer paths first so /admin-setup isn't matched by /admin.
const PATH_TO_TAB = Object.fromEntries(
  Object.entries(TAB_TO_PATH)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([tab, path]) => [path, tab])
);

const getPathname = () => window.location.pathname || '/';

// Every other route is an exact match, but each trip gets its own landing page
// at /trip/<slug> (e.g. /trip/vrindavan2026), so that one prefix is matched
// dynamically and the slug travels alongside the tab.
const TRIP_DETAIL_PREFIX = '/trip/';

const tripSlugFromPath = (path) => {
  if (!path.startsWith(TRIP_DETAIL_PREFIX)) return null;
  const slug = path.slice(TRIP_DETAIL_PREFIX.length).replace(/\/+$/, '');
  return slug ? decodeURIComponent(slug) : null;
};

const pathToTab = (path) =>
  (tripSlugFromPath(path) ? 'trip-detail' : null) ||
  PATH_TO_TAB[path] ||
  PATH_TO_TAB[path + '/'] ||
  'dashboard';

const tabToPath = (tab) => TAB_TO_PATH[tab] || '/';

const Fallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-saffron border-t-transparent rounded-full animate-spin" />
  </div>
)

function App() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTabState] = useState(() => pathToTab(getPathname()))
  const [showLanding, setShowLanding] = useState(() => {
    try {
      return !localStorage.getItem('fast_load_cache');
    } catch (e) {
      return true;
    }
  });
  const [globalScanner, setGlobalScanner] = useState({ isOpen: false, mode: 'attendance' });
  // Which trip's landing page is open, when activeTab === 'trip-detail'.
  const [tripSlug, setTripSlug] = useState(() => tripSlugFromPath(getPathname()));
  // Set when a public page (trips list / trip detail) asks for sign-in. While
  // true, the Login view replaces the public page; after a successful login
  // the user lands straight back on the same trip, now able to register.
  const [forceLogin, setForceLogin] = useState(false);

  // Navigation: set tab + keep the URL in sync (pushState so Back works).
  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    if (tab !== 'trip-detail') setTripSlug(null);
    const path = tabToPath(tab);
    if (getPathname() !== path) {
      window.history.pushState(null, '', path);
    }
  }, []);

  // Open one trip's landing page at /trip/<slug>.
  const openTrip = useCallback((slug) => {
    if (!slug) return;
    setTripSlug(slug);
    setActiveTabState('trip-detail');
    const path = `${TRIP_DETAIL_PREFIX}${encodeURIComponent(slug)}`;
    if (getPathname() !== path) {
      window.history.pushState(null, '', path);
    }
  }, []);

  // The sign-in request has been served once someone is signed in; clear it
  // so signing out later on a trip page shows the trip again, not the login.
  useEffect(() => {
    if (user) setForceLogin(false);
  }, [user]);

  // Handle browser Back/Forward and manual URL edits.
  useEffect(() => {
    const onPopState = () => {
      const path = getPathname();
      setForceLogin(false);
      setTripSlug(tripSlugFromPath(path));
      setActiveTabState(pathToTab(path));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Only intervene on the root path: land staff on the Command Center. Any
  // deep link (/admin, /createadmin, /hostels, ...) always wins so it never
  // bounces back to the home page. Non-admin users reaching an admin URL are
  // handled inside the pages themselves (AdminSetup explains access).
  //
  // This is a once-per-sign-in landing decision, not a rule. `user` is a new
  // object whenever the profile changes (a sadhana log bumps streak/score, an
  // admin changes a role), and re-running it then yanked a staff member off
  // the Home tab back to the Command Center mid-session.
  const landedForUid = useRef(null);
  useEffect(() => {
    if (!user) { landedForUid.current = null; return; }
    // Keyed on the role too, so an actual promotion/demotion still re-lands.
    const key = `${user.uid}:${user.role || ''}`;
    if (landedForUid.current === key) return;
    landedForUid.current = key;
    const fromUrl = pathToTab(getPathname());
    const isStaff = user.role === 'folks_head' || user.role === 'admin';
    if (fromUrl === 'dashboard') {
      setActiveTab(isStaff ? 'admin' : 'dashboard')
    }
  }, [user, setActiveTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-saffron border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    // The admin portal has its own dedicated sign-in screen. Administrators
    // always enter through /admin — never through the member login below.
    if (getPathname() === '/admin') {
      return <AdminLogin />
    }
    const tabFromUrl = pathToTab(getPathname());
    // Landing page only for the root path when there's no cached session.
    if (!forceLogin && showLanding && tabFromUrl === 'dashboard') {
      return (
        <>
          <Landing onLoginClick={() => setShowLanding(false)} />
        </>
      )
    }
    // Trip pages are public on purpose: a /trip/<slug> link is meant to be
    // shared on WhatsApp, so it must open for someone with no account. The
    // Firestore rules allow reading `trips` publicly; registering still
    // requires signing in, so every "Sign in" button on these pages swaps to
    // the Login view (forceLogin). The URL is left untouched on purpose: once
    // authenticated, the same /trip/<slug> re-renders inside the app shell
    // with the registration form unlocked — no redirect needed.
    if (!forceLogin && (tabFromUrl === 'trips' || tabFromUrl === 'trip-detail')) {
      return (
        <>
          {tabFromUrl === 'trip-detail'
            ? <TripDetail slug={tripSlug} openTrip={openTrip} setActiveTab={setActiveTab} onLoginClick={() => setForceLogin(true)} isPublicView />
            : <Trips openTrip={openTrip} setActiveTab={setActiveTab} onLoginClick={() => setForceLogin(true)} isPublicView />}
        </>
      )
    }
    // Every other path (including /admin and /createadmin) shows the login
    // form with username + password. Admin routes are protected, just like
    // the firewall rules: you must sign in before you can manage anything.
    return <Login />
  }

  if (user.requiresRole) {
    // Keep the admin portal self-contained even mid-profile-setup.
    return getPathname() === '/admin' ? <AdminLogin /> : <Login />
  }

  const renderContent = () => {
    const isStaff = user && (user.role === 'folks_head' || user.role === 'admin');
    switch(activeTab) {
      case 'admin-setup':
        return <AdminSetup setActiveTab={setActiveTab} />
      case 'my-members':
        return <UserRoleGuard allowedRoles={['admin', 'folks_head']}><MyMembers /></UserRoleGuard>
      case 'courses':
        return <Courses />
      case 'reports':
        return <UserRoleGuard allowedRoles={['admin', 'folks_head']}><Reports /></UserRoleGuard>
      case 'devotees': 
        return <UserRoleGuard allowedRoles={['admin', 'folks_head']}><Devotees /></UserRoleGuard>
      case 'events': 
        return <Events />
      case 'dashboard': 
        return <MemberHome setActiveTab={setActiveTab} />
      case 'sadhana':
        return <SadhanaTracker />
      case 'accommodation':
        return <Accommodation />
      case 'hostels':
        return <Hostels />
      case 'attendance': 
        return (
          <UserRoleGuard allowedRoles={['admin', 'folks_head']}>
            <Attendance 
              onOpenScanner={(mode) => setGlobalScanner({ isOpen: true, mode })} 
            />
          </UserRoleGuard>
        )
      case 'seva':
        return <SevaDashboard />
      case 'profile':
        return <Profile />
      case 'about':
        return <About />
      case 'trips':
        return <Trips openTrip={openTrip} setActiveTab={setActiveTab} />
      case 'trip-detail':
        return <TripDetail slug={tripSlug} setActiveTab={setActiveTab} openTrip={openTrip} />
      case 'trips-admin':
        return (
          <UserRoleGuard allowedRoles={['admin', 'folks_head']}>
            <TripsAdmin setActiveTab={setActiveTab} openTrip={openTrip} />
          </UserRoleGuard>
        )
      case 'gallery':
        return <Gallery />
      case 'calendar':
        return <Calendar />
      case 'contact':
        return <Contact />
      case 'donate':
        return <Donate />
      case 'admin':
        // The dedicated admin portal: staff get the Command Center, a signed-in
        // member gets a clear access notice (with the one-time first-admin
        // bootstrap for a fresh site). No dead-end redirects.
        return isStaff ? (
          <AdminDashboard 
            setActiveTab={setActiveTab} 
            onOpenScanner={(mode) => setGlobalScanner({ isOpen: true, mode })}
          />
        ) : (
          <AdminAccessDenied />
        )
      default: 
        return (
          <UserRoleGuard allowedRoles={['admin', 'folks_head']}>
            <AdminDashboard 
              setActiveTab={setActiveTab} 
              onOpenScanner={(mode) => setGlobalScanner({ isOpen: true, mode })}
            />
          </UserRoleGuard>
        )
    }
  }

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Suspense fallback={<Fallback />}>{renderContent()}</Suspense>
      <ScanningOverlay 
        isOpen={globalScanner.isOpen}
        onClose={() => setGlobalScanner({ ...globalScanner, isOpen: false })}
        initialMode={globalScanner.mode}
      />
    </MainLayout>
  )
}

const AppWithSuspense = () => (
  <Suspense fallback={<Fallback />}>
    <App />
  </Suspense>
)

export default AppWithSuspense
