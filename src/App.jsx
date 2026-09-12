import React, { useState, useEffect, useCallback } from 'react'
import MainLayout from './components/layout/MainLayout'
import AdminDashboard from './pages/AdminDashboard'
import AdminSetup from './pages/AdminSetup'
import Events from './pages/Events'
import SadhanaTracker from './pages/SadhanaTracker'
import Accommodation from './pages/Accommodation'
import Hostels from './pages/Hostels'
import Attendance from './pages/Attendance'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Devotees from './pages/Devotees'
import SevaDashboard from './pages/SevaDashboard'
import Profile from './pages/Profile'
import About from './pages/About'
import Trips from './pages/Trips'
import Gallery from './pages/Gallery'
import Calendar from './pages/Calendar'
import Contact from './pages/Contact'
import Donate from './pages/Donate'
import { useAuth } from './hooks/useAuth'
import UserRoleGuard from './components/auth/UserRoleGuard'
import ScanningOverlay from './components/qr/ScanningOverlay'
import InstallPrompt from './components/layout/InstallPrompt'

// Map every app "tab" to a real URL path. This is what makes links like
// /admin, /events, /hostels actually open their pages instead of reloading
// the home screen.
const TAB_TO_PATH = {
  admin: '/admin',
  'admin-setup': '/createadmin',
  devotees: '/devotees',
  events: '/events',
  dashboard: '/',
  accommodation: '/accommodation',
  hostels: '/hostels',
  attendance: '/attendance',
  seva: '/seva',
  profile: '/profile',
  about: '/about',
  trips: '/trips',
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

const pathToTab = (path) => PATH_TO_TAB[path] || PATH_TO_TAB[path + '/'] || 'dashboard';

const tabToPath = (tab) => TAB_TO_PATH[tab] || '/';

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

  // Navigation: set tab + keep the URL in sync (pushState so Back works).
  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    const path = tabToPath(tab);
    if (getPathname() !== path) {
      window.history.pushState(null, '', path);
    }
  }, []);

  // Handle browser Back/Forward and manual URL edits.
  useEffect(() => {
    const onPopState = () => setActiveTabState(pathToTab(getPathname()));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // After auth state settles, land staff on the Command Center. If the user
  // manually came in via a URL like /hostels, keep that tab instead of
  // overriding it back to the dashboard.
  useEffect(() => {
    if (user) {
      const staffOnlyTabs = ['admin', 'admin-setup', 'devotees', 'attendance'];
      const fromUrl = pathToTab(getPathname());
      const isStaff = user.role === 'folks_head' || user.role === 'admin';
      if (isStaff) {
        setActiveTab(fromUrl === 'dashboard' ? 'admin' : fromUrl)
      } else {
        setActiveTab(staffOnlyTabs.includes(fromUrl) ? 'dashboard' : fromUrl)
      }
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
    if (showLanding && pathToTab(getPathname()) === 'dashboard') {
      return (
        <>
          <InstallPrompt />
          <Landing onLoginClick={() => setShowLanding(false)} />
        </>
      )
    }
    return (
      <>
        <InstallPrompt />
        <Login />
      </>
    )
  }

  if (user.requiresRole) {
    return <Login />
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'admin-setup':
        return <AdminSetup setActiveTab={setActiveTab} />
      case 'devotees': 
        return <UserRoleGuard allowedRoles={['admin', 'folks_head']}><Devotees /></UserRoleGuard>
      case 'events': 
        return <Events />
      case 'dashboard': 
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
        return <Trips />
      case 'gallery':
        return <Gallery />
      case 'calendar':
        return <Calendar />
      case 'contact':
        return <Contact />
      case 'donate':
        return <Donate />
      case 'admin':
        return (
          <UserRoleGuard allowedRoles={['admin', 'folks_head']}>
            <AdminDashboard 
              setActiveTab={setActiveTab} 
              onOpenScanner={(mode) => setGlobalScanner({ isOpen: true, mode })}
            />
          </UserRoleGuard>
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
      <InstallPrompt />
      {renderContent()}
      <ScanningOverlay 
        isOpen={globalScanner.isOpen}
        onClose={() => setGlobalScanner({ ...globalScanner, isOpen: false })}
        initialMode={globalScanner.mode}
      />
    </MainLayout>
  )
}

export default App
