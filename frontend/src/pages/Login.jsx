import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <motion.div className="auth-card glass"
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-logo">⛳ GolfGive</div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Welcome back</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Sign in to your account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input name="email" type="email" value={form.email} onChange={handle}
              className="form-input" placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input name="password" type="password" value={form.password} onChange={handle}
              className="form-input" placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '15px' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--emerald)', fontWeight: '600' }}>Join now</Link>
        </p>
      </motion.div>

      <style>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 80px 24px 40px; position: relative; }
        .auth-bg { position: fixed; inset: 0; background: radial-gradient(ellipse 70% 50% at 50% 0%, rgba(16,185,129,0.1), transparent); pointer-events: none; z-index: 0; }
        .auth-card { width: 100%; max-width: 440px; padding: 40px; position: relative; z-index: 1; }
        .auth-logo { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 20px; background: linear-gradient(135deg, var(--emerald), var(--gold)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 24px; }
      `}</style>
    </div>
  );
}
