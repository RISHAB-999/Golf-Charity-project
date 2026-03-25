import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@golfcharity.com', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16,185,129,0.08), transparent)', pointerEvents: 'none' }} />
      
      <div className="glass" style={{ width: '100%', maxWidth: '420px', padding: '40px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⛳</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>
            <span className="gradient-text">GolfGive</span> Admin
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Sign in with your admin credentials</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handle} className="form-input" required />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Password</label>
            <input name="password" type="password" value={form.password} onChange={handle} className="form-input" placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
          </button>
        </form>

        <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <strong>Default admin:</strong> admin@golfcharity.com<br />
          Password: <em>Admin@1234</em> (set after running schema.sql)
        </div>
      </div>
    </div>
  );
}
