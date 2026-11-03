import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MOCK_USER } from '../data/mockData';
import toast from 'react-hot-toast';

function EyeIcon({ open }) {
  return open
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}

export default function Login() {
  const { login, loginWithGoogle, isSupabase } = useApp();
  const navigate   = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState({});

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      if (isSupabase) {
        await login({ email, password });
        toast.success('Welcome back! 🌱');
      } else {
        await new Promise(r => setTimeout(r, 800));
        login(MOCK_USER);
        toast.success('Welcome back, ' + MOCK_USER.name.split(' ')[0] + '! 🌱');
      }
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      if (!isSupabase) {
        toast.success('Signed in with Google! 🌿');
        navigate('/');
      }
      // With Supabase OAuth, redirect happens automatically
    } catch (err) {
      toast.error(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };


  const handleDemoBypass = () => {
    login(MOCK_USER);
    toast.success('Signed in as Varun (Demo Mode)! 🌿');
    navigate('/');
  };

  const labelActive = (field) => focused[field] || (field === 'email' ? email : password);

  return (
    <div className="page-fullscreen" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Animated background particles */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', fontSize: 20, opacity: 0.04,
            left: `${(i * 37 + 10) % 90}%`,
            top: `${(i * 23 + 5) % 80}%`,
            animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}>🌿</div>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 28px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }} className="anim-slide-up">
          <div style={{ fontSize: 64, marginBottom: 12, filter: 'drop-shadow(0 0 24px rgba(0,255,163,0.5))' }}>🌿</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--text)' }}>EcoDrop-CA</h1>
          <p style={{ color: 'var(--text-2)', marginTop: 6, fontSize: 15 }}>Sign in to make a difference</p>
        </div>

        {/* Quick Demo Bypass Button */}
        <button
          onClick={handleDemoBypass}
          className="anim-slide-up"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px', borderRadius: 'var(--radius-full)', width: '100%',
            background: 'var(--accent-dim)', border: '1.5px solid var(--border-2)',
            color: 'var(--accent)', fontWeight: 700, fontSize: 15, marginBottom: 20,
            cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,208,132,0.15)',
          }}
        >
          ⚡ Quick Demo Login (Skip Account)
        </button>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 0 }} className="anim-slide-up">

          {/* Email */}
          <div className="input-group">
            <label className={`input-label ${labelActive('email') ? 'active' : ''}`}>Email address</label>
            <input
              type="email" className="input-field" value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused(f => ({ ...f, email: true }))}
              onBlur={() => setFocused(f => ({ ...f, email: false }))}
              placeholder="Email address"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="input-group" style={{ position: 'relative' }}>
            <label className={`input-label ${labelActive('password') ? 'active' : ''}`}>Password</label>
            <input
              type={showPw ? 'text' : 'password'} className="input-field" value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocused(f => ({ ...f, password: true }))}
              onBlur={() => setFocused(f => ({ ...f, password: false }))}
              placeholder="Password"
              autoComplete="current-password"
              style={{ paddingRight: 48 }}
            />
            <button type="button" onClick={() => setShowPw(v => !v)} style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-3)', padding: 4,
            }}>
              <EyeIcon open={showPw} />
            </button>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <span style={{ color: 'var(--accent)', fontSize: 13, cursor: 'pointer' }}>Forgot password?</span>
          </div>

          {/* Login Button */}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginBottom: 16, padding: '16px' }}>
            {loading ? <span className="anim-pulse">Signing in...</span> : '🌱 Sign In with Supabase'}
          </button>
        </form>

        {/* Divider */}
        <div className="divider-text">Or continue with</div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '14px', borderRadius: 'var(--radius-full)', width: '100%',
          background: 'var(--surface-2)', border: '1.5px solid var(--border)',
          color: 'var(--text)', fontWeight: 600, fontSize: 15, marginBottom: 24,
          cursor: 'pointer',
        }}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.8 20-21 0-1.4-.2-2.7-.5-4z"/><path fill="#34A853" d="M6.3 14.7l7 5.1C15.2 17.3 19.3 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.6-17.7 11.7z"/><path fill="#FBBC05" d="M24 45c5.8 0 10.8-1.9 14.4-5.2l-6.7-5.5C29.8 36 27 37 24 37c-6 0-10.6-3.9-11.8-9.2l-7 5.4C8 40.1 15.4 45 24 45z"/><path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.6 2.8-2.3 5.2-4.7 6.8l6.7 5.5C42 37.5 45 31.3 45 24c0-1.4-.2-2.7-.5-4z"/></svg>
          Continue with Google
        </button>

        {/* Register link */}
        <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: 14 }}>
          New here?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create Account</Link>
        </p>
      </div>
    </div>
  );
}

