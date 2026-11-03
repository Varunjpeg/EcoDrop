import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ITEM_TYPES, MONTHLY_COINS, CAMPUS_STATS, ITEM_CO2 } from '../data/mockData';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis } from 'recharts';
import toast from 'react-hot-toast';

function AnimNum({ value, decimals = 0 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let s = 0; const target = parseFloat(value);
    const step = target / 40;
    const t = setInterval(() => {
      s = Math.min(s + step, target);
      setV(s);
      if (s >= target) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [value]);
  return <>{decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString()}</>;
}

const PIE_COLORS = { plastic_bottle: '#3B82F6', textbook: '#8B5CF6', pen: '#EC4899', cardboard: '#F59E0B', earphones: '#EF4444', paper_bundle: '#10B981', charger: '#F97316', notebook: '#6366F1' };

export default function Impact() {
  const { state } = useApp();
  const { user, transactions } = state;

  // Calculate from transactions
  const earnedTx = transactions.filter(t => t.type === 'earn');
  const totalCo2 = earnedTx.reduce((s, t) => s + (ITEM_CO2[t.item] || 0.1), 0);
  const totalItems = earnedTx.length;
  const plasticKg = earnedTx.filter(t => t.item === 'plastic_bottle').length * 0.05;
  const treesSaved = +(totalCo2 / 22).toFixed(2); // 1 tree absorbs ~22kg CO2/year

  // Pie data
  const byType = {};
  earnedTx.forEach(t => { byType[t.item] = (byType[t.item] || 0) + 1; });
  const pieData = Object.entries(byType).map(([key, count]) => ({
    name: ITEM_TYPES[key]?.label || key,
    value: count,
    color: PIE_COLORS[key] || '#00FFA3',
  }));

  const CustomPieTip = ({ active, payload }) => {
    if (active && payload?.length) return (
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 10, fontSize: 12 }}>
        <p style={{ fontWeight: 700, color: payload[0].payload.color }}>{payload[0].name}</p>
        <p style={{ color: 'var(--text-2)' }}>{payload[0].value} items</p>
      </div>
    );
    return null;
  };

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ padding: '52px 4px 20px' }}>
        <h1 className="page-header-title" style={{ padding: 0, marginBottom: 4 }}>🌍 My Eco Impact</h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Your contribution to a greener campus</p>
      </div>

      {/* Big Stats */}
      <div className="grid-2" style={{ marginBottom: 16 }}>
        {[
          { label: 'Items Recycled',  value: totalItems,              unit: '',    icon: '♻️', color: 'var(--accent)', dec: 0 },
          { label: 'CO₂ Saved',       value: totalCo2,                unit: ' kg', icon: '🌿', color: '#10B981',       dec: 1 },
          { label: 'Plastic Saved',   value: plasticKg,               unit: ' kg', icon: '🧴', color: '#3B82F6',       dec: 2 },
          { label: 'Trees Equivalent',value: treesSaved,               unit: '',    icon: '🌳', color: '#10B981',       dec: 2 },
        ].map((s, i) => (
          <div key={i} className="glass" style={{ padding: '16px', textAlign: 'center', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: s.color }}>
              <AnimNum value={s.value} decimals={s.dec} />{s.unit}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="glass card" style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>📊 What I've Recycled</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomPieTip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {pieData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Bar */}
      <div className="glass card" style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>📅 Monthly Earnings</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={MONTHLY_COINS} barSize={16}>
            <XAxis dataKey="month" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Bar dataKey="earned" fill="#0D4F2E" radius={[4,4,0,0]} />
            <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text)' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Campus Collective */}
      <div className="glass card" style={{ marginBottom: 16, border: '1px solid rgba(0,255,163,0.2)', background: 'rgba(0,255,163,0.05)' }}>
        <p style={{ fontWeight: 700, marginBottom: 12, color: 'var(--accent)' }}>🏫 Campus Collective Impact</p>
        {[
          { label: 'Total Users',      value: CAMPUS_STATS.totalUsers.toLocaleString(),          icon: '👥' },
          { label: 'Items Recycled',   value: CAMPUS_STATS.totalItemsAllTime.toLocaleString(),   icon: '♻️' },
          { label: 'CO₂ Saved (Total)',value: CAMPUS_STATS.totalCo2AllTime + ' kg',              icon: '🌍' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontSize: 14, color: 'var(--text-2)' }}>{s.icon} {s.label}</span>
            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Share Button */}
      <button className="btn btn-outline btn-full" onClick={() => toast('Impact card shared! 🌿', { icon: '🌍' })} style={{ marginBottom: 16, padding: '14px' }}>
        🌍 Share My Impact Card
      </button>

      <div style={{ height: 8 }} />
    </div>
  );
}
