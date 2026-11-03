import { useState } from 'react';
import { LEADERBOARD_USERS, WEEKLY_LEADERBOARD } from '../data/mockData';

const TABS = ['Campus', 'Weekly', 'Department', 'Friends'];
const DEPTS = ['All', 'CSE', 'ECE', 'ME', 'CE', 'EE'];

function RankBadge({ rank }) {
  const colors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: colors[rank] ? `${colors[rank]}22` : 'var(--surface-2)',
      border: `1.5px solid ${colors[rank] || 'var(--border)'}`,
      fontSize: rank <= 3 ? 14 : 11, fontWeight: 700,
      color: colors[rank] || 'var(--text-3)', flexShrink: 0,
    }}>
      {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}
    </div>
  );
}

function UserRow({ user, highlight }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      background: highlight ? 'var(--accent-dim)' : 'var(--surface)',
      border: `1px solid ${highlight ? 'var(--border-2)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', marginBottom: 8,
      boxShadow: highlight ? 'var(--glow)' : 'none',
    }}>
      <RankBadge rank={user.rank} />
      <div className="avatar" style={{ fontSize: 12, fontWeight: 700 }}>{user.avatar || user.name?.split(' ').map(w=>w[0]).join('').substring(0,2)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.name} {highlight && '(You)'}
        </p>
        <p style={{ color: 'var(--text-3)', fontSize: 12 }}>{user.dept} · {user.items || user.weekly_items || 0} items</p>
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
        🟡 {(user.coins || user.weekly_coins || 0).toLocaleString()}
      </span>
    </div>
  );
}

function Podium({ top3 }) {
  const [second, first, third] = [top3[1], top3[0], top3[2]];
  const heights = [100, 130, 80];
  const order = [second, first, third];
  const labels = ['2nd', '1st', '3rd'];
  const colors = ['#C0C0C0', '#FFD700', '#CD7F32'];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 24, padding: '0 20px' }}>
      {order.map((u, i) => u && (
        <div key={u.id || i} style={{ flex: 1, textAlign: 'center' }}>
          {/* Avatar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{
              width: i === 1 ? 60 : 48, height: i === 1 ? 60 : 48, borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors[i]}33, ${colors[i]}66)`,
              border: `2px solid ${colors[i]}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: i === 1 ? 20 : 16, fontWeight: 700, color: colors[i],
              margin: '0 auto', boxShadow: `0 0 16px ${colors[i]}40`,
            }}>
              {u.avatar}
            </div>
            <p style={{ fontSize: i === 1 ? 13 : 11, fontWeight: 700, marginTop: 4, color: colors[i] }}>{u.name?.split(' ')[0]}</p>
            <p style={{ fontSize: 10, color: 'var(--text-3)' }}>🟡 {u.coins?.toLocaleString()}</p>
          </div>
          {/* Podium base */}
          <div style={{
            height: heights[i], background: `linear-gradient(to top, ${colors[i]}22, ${colors[i]}44)`,
            border: `1px solid ${colors[i]}44`, borderRadius: '8px 8px 0 0',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8,
            fontSize: 14, fontWeight: 700, color: colors[i],
          }}>
            {labels[i]}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Leaderboard() {
  const [tab, setTab]   = useState('Campus');
  const [dept, setDept] = useState('All');

  const campusUsers = LEADERBOARD_USERS;
  const weeklyUsers = WEEKLY_LEADERBOARD;

  const deptUsers = campusUsers
    .filter(u => dept === 'All' || u.dept === dept)
    .map((u, i) => ({ ...u, rank: i + 1 }));

  const myUser = campusUsers.find(u => u.isMe);
  const weeksEnd = (() => {
    const now = new Date();
    const day = now.getDay();
    const diff = 8 - day;
    const next = new Date(now.setDate(now.getDate() + diff));
    return next.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  })();

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ padding: '52px 4px 16px' }}>
        <h1 className="page-header-title" style={{ padding: 0, marginBottom: 4 }}>🏆 Leaderboard</h1>
        {myUser && <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Your rank: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>#{myUser.rank} Campus</span></p>}
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 16 }}>
        {TABS.map(t => <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {/* Campus */}
      {tab === 'Campus' && (
        <>
          <Podium top3={campusUsers.slice(0, 3)} />
          {campusUsers.slice(3).map(u => <UserRow key={u.id} user={u} highlight={u.isMe} />)}
        </>
      )}

      {/* Weekly */}
      {tab === 'Weekly' && (
        <>
          <div className="glass card" style={{ marginBottom: 16, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 700, color: '#F59E0B' }}>⏰ Resets on</p>
                <p style={{ color: 'var(--text-2)', fontSize: 13 }}>{weeksEnd}</p>
              </div>
              <span className="badge badge-gold">Weekly Race</span>
            </div>
          </div>
          <Podium top3={weeklyUsers.slice(0, 3)} />
          {weeklyUsers.slice(3).map((u, i) => <UserRow key={i} user={u} highlight={u.isMe} />)}
        </>
      )}

      {/* Department */}
      {tab === 'Department' && (
        <>
          <div className="chips" style={{ marginBottom: 16 }}>
            {DEPTS.map(d => <button key={d} className={`chip ${dept === d ? 'active' : ''}`} onClick={() => setDept(d)}>{d}</button>)}
          </div>
          {deptUsers.map(u => <UserRow key={u.id} user={u} highlight={u.isMe} />)}
        </>
      )}

      {/* Friends */}
      {tab === 'Friends' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div className="glass card" style={{ marginBottom: 20, background: 'var(--accent-dim)', border: '1px solid var(--border-2)' }}>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>📨 Invite Friends</p>
            <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 16 }}>Share your referral code. Earn 10 coins when they join!</p>
            <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 16px', fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 12 }}>
              VARUN2024
            </div>
            <button className="btn btn-accent btn-sm btn-full" onClick={() => navigator.clipboard?.writeText('VARUN2024').then(() => alert('Copied!'))}>
              📋 Copy Code
            </button>
          </div>
          <div style={{ color: 'var(--text-3)', fontSize: 40, marginBottom: 12 }}>👥</div>
          <p style={{ color: 'var(--text-2)' }}>No friends yet. Invite them using your code!</p>
        </div>
      )}

      <div style={{ height: 8 }} />
    </div>
  );
}
