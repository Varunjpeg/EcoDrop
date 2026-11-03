import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    emoji: '🌿',
    title: 'Welcome to EcoDrop-CA',
    subtitle: 'Turn Waste Into Rewards',
    desc: 'The smartest reverse vending machine on campus. Deposit waste, earn E-Coins, redeem at your favourite spots.',
    bg: 'linear-gradient(160deg, #ECFDF5 0%, #F0FDF4 50%, #F5F3FF 100%)',
    accent: '#059669',
  },
  {
    emoji: '🤖',
    title: 'AI-Powered Recognition',
    subtitle: 'Smart. Fast. Accurate.',
    desc: 'Our onboard AI identifies your waste item, assesses its condition, and calculates fair E-Coin rewards in seconds.',
    steps: ['📷 Scan QR & connect via BLE', '📦 Deposit your waste item', '🪙 Collect E-Coins instantly'],
    bg: 'linear-gradient(160deg, #EEF2FF 0%, #F0FDF4 50%, #ECFDF5 100%)',
    accent: '#6D28D9',
  },
  {
    emoji: '🎁',
    title: 'Campus Rewards',
    subtitle: 'Spend Coins, Save Money',
    desc: 'Redeem your E-Coins at top campus dining and sports spots.',
    partners: [
      { name: 'Gazebo',       icon: '🍔' },
      { name: 'North Square', icon: '🍕' },
      { name: 'Hunger',       icon: '🥗' },
      { name: 'Gymkhana',     icon: '🏋️' },
      { name: 'AB3 Canteen',  icon: '🍱' },
      { name: 'Library',      icon: '📚' },
    ],
    bg: 'linear-gradient(160deg, #FFFBEB 0%, #FEF3C7 30%, #ECFDF5 100%)',
    accent: '#D97706',
  },
];

export default function Onboarding() {
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();
  const current = SLIDES[slide];

  const goToLogin = () => {
    localStorage.setItem('ecodrop_onboarding_done', 'true');
    navigate('/login');
  };

  const next = () => {
    if (slide < SLIDES.length - 1) setSlide(s => s + 1);
    else goToLogin();
  };

  return (
    <div className="page-fullscreen" style={{
      background: current.bg, minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      transition: 'background 0.5s ease',
    }}>

      {/* Skip */}
      <div style={{ padding: '56px 24px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={goToLogin} style={{
          color: '#6B7280', fontSize: 14, fontWeight: 500,
          padding: '8px 16px', borderRadius: 999,
          background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)',
        }}>
          Skip →
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 28px', textAlign: 'center',
      }}>

        {/* Main Emoji */}
        <div className="anim-float" style={{
          fontSize: 80, marginBottom: 28,
          filter: `drop-shadow(0 4px 20px ${current.accent}30)`,
        }}>
          {current.emoji}
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
          marginBottom: 8, color: '#111827', letterSpacing: '-0.03em',
        }}>
          {current.title}
        </h1>
        <p style={{ color: current.accent, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
          {current.subtitle}
        </p>
        <p style={{ color: '#4B5563', fontSize: 15, lineHeight: 1.7, maxWidth: 320 }}>
          {current.desc}
        </p>

        {/* Steps (slide 2) */}
        {current.steps && (
          <div style={{ marginTop: 28, width: '100%' }}>
            {current.steps.map((step, i) => (
              <div key={i} className="anim-slide-up" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px', marginBottom: 10, borderRadius: 14,
                background: '#FFFFFF', border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                animationDelay: `${i * 0.1}s`,
              }}>
                <span style={{ fontSize: 20 }}>{step.split(' ')[0]}</span>
                <span style={{ color: '#374151', fontSize: 14, fontWeight: 500 }}>
                  {step.split(' ').slice(1).join(' ')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Partners (slide 3) */}
        {current.partners && (
          <div style={{
            marginTop: 28, display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr', gap: 10, width: '100%',
          }}>
            {current.partners.map((p, i) => (
              <div key={i} className="anim-bounce-in" style={{
                background: '#FFFFFF', border: '1px solid #E5E7EB',
                borderRadius: 14, padding: '14px 8px', textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{p.icon}</div>
                <div style={{ fontSize: 11, color: '#4B5563', fontWeight: 600 }}>{p.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div style={{ padding: '0 28px 56px' }}>
        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => setSlide(i)} style={{
              width: i === slide ? 28 : 8, height: 8, borderRadius: 4,
              background: i === slide ? current.accent : '#D1D5DB',
              transition: 'all 0.3s ease', cursor: 'pointer',
            }} />
          ))}
        </div>

        {/* CTA Button */}
        <button onClick={next} style={{
          width: '100%', padding: '16px',
          background: current.accent, color: '#FFFFFF',
          borderRadius: 999, fontSize: 16, fontWeight: 700,
          border: 'none', cursor: 'pointer',
          boxShadow: `0 4px 16px ${current.accent}40`,
          transition: 'all 0.2s',
        }}>
          {slide < SLIDES.length - 1 ? 'Next →' : '🌱 Get Started'}
        </button>
      </div>
    </div>
  );
}
