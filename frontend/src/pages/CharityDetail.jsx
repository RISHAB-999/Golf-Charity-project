import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';

export default function CharityDetail() {
  const { id } = useParams();
  const [charity, setCharity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/charities/${id}`).then(r => setCharity(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loader-full"><div className="spinner" /></div>;
  if (!charity) return <div className="container" style={{ paddingTop: '120px', textAlign: 'center' }}>Charity not found.</div>;

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px', maxWidth: '800px' }}>
        <Link to="/charities" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '32px' }}>
          ← Back to Charities
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass" style={{ padding: '40px', marginBottom: '24px', borderColor: 'rgba(16,185,129,0.2)' }}>
            {charity.featured && <div className="badge badge-gold" style={{ marginBottom: '16px' }}>⭐ Featured Charity</div>}
            <h1 style={{ fontSize: '2.4rem', fontWeight: '900', marginBottom: '16px' }}>{charity.name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '17px', lineHeight: '1.8', marginBottom: '28px' }}>
              {charity.description || 'This charity does incredible work supporting communities across the UK.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary">Support This Charity →</Link>
              <a href="#events" className="btn btn-outline">View Events</a>
            </div>
          </div>

          {/* Impact stats placeholder */}
          <div className="grid-3" style={{ marginBottom: '24px' }}>
            {[
              { value: '£12.8K', label: 'Raised This Month' },
              { value: '340+', label: 'Supporters' },
              { value: '10%+', label: 'Avg Contribution' },
            ].map((stat, i) => (
              <div key={i} className="glass" style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--emerald)', fontFamily: 'Outfit' }}>{stat.value}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Events */}
          {charity.events && charity.events.length > 0 && (
            <div className="glass" style={{ padding: '28px' }} id="events">
              <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>🏌️ Upcoming Golf Events</h3>
              {charity.events.map((ev, i) => (
                <div key={i} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: '600' }}>{ev.name || `Event ${i + 1}`}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{ev.date || ''} · {ev.location || ''}</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
