import React, { useState, useEffect } from 'react'
import MainLayout from './components/layout/MainLayout'
import AdminDashboard from './pages/AdminDashboard'
import Events from './pages/Events'
import SadhanaTracker from './pages/SadhanaTracker'
import Accommodation from './pages/Accommodation'
import Attendance from './pages/Attendance'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Devotees from './pages/Devotees'
import SevaDashboard from './pages/SevaDashboard'
import Profile from './pages/Profile'
import { useAuth } from './hooks/useAuth'
import UserRoleGuard from './components/auth/UserRoleGuard'
import ScanningOverlay from './components/qr/ScanningOverlay'
import InstallPrompt from './components/layout/InstallPrompt'

function App() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showLanding, setShowLanding] = useState(() => {
    try {
      return !localStorage.getItem('fast_load_cache');
    } catch (e) {
      return true;
    }
  });
  const [globalScanner, setGlobalScanner] = useState({ isOpen: false, mode: 'attendance' });


  useEffect(() => {
    if (user) {
      if (user.role === 'folks_head' || user.role === 'admin') {
        setActiveTab('admin')
      } else {
        setActiveTab('dashboard')
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-saffron border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    if (showLanding) {
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
      case 'devotees': 
        return <UserRoleGuard allowedRoles={['admin', 'folks_head']}><Devotees /></UserRoleGuard>
      case 'events': 
        return <Events />
      case 'dashboard': 
        return <SadhanaTracker />
      case 'accommodation': 
        return <Accommodation />
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
