import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const TABS = ['Overview', 'Scores', 'Draws', 'Charity', 'Winnings'];

export default function Dashboard() {
  const { user, deleteAccount } = useAuth();
  const [tab, setTab] = useState('Overview');
  const [sub, setSub] = useState(null);
  const [scores, setScores] = useState([]);
  const [draws, setDraws] = useState([]);
  const [winners, setWinners] = useState([]);
  const [charity, setCharity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scoreForm, setScoreForm] = useState({ score: '', date: '' });
  const [scoreMsg, setScoreMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/subscriptions').then(r => setSub(r.data)),
      api.get('/api/scores').then(r => setScores(r.data)),
      api.get('/api/draws').then(r => setDraws(r.data.filter(d => d.status === 'published'))),
      api.get('/api/winners/me').then(r => setWinners(r.data)),
    ]).then(() => setLoading(false)).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.charity_id) {
      api.get(`/api/charities/${user.charity_id}`).then(r => setCharity(r.data)).catch(() => {});
    }
  }, [user]);

  const addScore = async (e) => {
    e.preventDefault();
    setScoreMsg('');
    try {
      const { data } = await api.post('/api/scores', { score: Number(scoreForm.score), date: scoreForm.date });
      setScores(prev => [data, ...prev].slice(0, 5));
      setScoreForm({ score: '', date: '' });
      setScoreMsg('Score added!');
    } catch (err) {
      setScoreMsg(err.response?.data?.error || 'Failed to add score');
    }
  };

  if (loading) return <div className="loader-full"><div className="spinner" /></div>;

  const totalWon = winners.filter(w => w.status === 'paid').reduce((s, w) => s + w.prize_amount, 0);
  const subActive = sub?.status === 'active';

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {subActive ? `Subscription active · Renews ${new Date(sub.ends_at).toLocaleDateString('en-GB')}` : 'No active subscription'}
          </p>
        </motion.div>

        {/* Quick stats */}
        <div className="dash-stats" style={{ marginBottom: '32px' }}>
          {[
            { label: 'Subscription', value: subActive ? sub.plan === 'yearly' ? 'Yearly' : 'Monthly' : 'Inactive', color: subActive ? 'var(--emerald)' : '#ef4444', icon: '💳' },
            { label: 'Scores Logged', value: scores.length + '/5', color: 'var(--gold)', icon: '📊' },
            { label: 'Draws Entered', value: draws.length, color: '#8b5cf6', icon: '🎯' },
            { label: 'Total Won', value: `£${totalWon.toFixed(2)}`, color: 'var(--emerald)', icon: '🏆' },
          ].map((s, i) => (
            <motion.div key={i} className="glass dash-stat"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: s.color, fontFamily: 'Outfit' }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '24px', overflowX: 'auto' }}>
          <div className="tabs">
            {TABS.map(t => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <AnimatedTab>
          {/* OVERVIEW */}
          {tab === 'Overview' && (
            <div>
              <div className="grid-2">
                <div className="glass" style={{ padding: '24px' }}>
                  <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>📊 My Latest Scores</h3>
                  {scores.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No scores yet. Add your first one!</p> : (
                    scores.map((s, i) => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{new Date(s.date).toLocaleDateString('en-GB')}</span>
                        <span style={{ fontWeight: '700', color: i === 0 ? 'var(--emerald)' : 'var(--text)', fontSize: '18px' }}>{s.score} pts</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="glass" style={{ padding: '24px' }}>
                  <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>🎯 Recent Draws</h3>
                  {draws.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No draws published yet.</p> : (
                    draws.slice(0, 3).map(d => (
                      <div key={d.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{d.month_year}</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {d.numbers.map(n => (
                            <span key={n} style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)', padding: '2px 10px', borderRadius: '50px', fontSize: '14px', fontWeight: '700' }}>{n}</span>
                          ))}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px' }}>Pool: £{d.prize_pool}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Danger Zone */}
              <div className="glass" style={{ padding: '24px', marginTop: '24px', borderColor: 'rgba(239,68,68,0.2)' }}>
                <h3 style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--red)' }}>Danger Zone</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                  Once you delete your account, there is no going back. Please be certain.
                  All your scores, subscriptions, and winnings will be permanently removed.
                </p>
                <button 
                  className="btn btn-danger" 
                  onClick={() => {
                    if (window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
                      deleteAccount();
                    }
                  }}
                >
                  Delete My Account
                </button>
              </div>
            </div>
          )}

          {/* SCORES */}
          {tab === 'Scores' && (
            <div>
              <div className="glass" style={{ padding: '28px', marginBottom: '24px' }}>
                <h3 style={{ fontWeight: '700', marginBottom: '4px' }}>Add New Score</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                  Stableford format · 1–45 pts. Only latest 5 scores are kept.
                </p>
                {scoreMsg && <div className={`alert ${scoreMsg === 'Score added!' ? 'alert-success' : 'alert-error'}`}>{scoreMsg}</div>}
                <form onSubmit={addScore} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
                    <label className="form-label">Stableford Score</label>
                    <input type="number" min="1" max="45" value={scoreForm.score} onChange={e => setScoreForm(p => ({ ...p, score: e.target.value }))} className="form-input" placeholder="e.g. 32" required />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                    <label className="form-label">Date of Round</label>
                    <input type="date" value={scoreForm.date} onChange={e => setScoreForm(p => ({ ...p, date: e.target.value }))} className="form-input" required />
                  </div>
                  <button type="submit" className="btn btn-primary">Add Score</button>
                </form>
              </div>
              <div className="glass" style={{ padding: '24px' }}>
                <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>My Scores (latest 5)</h3>
                {scores.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No scores yet.</p> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        {['#', 'Date', 'Score', ''].map(h => <th key={h} style={{ padding: '10px 0', textAlign: 'left', color: 'var(--text-muted)', fontSize: '13px' }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {scores.map((s, i) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '14px 0', color: 'var(--text-muted)', fontSize: '14px' }}>#{i + 1}</td>
                          <td style={{ padding: '14px 0' }}>{new Date(s.date).toLocaleDateString('en-GB')}</td>
                          <td style={{ padding: '14px 0' }}>
                            <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--emerald)', fontFamily: 'Outfit' }}>{s.score}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}> pts</span>
                          </td>
                          <td style={{ padding: '14px 0' }}>{i === 0 && <span className="badge badge-emerald">Latest</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* DRAWS */}
          {tab === 'Draws' && (
            <div className="glass" style={{ padding: '24px' }}>
              <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>Past Draws</h3>
              {draws.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No draws published yet.</p> : (
                draws.map(d => (
                  <div key={d.id} style={{ padding: '20px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontWeight: '700' }}>{d.month_year}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Pool: £{d.prize_pool}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {d.numbers.map(n => (
                        <span key={n} style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)', padding: '6px 14px', borderRadius: '50px', fontWeight: '700' }}>{n}</span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* CHARITY */}
          {tab === 'Charity' && (
            <div className="glass" style={{ padding: '32px' }}>
              <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>Your Charity</h3>
              {charity ? (
                <div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '8px' }}>{charity.name}</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{charity.description}</p>
                  <div className="glass" style={{ padding: '20px', display: 'inline-block' }}>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--emerald)', fontFamily: 'Outfit' }}>{user?.charity_percentage}%</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>of your subscription goes to this charity</div>
                  </div>
                  {sub && (
                    <div style={{ marginTop: '16px', color: 'var(--text-muted)' }}>
                      Monthly contribution: <strong style={{ color: 'var(--emerald)' }}>£{(sub.amount * (user.charity_percentage / 100)).toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No charity selected. Update your profile to choose one.</p>
              )}
            </div>
          )}

          {/* WINNINGS */}
          {tab === 'Winnings' && (
            <div className="glass" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontWeight: '700' }}>My Winnings</h3>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--gold)', fontFamily: 'Outfit' }}>Total: £{totalWon.toFixed(2)}</div>
              </div>
              {winners.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No winnings yet. Enter more draws!</p> : (
                winners.map(w => (
                  <div key={w.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: '700' }}>{w.draws?.month_year} · {w.match_type}-Number Match</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{new Date(w.created_at).toLocaleDateString('en-GB')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--gold)', fontFamily: 'Outfit' }}>£{w.prize_amount}</div>
                        <span className={`badge ${w.status === 'paid' ? 'badge-emerald' : w.status === 'rejected' ? 'badge-red' : 'badge-gold'}`}>
                          {w.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </AnimatedTab>
      </div>

      <style>{`
        .dash-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .dash-stat { padding: 24px; text-align: center; }
        @media (max-width: 768px) { .dash-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .dash-stats { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </div>
  );
}

function AnimatedTab({ children }) {
  return (
    <motion.div key={children?.props?.children?.toString?.() ?? Math.random()}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      {children}
    </motion.div>
  );
}
