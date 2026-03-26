import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Draws() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simLoading, setSimLoading] = useState(false);
  const [pubLoading, setPubLoading] = useState(null);
  const [msg, setMsg] = useState('');
  const [config, setConfig] = useState({
    draw_type: 'random',
    month_year: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  });

  const loadDraws = () => api.get('/api/draws/admin/all').then(r => setDraws(r.data)).finally(() => setLoading(false));
  useEffect(() => { loadDraws(); }, []);

  const simulate = async () => {
    setSimLoading(true); setMsg('');
    try {
      const { data } = await api.post('/api/draws/simulate', config);
      setMsg(`✅ Simulation complete! Numbers: ${data.numbers.join(' · ')} · Prize Pool: £${data.prize_pool}`);
      loadDraws();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Simulation failed'));
    } finally { setSimLoading(false); }
  };

  const publish = async (id) => {
    setPubLoading(id); setMsg('');
    try {
      const { data } = await api.post('/api/draws/publish', { draw_id: id });
      const w = data.winners;
      setMsg(`✅ Draw published! Winners: ${w[5]?.length || 0} jackpot, ${w[4]?.length || 0} major, ${w[3]?.length || 0} prize`);
      loadDraws();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Publish failed'));
    } finally { setPubLoading(null); }
  };

  const statusBadge = (s) => ({ draft: 'badge-gray', simulated: 'badge-gold', published: 'badge-green' }[s] || 'badge-gray');

  if (loading) return <div className="loader-full" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  return (
    <div>
      <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}><span className="gradient-text">Draw</span> Management</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '28px' }}>Configure, simulate and publish monthly draws.</p>

      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

      {/* Simulation config */}
      <div className="glass" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>🎲 Run Draw Simulation</h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Draw Type</label>
            <select className="form-input" value={config.draw_type} onChange={e => setConfig(p => ({ ...p, draw_type: e.target.value }))}>
              <option value="random">Random (Lottery)</option>
              <option value="algorithm">Algorithm (Score-Weighted)</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Month / Year</label>
            <input className="form-input" value={config.month_year} onChange={e => setConfig(p => ({ ...p, month_year: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={simulate} disabled={simLoading}>
            {simLoading ? 'Simulating...' : '▶ Run Simulation'}
          </button>
        </div>
        {config.draw_type === 'algorithm' && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '8px', padding: '10px 14px' }}>
            ⚡ Algorithm mode weighs numbers by how frequently subscribers score them.
          </div>
        )}
      </div>

      {/* Draws table */}
      <div className="glass" style={{ overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr><th>Month</th><th>Numbers</th><th>Type</th><th>Prize Pool</th><th>Jackpot</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {draws.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No draws yet.</td></tr>
            ) : draws.map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: '600' }}>{d.month_year}</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {d.numbers.map(n => (
                      <span key={n} style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--emerald)', padding: '2px 8px', borderRadius: '50px', fontSize: '13px', fontWeight: '700' }}>{n}</span>
                    ))}
                  </div>
                </td>
                <td><span className="badge badge-gray">{d.draw_type}</span></td>
                <td style={{ color: 'var(--emerald)' }}>£{d.prize_pool}</td>
                <td style={{ color: 'var(--gold)' }}>£{d.jackpot_amount}</td>
                <td><span className={`badge ${statusBadge(d.status)}`}>{d.status}</span></td>
                <td>
                  {d.status === 'simulated' && (
                    <button className="btn btn-gold" style={{ padding: '6px 12px', fontSize: '13px' }}
                      onClick={() => publish(d.id)} disabled={pubLoading === d.id}>
                      {pubLoading === d.id ? '...' : '📢 Publish'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
