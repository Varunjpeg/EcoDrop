import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ACHIEVEMENTS } from '../data/mockData';
import toast from 'react-hot-toast';

function getRank(coins) {
  if (coins >= 10000) return { label: 'Eco Champion', color: 'var(--accent)',  icon: '🌟' };
  if (coins >= 5000)  return { label: 'Platinum',     color: '#B0C4DE',        icon: '💎' };
  if (coins >= 2000)  return { label: 'Gold',         color: 'var(--gold)',    icon: '🥇' };
  if (coins >= 500)   return { label: 'Silver',       color: '#A8A9AD',        icon: '🥈' };
  return                     { label: 'Bronze',       color: '#CD7F32',        icon: '🥉' };
}

function Toggle({ on, onToggle }) {
  return (
    <div className={`toggle ${on ? 'on' : ''}`} onClick={onToggle}>
      <div className="toggle-knob" />
    </div>
  );
}

function SettingsRow({ icon, label, trailing }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: 'var(--surface-2)',
          border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 17, flexShrink: 0,
        }}>{icon}</div>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
      </div>
      {trailing}
    </div>
  );
}

export default function Profile() {
  const { state, logout } = useApp();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const { user, notifications } = state;
  const [notifOn, setNotifOn] = useState(true);

  const rank = getRank(user?.totalEarned || 0);
  const nextRankMap = { Bronze: 500, Silver: 2000, Gold: 5000, Platinum: 10000 };
  const nextTarget = nextRankMap[rank.label] || null;
  const progress = nextTarget ? Math.min((user?.totalEarned || 0) / nextTarget * 100, 100) : 100;

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast('See you soon! 🌿');
  };

  const copyReferral = () => {
    navigator.clipboard?.writeText(user?.referralCode || 'VARUN2024');
    toast.success('Referral code copied!');
  };

  return (
    <div style={{ padding: '0 20px' }}>

      {/* Header */}
      <div style={{ paddingTop: 52, paddingBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>Profile</h1>
      </div>

      {/* Profile Card */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
        borderRadius: 24, padding: '28px 20px', marginBottom: 16, textAlign: 'center',
      }}>
        <div className="avatar avatar-xl" style={{ margin: '0 auto 14px' }}>
          {user?.avatar || user?.name?.substring(0,2).toUpperCase() || 'VK'}
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {user?.name}
        </h2>
        <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 4 }}>
          {user?.department} · Year {user?.year}
        </p>
        <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 18 }}>{user?.email}</p>

        {/* Rank Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 20px', borderRadius: 999,
          background: `${rank.color}18`, border: `1.5px solid ${rank.color}44`,
          marginBottom: 18,
        }}>
          <span style={{ fontSize: 18 }}>{rank.icon}</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: rank.color }}>{rank.label}</span>
        </div>

        {/* Rank Progress */}
        {nextTarget && (
          <div style={{ width: '100%', marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>
              <span>{(user?.totalEarned || 0).toLocaleString()} coins</span>
              <span>{nextTarget.toLocaleString()} for next rank</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          {[
            { label: 'Deposited',  value: user?.totalItems || 0 },
            { label: 'Coins Earned', value: `${(user?.totalEarned || 0).toLocaleString()} 🟡` },
            { label: 'CO₂ Saved',  value: `${user?.co2Saved || 0} kg` },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div style={{ marginBottom: 16 }}>
        <div className="section-header">
          <span className="section-title">Achievements</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {ACHIEVEMENTS.filter(a => a.earned).length}/{ACHIEVEMENTS.length} earned
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {ACHIEVEMENTS.map(a => (
            <div key={a.id} title={`${a.label}: ${a.desc}`} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              padding: '12px 6px', borderRadius: 14, textAlign: 'center', cursor: 'default',
              background: a.earned ? 'var(--accent-dim)' : 'var(--surface)',
              border: `1px solid ${a.earned ? 'var(--border-2)' : 'var(--border)'}`,
              opacity: a.earned ? 1 : 0.4,
              transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: 24, filter: a.earned ? 'none' : 'grayscale(1)' }}>{a.icon}</span>
              <span style={{ fontSize: 9, color: a.earned ? 'var(--accent)' : 'var(--text-3)', fontWeight: 600, lineHeight: 1.2 }}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Card */}
      <div style={{
        padding: '18px 20px', marginBottom: 16, borderRadius: 18,
        background: 'var(--accent-dim)', border: '1px solid var(--border-2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>🎁 Refer & Earn</p>
          <span className="badge badge-accent">+10 coins per referral</span>
        </div>
        <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
          Share your code. Earn 10 E-Coins when a friend joins.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, background: 'var(--bg)', borderRadius: 10, padding: '10px 14px',
            fontFamily: 'monospace', fontSize: 17, fontWeight: 700, color: 'var(--accent)',
            letterSpacing: '0.12em',
          }}>
            {user?.referralCode || 'VARUN2024'}
          </div>
          <button className="btn btn-primary btn-sm" onClick={copyReferral}>Copy</button>
        </div>
      </div>

      {/* Notifications */}
      {notifications?.length > 0 && (
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: 18, padding: '18px 20px', marginBottom: 16,
        }}>
          <p style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Notifications</p>
          {notifications.map((n, i) => (
            <div key={n.id} style={{
              display: 'flex', gap: 12, paddingBottom: 12, marginBottom: 12,
              borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                background: n.read ? 'var(--text-3)' : 'var(--accent)',
                boxShadow: n.read ? 'none' : '0 0 6px var(--accent-glow)',
              }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, lineHeight: 1.5 }}>{n.text}</p>
                <p style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 3 }}>{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
        borderRadius: 18, padding: '4px 20px', marginBottom: 16,
      }}>
        <SettingsRow
          icon="🌙"
          label={isDark ? 'Dark Mode' : 'Light Mode'}
          trailing={<Toggle on={isDark} onToggle={toggleTheme} />}
        />
        <SettingsRow
          icon="🔔"
          label="Notifications"
          trailing={<Toggle on={notifOn} onToggle={() => setNotifOn(v => !v)} />}
        />
        <SettingsRow
          icon="🌍"
          label="Language"
          trailing={<span style={{ color: 'var(--text-3)', fontSize: 13 }}>English</span>}
        />
        <SettingsRow icon="📄" label="Privacy Policy"   trailing={<span style={{ color: 'var(--text-3)' }}>›</span>} />
        <SettingsRow icon="ℹ️" label="About EcoDrop-CA" trailing={<span style={{ color: 'var(--text-3)' }}>›</span>} />
        <div style={{ padding: '14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🏪</div>
            <button
              onClick={() => window.open('/partner', '_blank')}
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--accent)', cursor: 'pointer' }}
            >
              Partner Portal (Shopkeeper)
            </button>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button className="btn btn-danger btn-full" onClick={handleLogout} style={{ padding: '15px', marginBottom: 10 }}>
        Sign Out
      </button>

      <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 12, paddingBottom: 8 }}>
        EcoDrop-CA v1.0.0 · Made with 🌱 for NIIT University
      </p>
      <div style={{ height: 8 }} />
    </div>
  );
}
