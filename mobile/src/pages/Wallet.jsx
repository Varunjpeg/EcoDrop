import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ITEM_TYPES, MONTHLY_COINS } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const TABS = ['All', 'Earned', 'Spent'];

function TxIcon({ tx }) {
  const item = ITEM_TYPES[tx.item];
  return (
    <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
      background: tx.type === 'earn' ? 'rgba(0,255,163,0.1)' : 'rgba(239,68,68,0.1)',
      border: `1px solid ${tx.type === 'earn' ? 'rgba(0,255,163,0.2)' : 'rgba(239,68,68,0.2)'}`,
    }}>
      {tx.type === 'earn' ? (item?.icon || '♻️') : '🎁'}
    </div>
  );
}

function TxCard({ tx }) {
  const [expanded, setExpanded] = useState(false);
  const item = ITEM_TYPES[tx.item];
  const date = new Date(tx.date);

  return (
    <div onClick={() => setExpanded(e => !e)} style={{
      padding: '14px', marginBottom: 8, background: 'var(--surface)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer',
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <TxIcon tx={tx} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tx.type === 'earn' ? (item?.label || tx.item) : `${tx.partner} Voucher`}
          </p>
          <p style={{ color: 'var(--text-3)', fontSize: 12 }}>
            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, color: tx.coins > 0 ? 'var(--accent)' : 'var(--danger)', flexShrink: 0 }}>
          {tx.coins > 0 ? '+' : ''}{tx.coins}🟡
        </span>
      </div>

      {expanded && tx.type === 'earn' && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', animation: 'slideDown 0.2s ease' }}>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>Machine: {tx.machine}</p>
          {tx.condition && <div style={{ display: 'flex', gap: 6 }}><span className="badge badge-green" style={{fontSize:10}}>{tx.condition}</span></div>}
        </div>
      )}
      {expanded && tx.type === 'spend' && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', animation: 'slideDown 0.2s ease' }}>
          <p style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'monospace' }}>Voucher: {tx.voucher}</p>
        </div>
      )}
    </div>
  );
}

export default function Wallet() {
  const { state } = useApp();
  const [tab, setTab] = useState('All');
  const { user, transactions } = state;

  const filtered = transactions.filter(tx => {
    if (tab === 'Earned') return tx.type === 'earn';
    if (tab === 'Spent')  return tx.type === 'spend';
    return true;
  });

  const totalEarned = transactions.filter(t => t.type === 'earn').reduce((s, t) => s + t.coins, 0);
  const totalSpent  = Math.abs(transactions.filter(t => t.type === 'spend').reduce((s, t) => s + t.coins, 0));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
        <p style={{ color: 'var(--accent)' }}>Earned: {payload[0]?.value}</p>
        <p style={{ color: 'var(--danger)' }}>Spent: {payload[1]?.value}</p>
      </div>
    );
    return null;
  };

  return (
    <div style={{ padding: '0 16px' }}>

      {/* Header */}
      <div style={{ padding: '52px 4px 20px' }}>
        <h1 className="page-header-title" style={{ padding: 0 }}>My Wallet</h1>
      </div>

      {/* Balance Card */}
      <div style={{ background: 'linear-gradient(135deg,#0D4F2E,#1a7a48)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 16, border: '1px solid rgba(0,255,163,0.2)' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Available Balance</p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 700, color: '#fff' }}>{user?.coins?.toLocaleString()} 🟡</p>
        <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
          <div><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Total Earned</p><p style={{ fontWeight: 700, color: '#fff' }}>+{totalEarned}</p></div>
          <div><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Total Spent</p><p style={{ fontWeight: 700, color: '#fff' }}>-{totalSpent}</p></div>
          <div><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Items</p><p style={{ fontWeight: 700, color: '#fff' }}>{user?.totalItems}</p></div>
        </div>
      </div>

      {/* Chart */}
      <div className="glass card" style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>📊 Monthly Overview</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={MONTHLY_COINS} barSize={14} barGap={4}>
            <XAxis dataKey="month" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="earned" fill="#0D4F2E" radius={[4,4,0,0]} />
            <Bar dataKey="spent"  fill="rgba(239,68,68,0.6)" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, background: '#0D4F2E', borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Earned</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, background: 'rgba(239,68,68,0.6)', borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Spent</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Transaction List */}
      {filtered.map(tx => <TxCard key={tx.id} tx={tx} />)}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p>No {tab.toLowerCase()} transactions yet</p>
        </div>
      )}

      <div style={{ height: 8 }} />
    </div>
  );
}
