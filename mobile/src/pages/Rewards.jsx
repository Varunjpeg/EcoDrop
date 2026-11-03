import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { REWARDS_CATALOG, MOCK_VOUCHERS } from '../data/mockData';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';

const PARTNERS = ['All', 'Gazebo', 'North Square', 'Hunger', 'Gymkhana', 'AB3 Canteen', 'Library', 'Campus Store'];

function RewardCard({ reward, userCoins, onRedeem }) {
  const canAfford = userCoins >= reward.coins;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      padding: '16px', display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'border-color 0.2s, transform 0.2s',
    }}>
      <div style={{ fontSize: 32, textAlign: 'center' }}>{reward.icon}</div>
      <div>
        <p style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-3)', marginBottom: 2 }}>{reward.partner}</p>
        <p style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{reward.desc}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: canAfford ? 'var(--accent)' : 'var(--danger)' }}>
          🟡 {reward.coins}
        </span>
        <button
          className={`btn btn-sm ${canAfford ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => canAfford && onRedeem(reward)}
          disabled={!canAfford}
          style={{ opacity: canAfford ? 1 : 0.5 }}
        >
          {canAfford ? 'Redeem' : 'Need ' + (reward.coins - userCoins) + ' more'}
        </button>
      </div>
    </div>
  );
}

function VoucherCard({ v }) {
  const statusColor = v.status === 'active' ? 'var(--accent)' : v.status === 'used' ? 'var(--text-3)' : 'var(--danger)';
  return (
    <div style={{ padding: '16px', marginBottom: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', opacity: v.status === 'expired' ? 0.55 : 1 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* QR visual */}
        <div style={{ width: 64, height: 64, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: 8, flexShrink: 0 }}>
          {[...Array(4)].map((_, i) => <div key={i} style={{ background: i % 3 === 0 ? 'var(--accent)' : 'var(--text-3)', borderRadius: 2, opacity: 0.8 }} />)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15 }}>{v.icon} {v.partner}</p>
              <p style={{ color: 'var(--text-2)', fontSize: 13 }}>{v.desc}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: `${statusColor}22`, padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>
              {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
            </span>
          </div>
          <p style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--accent)', marginTop: 6, letterSpacing: '0.08em' }}>{v.code}</p>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Expires: {v.expiry}</p>
        </div>
      </div>
    </div>
  );
}

export default function Rewards() {
  const { state, dispatch } = useApp();
  const [tab, setTab]       = useState('Browse');
  const [filter, setFilter] = useState('All');
  const [modal, setModal]   = useState(null);
  const [showConf, setShowConf] = useState(false);

  const userCoins = state.user?.coins || 0;
  const vouchers  = [...state.vouchers];

  const filtered = REWARDS_CATALOG.filter(r => filter === 'All' || r.partner === filter);

  const handleRedeem = (reward) => setModal(reward);

  const confirmRedeem = () => {
    if (!modal) return;
    dispatch({ type: 'REDEEM_REWARD', payload: { reward: modal } });
    toast.success(`${modal.icon} ${modal.desc} voucher redeemed!`);
    setShowConf(true);
    setTimeout(() => setShowConf(false), 3000);
    setModal(null);
  };

  return (
    <div style={{ padding: '0 16px' }}>
      {showConf && <Confetti recycle={false} numberOfPieces={150} colors={['#00FFA3','#F59E0B','#3B82F6']} style={{ position: 'fixed', top: 0, left: 0, zIndex: 200 }} />}

      <div style={{ padding: '52px 4px 20px' }}>
        <h1 className="page-header-title" style={{ padding: 0, marginBottom: 4 }}>Rewards Store</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Balance: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>🟡 {userCoins} coins</span></p>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 16 }}>
        {['Browse', 'My Vouchers'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Browse' && (
        <>
          {/* Partner Filter */}
          <div className="chips" style={{ marginBottom: 16 }}>
            {PARTNERS.map(p => (
              <button key={p} className={`chip ${filter === p ? 'active' : ''}`} onClick={() => setFilter(p)}>{p}</button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid-2">
            {filtered.map(r => (
              <RewardCard key={r.id} reward={r} userCoins={userCoins} onRedeem={handleRedeem} />
            ))}
          </div>
        </>
      )}

      {tab === 'My Vouchers' && (
        <>
          {vouchers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
              <p>No vouchers yet. Redeem your E-Coins!</p>
            </div>
          )}
          {vouchers.map(v => <VoucherCard key={v.id} v={v} />)}
        </>
      )}

      {/* Confirm Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{modal.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>{modal.partner}</h3>
              <p style={{ color: 'var(--text-2)', marginTop: 4 }}>{modal.desc}</p>
            </div>
            <div className="glass" style={{ padding: '14px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-2)' }}>Cost</span>
                <span style={{ fontWeight: 700 }}>🟡 {modal.coins}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-2)' }}>Remaining balance</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>🟡 {userCoins - modal.coins}</span>
              </div>
            </div>
            <button className="btn btn-accent btn-full" onClick={confirmRedeem} style={{ marginBottom: 10, padding: '16px', color: 'var(--text-inv)', fontWeight: 700 }}>
              🎉 Confirm Redemption
            </button>
            <button className="btn btn-outline btn-full" onClick={() => setModal(null)} style={{ padding: '14px' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ height: 8 }} />
    </div>
  );
}
