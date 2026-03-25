import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function AdminCharities() {
  const [charities, setCharities] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', image_url: '', featured: false });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => api.get('/api/charities').then(r => setCharities(r.data));
  useEffect(() => { load(); }, []);

  const handle = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [e.target.name]: val }));
  };

  const submit = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      if (editing) {
        await api.put(`/api/charities/${editing.id}`, form);
        setMsg('Charity updated!');
      } else {
        await api.post('/api/charities', form);
        setMsg('Charity created!');
      }
      setForm({ name: '', description: '', image_url: '', featured: false });
      setEditing(null); setShowForm(false);
      load();
    } catch (err) { setMsg(err.response?.data?.error || 'Error'); }
  };

  const doEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || '', image_url: c.image_url || '', featured: c.featured || false }); setShowForm(true); };

  const doDelete = async (id) => {
    if (!confirm('Delete this charity?')) return;
    try { await api.delete(`/api/charities/${id}`); setMsg('Deleted.'); load(); }
    catch (err) { setMsg(err.response?.data?.error || 'Delete failed'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '4px' }}><span className="gradient-text">Charities</span></h1>
          <p style={{ color: 'var(--text-muted)' }}>{charities.length} charities listed</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', description: '', image_url: '', featured: false }); setShowForm(true); }}>
          + Add Charity
        </button>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {showForm && (
        <div className="glass" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>{editing ? 'Edit Charity' : 'New Charity'}</h3>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input name="name" value={form.name} onChange={handle} className="form-input" placeholder="Charity name" required />
            <textarea name="description" value={form.description} onChange={handle} className="form-input" placeholder="Description" rows={3} style={{ resize: 'vertical' }} />
            <input name="image_url" value={form.image_url} onChange={handle} className="form-input" placeholder="Image URL (optional)" />
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
              <input type="checkbox" name="featured" checked={form.featured} onChange={handle} style={{ accentColor: 'var(--gold)' }} />
              Mark as Featured Charity
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Create Charity'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass" style={{ overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Description</th><th>Featured</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {charities.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No charities. Add one above.</td></tr>
            ) : charities.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: '600' }}>{c.name}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '300px' }}>{c.description?.substring(0, 80)}...</td>
                <td>{c.featured ? <span className="badge badge-gold">⭐ Featured</span> : <span className="badge badge-gray">No</span>}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: '13px' }} onClick={() => doEdit(c)}>Edit</button>
                    <button className="btn btn-danger" style={{ padding: '5px 12px', fontSize: '13px' }} onClick={() => doDelete(c.id)}>Delete</button>
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
