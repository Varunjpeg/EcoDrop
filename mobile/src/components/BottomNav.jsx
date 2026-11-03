import { NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    to: '/wallet',
    label: 'Wallet',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
  {
    to: '/scan',
    label: 'Scan',
    icon: () => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    ),
    isCTA: true,
  },
  {
    to: '/rewards',
    label: 'Rewards',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12"/>
        <rect x="2" y="7" width="20" height="5"/>
        <line x1="12" y1="22" x2="12" y2="7"/>
        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
        <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, zIndex: 50,
      background: 'var(--bottom-nav-bg)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid var(--border)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        height: 68, padding: '0 4px',
      }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);

          if (item.isCTA) {
            return (
              <NavLink key={item.to} to={item.to} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 54, height: 54, borderRadius: '50%',
                  background: isActive
                    ? 'linear-gradient(135deg,#0D4F2E,#157A46)'
                    : 'linear-gradient(135deg,#0D4F2E,#1a9655)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: -24,
                  boxShadow: isActive
                    ? '0 0 0 4px var(--bg), 0 4px 20px rgba(13,79,46,0.7), 0 0 16px var(--accent-glow)'
                    : '0 0 0 4px var(--bg), 0 4px 16px rgba(13,79,46,0.5)',
                  color: 'var(--accent)',
                  transition: 'all 0.2s',
                }}>
                  {item.icon(isActive)}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, marginTop: 5,
                  color: isActive ? 'var(--accent)' : 'var(--text-3)',
                  transition: 'color 0.2s',
                }}>
                  {item.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, flex: 1, paddingTop: 10,
                color: isActive ? 'var(--accent)' : 'var(--text-3)',
                transition: 'color 0.2s',
                position: 'relative',
              }}
            >
              {/* Active dot indicator */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: 6, width: 4, height: 4, borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 6px var(--accent)',
                }} />
              )}
              <div style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }}>
                {item.icon(isActive)}
              </div>
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
