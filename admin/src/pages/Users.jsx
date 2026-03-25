import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { api.get('/api/admin/users').then(r => setUsers(r.data)).finally(() => setLoading(false)); }, []);

  const saveEdit = async () => {
    try {
      const { data } = await api.put(`/api/admin/users/${editing.id}`, {
        name: editing.name, email: editing.email, role: editing.role, charity_percentage: editing.charity_percentage
      });
      setUsers(prev => prev.map(u => u.id === data.id ? { ...u, ...data } : u));
      setEditing(null);
      setMsg('User updated!');
    } catch (err) { setMsg(err.response?.data?.error || 'Update failed'); }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}? This will also delete their subscriptions, scores, and winnings.`)) return;
    try {
      await api.delete(`/api/admin/users/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setMsg('User deleted!');
    } catch (err) { setMsg(err.response?.data?.error || 'Delete failed'); }
  };

  const subStatus = (u) => {
    // Find an active one first, otherwise the most recent one
    const s = u.subscriptions?.find(sub => sub.status === 'active') || 
              (u.subscriptions?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]);
    if (!s) return <span className="badge badge-gray">No plan</span>;
    return <span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-red'}`}>{s.plan} · {s.status}</span>;
  };

  if (loading) return <div className="loader-full" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  return (
    <div>
      <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}><span className="gradient-text">User</span> Management</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '28px' }}>{users.length} total users</p>

      {msg && <div className="alert alert-success" style={{ marginBottom: '16px' }}>{msg}</div>}

      {/* Edit modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '440px', padding: '28px' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '20px' }}>Edit User</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Name</label>
                <input className="form-input" value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email</label>
                <input className="form-input" value={editing.email} onChange={e => setEditing(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Role</label>
                <select className="form-input" value={editing.role} onChange={e => setEditing(p => ({ ...p, role: e.target.value }))}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Charity %</label>
                <input type="number" min="10" max="100" className="form-input" value={editing.charity_percentage} onChange={e => setEditing(p => ({ ...p, charity_percentage: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-ghost" onClick={() => setEditing(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit} style={{ flex: 1 }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <div className="glass" style={{ overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Subscription</th><th>Charity %</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: '600' }}>{u.name}</td>
                <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'badge-gold' : 'badge-gray'}`}>{u.role}</span></td>
                <td>{subStatus(u)}</td>
                <td style={{ color: 'var(--emerald)' }}>{u.charity_percentage}%</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => setEditing({ ...u })}>Edit</button>
                    {u.role !== 'admin' && (
                      <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--red)' }} onClick={() => deleteUser(u)}>Delete</button>
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
