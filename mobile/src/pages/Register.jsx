import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MOCK_USER } from '../data/mockData';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['CSE','ECE','ME','CE','EE','IT','BioTech','Civil','Other'];

export default function Register() {
  const { register, login, isSupabase } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', dept: 'CSE', year: '2', password: '', confirm: '', terms: false,
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const step1Valid = form.name.trim().length > 2 && form.email.includes('@') && form.dept;
  const step2Valid = form.password.length >= 6 && form.password === form.confirm && form.terms;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!step2Valid) { toast.error('Please complete all fields'); return; }
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        fullName: form.name,
        department: form.dept,
        year: form.year,
      });
      toast.success('Welcome to EcoDrop, ' + form.name.split(' ')[0] + '! 🌱');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="page-fullscreen" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, padding: '56px 28px 40px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }} className="anim-slide-down">
          <Link to="/login" style={{ color: 'var(--text-3)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
            ← Back to Login
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Join EcoDrop-CA</h1>
          <p style={{ color: 'var(--text-2)', marginTop: 6, fontSize: 14 }}>Step {step} of 2</p>
          {/* Progress */}
          <div className="progress-bar" style={{ marginTop: 12 }}>
            <div className="progress-fill" style={{ width: `${step * 50}%` }} />
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="anim-slide-up">
            <div className="input-group">
              <label className={`input-label ${form.name ? 'active' : ''}`}>Full Name</label>
              <input className="input-field" type="text" value={form.name} onChange={set('name')} placeholder="Full Name" />
            </div>
            <div className="input-group">
              <label className={`input-label ${form.email ? 'active' : ''}`}>College Email</label>
              <input className="input-field" type="email" value={form.email} onChange={set('email')} placeholder="College Email" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 6, display: 'block' }}>Department</label>
              <select className="input-plain" value={form.dept} onChange={set('dept')}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 6, display: 'block' }}>Year of Study</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['1','2','3','4'].map(y => (
                  <button key={y} type="button" onClick={() => setForm(f => ({ ...f, year: y }))} style={{
                    flex: 1, padding: '12px', borderRadius: 12,
                    background: form.year === y ? 'var(--accent-dim)' : 'var(--surface-2)',
                    border: `1.5px solid ${form.year === y ? 'var(--border-2)' : 'var(--border)'}`,
                    color: form.year === y ? 'var(--accent)' : 'var(--text-2)',
                    fontWeight: 600, fontSize: 15, cursor: 'pointer',
                  }}>
                    {y}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary btn-full" disabled={!step1Valid} onClick={() => setStep(2)} style={{ padding: '16px' }}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="anim-slide-up">
            <div className="input-group">
              <label className={`input-label ${form.password ? 'active' : ''}`}>Password (min 6 chars)</label>
              <input className="input-field" type="password" value={form.password} onChange={set('password')} placeholder="Password" />
            </div>
            <div className="input-group">
              <label className={`input-label ${form.confirm ? 'active' : ''}`}>Confirm Password</label>
              <input className="input-field" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Confirm Password" />
              {form.confirm && form.password !== form.confirm && (
                <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>Passwords don't match</p>
              )}
            </div>

            {/* Profile preview */}
            <div className="glass card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="avatar avatar-lg">{form.name.split(' ').map(w=>w[0]).join('').substring(0,2)}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{form.name}</div>
                <div style={{ color: 'var(--text-2)', fontSize: 13 }}>{form.dept} · Year {form.year}</div>
                <div style={{ color: 'var(--text-3)', fontSize: 12 }}>{form.email}</div>
              </div>
            </div>

            {/* Terms */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.terms} onChange={set('terms')} style={{ marginTop: 3, accentColor: 'var(--accent)', width: 16, height: 16 }} />
              <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                I agree to EcoDrop's <span style={{ color: 'var(--accent)' }}>Terms of Service</span> and <span style={{ color: 'var(--accent)' }}>Privacy Policy</span>
              </span>
            </label>

            <button type="submit" className="btn btn-accent btn-full" disabled={!step2Valid || loading} style={{ padding: '16px', color: 'var(--text-inv)', fontWeight: 700, fontSize: 16 }}>
              {loading ? '🌱 Creating account...' : '🌿 Create My Account'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: 14, marginTop: 24 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
