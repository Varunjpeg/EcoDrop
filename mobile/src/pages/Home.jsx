import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CAMPUS_STATS, ITEM_TYPES, MACHINES } from '../data/mockData';

function AnimNum({ value }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let s = 0;
    const step = Math.ceil(value / 50);
    const t = setInterval(() => {
      s = Math.min(s + step, value);
      setV(s);
      if (s >= value) clearInterval(t);
    }, 25);
    return () => clearInterval(t);
  }, [value]);
  return <>{v.toLocaleString()}</>;
}

function QuickActionBtn({ icon, label, color, bg, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: '14px 8px', borderRadius: 16,
      background: bg || 'var(--surface)', border: '1px solid var(--border)',
      transition: 'all 0.18s', cursor: 'pointer',
    }}
    onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
    onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: color || 'var(--text-2)', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
    </button>
  );
}

function StatItem({ icon, label, value, color }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: color || 'var(--accent)' }}>
        <AnimNum value={value} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function Home() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { user, transactions, notifications } = state;
  const unread = notifications?.filter(n => !n.read).length || 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'User';

  const recentTx = transactions?.slice(0, 3) || [];

  return (
    <div style={{ padding: '0 20px' }}>

      {/* ── Top Bar ─────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 56, paddingBottom: 20,
      }}>
        <div>
          <p style={{ color: 'var(--text-3)', fontSize: 13, fontWeight: 500 }}>{greeting} 👋</p>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800,
            letterSpacing: '-0.03em', marginTop: 2,
          }}>
            {firstName}
          </h1>
        </div>
        <button
          onClick={() => navigate('/profile')}
          style={{ position: 'relative' }}
        >
          <div className="avatar avatar-lg">{user?.avatar || firstName.substring(0,2).toUpperCase()}</div>
          {unread > 0 && (
            <div style={{
              position: 'absolute', top: -2, right: -2,
              width: 18, height: 18, borderRadius: '50%',
              background: 'var(--danger)', border: '2px solid var(--bg)',
              fontSize: 9, fontWeight: 700, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{unread}</div>
          )}
        </button>
      </div>

      {/* ── Balance Card ────────────────────────────── */}
      <div className="balance-card anim-slide-up" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            E-Coin Balance
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 20 }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 800,
              color: '#fff', lineHeight: 1, letterSpacing: '-0.03em',
            }}>
              <AnimNum value={user?.coins || 0} />
            </span>
            <span style={{ fontSize: 24, marginBottom: 4 }}>🟡</span>
          </div>
          <div style={{ display: 'flex', gap: 0 }}>
            <div style={{ flex: 1, paddingRight: 16, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>All-time earned</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{(user?.totalEarned || 0).toLocaleString()}</p>
            </div>
            <div style={{ flex: 1, paddingLeft: 16, paddingRight: 16, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>🔥 Streak</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{user?.streak || 0} days</p>
            </div>
            <div style={{ flex: 1, paddingLeft: 16 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>Items</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{user?.totalItems || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <QuickActionBtn icon="📷" label="Scan & Deposit" color="var(--accent)" bg="var(--accent-dim)" onClick={() => navigate('/scan')} />
        <QuickActionBtn icon="🎁" label="Rewards" color="#F5B731" onClick={() => navigate('/rewards')} />
        <QuickActionBtn icon="🏆" label="Leaderboard" color="#9B79FF" onClick={() => navigate('/leaderboard')} />
        <QuickActionBtn icon="🌍" label="Impact" color="#4DA6FF" onClick={() => navigate('/impact')} />
      </div>

      {/* ── Campus Live ──────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-header">
          <span className="section-title">Campus Live</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulseSlow 2s infinite' }} />
            Live
          </span>
        </div>
        <div style={{
          display: 'flex', padding: '16px 20px',
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: 'var(--r)', justifyContent: 'space-around',
        }}>
          <StatItem icon="♻️" label="Recycled Today"  value={CAMPUS_STATS.itemsToday}  color="var(--accent)" />
          <div style={{ width: 1, background: 'var(--border)' }} />
          <StatItem icon="🌿" label="kg CO₂ Saved"   value={CAMPUS_STATS.co2Today}    color="#10B981" />
          <div style={{ width: 1, background: 'var(--border)' }} />
          <StatItem icon="🟡" label="Coins Issued"   value={CAMPUS_STATS.coinsToday}  color="var(--gold)" />
        </div>
      </div>

      {/* ── Recent Activity ──────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-header">
          <span className="section-title">Recent Activity</span>
          <button onClick={() => navigate('/wallet')} className="section-link">See all</button>
        </div>
        {recentTx.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-3)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
            <p style={{ fontSize: 14 }}>No activity yet. Start scanning!</p>
          </div>
        ) : (
          recentTx.map((tx, i) => {
            const itemInfo = ITEM_TYPES[tx.item] || {};
            const isEarn = tx.type === 'earn';
            return (
              <div key={tx.id} onClick={() => navigate('/wallet')} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', marginBottom: 8, cursor: 'pointer',
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                borderRadius: 14, transition: 'border-color 0.18s',
                animation: `slideUp 0.3s ease ${i * 0.06}s both`,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: isEarn ? 'rgba(0,208,132,0.12)' : 'rgba(240,82,82,0.10)',
                  border: `1px solid ${isEarn ? 'rgba(0,208,132,0.2)' : 'rgba(240,82,82,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {isEarn ? (itemInfo.icon || '♻️') : '🎁'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isEarn ? (itemInfo.label || tx.item) : `${tx.partner} Voucher`}
                  </p>
                  <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 2 }}>
                    {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, flexShrink: 0,
                  color: isEarn ? 'var(--accent)' : 'var(--danger)',
                }}>
                  {isEarn ? '+' : ''}{tx.coins} 🟡
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* ── Nearby Machines ─────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-header">
          <span className="section-title">Nearby Machines</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>📍 On-campus</span>
        </div>
        {MACHINES.slice(0, 3).map(m => (
          <div key={m.id} onClick={() => navigate('/scan')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', marginBottom: 8,
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderRadius: 14, cursor: 'pointer', transition: 'border-color 0.18s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: m.status === 'active' ? 'var(--accent)' : 'var(--warning)',
                boxShadow: m.status === 'active' ? '0 0 8px var(--accent)' : 'none',
              }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{m.location}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{m.distance}</p>
              <p style={{ fontSize: 11, marginTop: 2, color: m.status === 'active' ? 'var(--accent)' : 'var(--warning)' }}>
                {m.status === 'active' ? '● Active' : '● Maintenance'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom Banner ────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <button onClick={() => navigate('/forums')} style={{
          flex: 1, padding: '16px', borderRadius: 16, cursor: 'pointer',
          background: 'linear-gradient(135deg,rgba(155,121,255,0.15),rgba(77,166,255,0.12))',
          border: '1px solid rgba(155,121,255,0.25)', textAlign: 'left',
        }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>💬</div>
          <p style={{ fontWeight: 700, fontSize: 14 }}>Community</p>
          <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 3 }}>Tips & challenges</p>
        </button>
        <button onClick={() => navigate('/learn')} style={{
          flex: 1, padding: '16px', borderRadius: 16, cursor: 'pointer',
          background: 'linear-gradient(135deg,rgba(0,208,132,0.12),rgba(16,185,129,0.08))',
          border: '1px solid rgba(0,208,132,0.2)', textAlign: 'left',
        }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>📖</div>
          <p style={{ fontWeight: 700, fontSize: 14 }}>Learn</p>
          <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 3 }}>Waste guide & tips</p>
        </button>
      </div>

      <div style={{ height: 8 }} />
    </div>
  );
}
