import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import BottomNav from './components/BottomNav';

// A simple component that redirects to the static partner.html
function PartnerRedirect() {
  useEffect(() => { window.location.href = '/partner.html'; }, []);
  return <div style={{ color: 'var(--text-2)', padding: '40px 20px', textAlign: 'center' }}>Redirecting to Partner Portal...</div>;
}

// Pages
import Onboarding  from './pages/Onboarding';
import Login       from './pages/Login';
import Register    from './pages/Register';
import Home        from './pages/Home';
import Scan        from './pages/Scan';
import Wallet      from './pages/Wallet';
import Rewards     from './pages/Rewards';
import Profile     from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Impact      from './pages/Impact';
import Forums      from './pages/Forums';
import Learn       from './pages/Learn';

// Where to send first-time visitors
function getFirstDest(isAuthenticated) {
  if (isAuthenticated) return '/';
  const seen = localStorage.getItem('ecodrop_onboarding_done');
  return seen ? '/login' : '/onboarding';
}

function ProtectedRoute({ children }) {
  const { state } = useApp();
  // Still checking auth session — show nothing
  if (state.loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading...</p>
        </div>
      </div>
    );
  }
  if (!state.isAuthenticated) {
    const seen = localStorage.getItem('ecodrop_onboarding_done');
    return <Navigate to={seen ? '/login' : '/onboarding'} replace />;
  }
  return children;
}

function AppRoutes() {
  const { state } = useApp();

  return (
    <div className="app">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--bg-2)', color: 'var(--text)',
            border: '1px solid var(--border-2)', borderRadius: 12, fontSize: 14,
          },
          duration: 3000,
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login"    element={state.isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={state.isAuthenticated ? <Navigate to="/" /> : <Register />} />

        {/* Scan gets a fullscreen shell — no bottom nav, no extra scroll wrapper */}
        <Route path="/scan" element={
          <ProtectedRoute>
            <ScanShell><Scan /></ScanShell>
          </ProtectedRoute>
        } />

        {/* All other protected pages — standard shell with bottom nav */}
        <Route path="/"            element={<ProtectedRoute><AppShell><Home /></AppShell></ProtectedRoute>} />
        <Route path="/wallet"      element={<ProtectedRoute><AppShell><Wallet /></AppShell></ProtectedRoute>} />
        <Route path="/rewards"     element={<ProtectedRoute><AppShell><Rewards /></AppShell></ProtectedRoute>} />
        <Route path="/profile"     element={<ProtectedRoute><AppShell><Profile /></AppShell></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><AppShell><Leaderboard /></AppShell></ProtectedRoute>} />
        <Route path="/impact"      element={<ProtectedRoute><AppShell><Impact /></AppShell></ProtectedRoute>} />
        <Route path="/forums"      element={<ProtectedRoute><AppShell><Forums /></AppShell></ProtectedRoute>} />
        <Route path="/learn"       element={<ProtectedRoute><AppShell><Learn /></AppShell></ProtectedRoute>} />
        <Route path="/partner"     element={<PartnerRedirect />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={getFirstDest(state.isAuthenticated)} />} />
      </Routes>
    </div>
  );
}

// Standard shell: scrollable main + sticky bottom nav
function AppShell({ children }) {
  return (
    <>
      <main className="page">{children}</main>
      <BottomNav />
    </>
  );
}

// Scan shell: true fullscreen, NO bottom nav
function ScanShell({ children }) {
  return (
    <div style={{
      minHeight: '100vh', width: '100%', maxWidth: 430, margin: '0 auto',
      display: 'flex', flexDirection: 'column', background: 'var(--bg)',
      overflowY: 'auto', position: 'relative',
    }}>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
