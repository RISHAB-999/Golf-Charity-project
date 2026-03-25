import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Winners() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState('');

  const load = () => api.get('/api/winners').then(r => setWinners(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const verify = async (id, status) => {
    try {
      await api.put(`/api/winners/${id}/verify`, { status });
      setMsg(`Winner ${status}!`);
      load();
    } catch (err) { setMsg(err.response?.data?.error || 'Error'); }
  };

  const markPaid = async (id) => {
    try {
      await api.put(`/api/winners/${id}/payout`);
      setMsg('Marked as paid!');
      load();
    } catch (err) { setMsg(err.response?.data?.error || 'Error'); }
  };

  const filtered = filter === 'all' ? winners : winners.filter(w => w.status === filter);

  const statusBadge = (s) => ({
    pending: 'badge-gold', verified: 'badge-green', rejected: 'badge-red', paid: 'badge-green'
  }[s] || 'badge-gray');

  const matchColor = (m) => ({ 3: '#8b5cf6', 4: '#10b981', 5: '#f59e0b' }[m] || 'var(--text)');

  if (loading) return <div className="loader-full" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  return (
    <div>
      <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}><span className="gradient-text">Winners</span> Management</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>{winners.length} total winners</p>

      {msg && <div className="alert alert-success">{msg}</div>}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['all', 'pending', 'verified', 'rejected', 'paid'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: filter === f ? 'var(--emerald)' : 'var(--surface)', color: filter === f ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      <div className="glass" style={{ overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr><th>Winner</th><th>Draw</th><th>Match</th><th>Prize</th><th>Status</th><th>Proof</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No winners found.</td></tr>
            ) : filtered.map(w => (
              <tr key={w.id}>
                <td>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{w.users?.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{w.users?.email}</div>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{w.draws?.month_year}</td>
                <td>
                  <span style={{ fontWeight: '700', color: matchColor(w.match_type), fontSize: '16px' }}>{w.match_type} ✓</span>
                </td>
                <td style={{ fontWeight: '700', color: 'var(--gold)', fontSize: '16px' }}>£{w.prize_amount}</td>
                <td><span className={`badge ${statusBadge(w.status)}`}>{w.status}</span></td>
                <td>
                  {w.proof_url
                    ? <a href={`${import.meta.env.VITE_API_URL}/${w.proof_url}`} target="_blank" rel="noreferrer" style={{ color: 'var(--emerald)', fontSize: '13px', textDecoration: 'none' }}>View Proof</a>
                    : <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>None</span>
                  }
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {w.status === 'pending' && (
                      <>
                        <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => verify(w.id, 'verified')}>✓ Approve</button>
                        <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => verify(w.id, 'rejected')}>✗ Reject</button>
                      </>
                    )}
                    {w.status === 'verified' && (
                      <button className="btn btn-gold" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => markPaid(w.id)}>💰 Mark Paid</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
