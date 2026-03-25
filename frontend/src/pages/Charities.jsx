import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';

export default function Charities() {
  const [charities, setCharities] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/charities${search ? `?search=${search}` : ''}`)
      .then(r => setCharities(r.data)).finally(() => setLoading(false));
  }, [search]);

  const icons = ['❤️', '🌱', '🍎', '🏥', '🎓', '🌍'];

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
        <motion.div className="text-center" style={{ marginBottom: '48px' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="section-tag" style={{ margin: '0 auto 16px' }}>Make an Impact</div>
          <h1 className="section-title">Our <span className="gradient-text">Charity Partners</span></h1>
          <p className="section-subtitle" style={{ margin: '16px auto 32px' }}>
            Every subscription contributes directly to one of these incredible causes.
          </p>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            className="form-input" placeholder="🔍 Search charities..."
            style={{ maxWidth: '400px', width: '100%', borderRadius: '50px', textAlign: 'center' }}
          />
        </motion.div>

        {loading ? (
          <div className="loader-full" style={{ minHeight: '300px' }}><div className="spinner" /></div>
        ) : charities.length === 0 ? (
          <div className="text-center" style={{ color: 'var(--text-muted)', padding: '60px 0' }}>No charities found.</div>
        ) : (
          <div className="grid-3">
            {charities.map((c, i) => (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Link to={`/charities/${c.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                  <div className="glass charity-card" style={{ padding: '32px', height: '100%' }}>
                    {c.featured && <div className="badge badge-gold" style={{ marginBottom: '16px' }}>⭐ Featured</div>}
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icons[i % icons.length]}</div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', color: 'var(--text)' }}>{c.name}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                      {c.description || 'Supporting a great cause.'}
                    </p>
                    <div style={{ color: 'var(--emerald)', fontWeight: '600', fontSize: '14px' }}>
                      Learn more →
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <style>{`.charity-card { transition: var(--transition); } .charity-card:hover { transform: translateY(-6px); border-color: var(--emerald); }`}</style>
    </div>
  );
}
