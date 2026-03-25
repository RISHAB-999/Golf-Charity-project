import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const STEPS = ['Account', 'Charity', 'Plan'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [charities, setCharities] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    charity_id: '', charity_percentage: 10, plan: 'monthly'
  });

  useEffect(() => {
    api.get('/api/charities').then(r => setCharities(r.data)).catch(() => {});
  }, []);

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const next = () => { setError(''); setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      await register(form);
      navigate('/checkout'); // Redirect to fake payment gateway
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    { id: 'monthly', price: '£9.99', period: '/month', tag: null, savings: null },
    { id: 'yearly', price: '£99.99', period: '/year', tag: 'Save 17%', savings: '£19.89 saved' },
  ];

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <motion.div className="auth-card glass" style={{ maxWidth: '500px' }}
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-logo">⛳ GolfGive</div>

        {/* Step indicator */}
        <div className="steps-indicator">
          {STEPS.map((s, i) => (
            <div key={i} className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}>
              <div className="step-num">{i < step ? '✓' : i + 1}</div>
              <div className="step-name">{s}</div>
            </div>
          ))}
          <div className="steps-line">
            <div className="steps-progress" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <AnimatePresence mode="wait">
          {/* Step 0: Account details */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '24px' }}>Create your account</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input name="name" value={form.name} onChange={handle} className="form-input" placeholder="John Smith" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handle} className="form-input" placeholder="john@example.com" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input name="password" type="password" value={form.password} onChange={handle} className="form-input" placeholder="Min. 8 characters" required minLength={8} />
                </div>
                <button className="btn btn-primary btn-full" onClick={next} disabled={!form.name || !form.email || !form.password}>
                  Continue →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Charity */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Choose your charity</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>A portion of your subscription goes to them every month.</p>
              
              {charities.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>Loading charities...</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {charities.map(c => (
                    <div key={c.id}
                      className={`charity-option ${form.charity_id === c.id ? 'selected' : ''}`}
                      onClick={() => setForm(p => ({ ...p, charity_id: c.id }))}>
                      <div style={{ fontWeight: '600' }}>{c.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{c.description?.substring(0, 60)}...</div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Your contribution: {form.charity_percentage}%</label>
                <input type="range" min="10" max="100" step="5" name="charity_percentage" value={form.charity_percentage} onChange={handle}
                  style={{ width: '100%', accentColor: 'var(--emerald)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-dim)' }}>
                  <span>Min 10%</span><span>100%</span>
                </div>
              </div>
              
              {!form.charity_id && <p style={{ color: 'var(--gold)', fontSize: '13px', marginBottom: '12px' }}>⚠️ Please select a charity to continue</p>}
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-outline btn-full" onClick={back}>Back</button>
                <button className="btn btn-primary btn-full" onClick={next} disabled={!form.charity_id} style={{ opacity: form.charity_id ? 1 : 0.5, cursor: form.charity_id ? 'pointer' : 'not-allowed' }}>
                  Continue →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Plan */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '24px' }}>Pick your plan</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {plans.map(p => (
                  <div key={p.id}
                    className={`plan-option ${form.plan === p.id ? 'selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, plan: p.id }))}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '17px' }}>{p.id === 'monthly' ? 'Monthly' : 'Yearly'}</div>
                      {p.savings && <div style={{ fontSize: '12px', color: 'var(--emerald)' }}>{p.savings}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'Outfit' }}>{p.price}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{p.period}</span>
                    </div>
                    {p.tag && <div className="badge badge-gold" style={{ position: 'absolute', top: '-10px', right: '16px' }}>{p.tag}</div>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-outline btn-full" onClick={back}>Back</button>
                <button className="btn btn-primary btn-full" onClick={submit} disabled={loading}>
                  {loading ? 'Creating...' : 'Create My Account 🎉'}
                </button>
              </div>
              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-dim)', marginTop: '16px' }}>
                By joining you agree to our terms. Cancel anytime.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '15px' }}>
          Already a member? <Link to="/login" style={{ color: 'var(--emerald)', fontWeight: '600' }}>Sign in</Link>
        </p>
      </motion.div>

      <style>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 80px 24px 40px; position: relative; }
        .auth-bg { position: fixed; inset: 0; background: radial-gradient(ellipse 70% 50% at 50% 0%, rgba(16,185,129,0.1), transparent); pointer-events: none; z-index: 0; }
        .auth-card { width: 100%; padding: 40px; position: relative; z-index: 1; }
        .auth-logo { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 20px; background: linear-gradient(135deg, var(--emerald), var(--gold)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 24px; }
        .steps-indicator { display: flex; align-items: flex-start; justify-content: space-between; position: relative; margin-bottom: 32px; }
        .steps-line { position: absolute; top: 14px; left: 14px; right: 14px; height: 2px; background: var(--border); z-index: 0; }
        .steps-progress { height: 100%; background: var(--emerald); transition: width 0.4s ease; }
        .step-dot { display: flex; flex-direction: column; align-items: center; gap: 6px; z-index: 1; }
        .step-num { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border); background: var(--bg); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--text-muted); transition: all 0.3s; }
        .step-dot.active .step-num { border-color: var(--emerald); color: var(--emerald); background: rgba(16,185,129,0.1); }
        .step-dot.done .step-num { border-color: var(--emerald); background: var(--emerald); color: #fff; }
        .step-name { font-size: 11px; color: var(--text-dim); }
        .charity-option, .plan-option { 
          padding: 16px; border-radius: var(--radius-sm); border: 2px solid var(--border); 
          cursor: pointer; transition: var(--transition); position: relative;
        }
        .charity-option:hover, .plan-option:hover { border-color: var(--border-hover); background: var(--surface); }
        .charity-option.selected, .plan-option.selected { border-color: var(--emerald); background: rgba(16,185,129,0.05); }
        .plan-option { display: flex; justify-content: space-between; align-items: center; }
      `}</style>
    </div>
  );
}
