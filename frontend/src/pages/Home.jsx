import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from '../api/axios';

const steps = [
  { icon: '🏌️', title: 'Subscribe', desc: 'Choose a monthly or yearly plan and select your charity.' },
  { icon: '📊', title: 'Log Your Scores', desc: 'Enter your Stableford scores after each round — up to 5 at a time.' },
  { icon: '🎯', title: 'Enter the Draw', desc: 'Your scores enter the monthly prize draw automatically.' },
  { icon: '❤️', title: 'Give to Charity', desc: 'A portion of your subscription goes directly to your chosen cause.' },
];

const stats = [
  { value: '£40K+', label: 'Prize Pool This Month' },
  { value: '3,200+', label: 'Active Members' },
  { value: '12', label: 'Charity Partners' },
  { value: '£120K+', label: 'Donated to Charities' },
];

export default function Home() {
  const [drawNumbers, setDrawNumbers] = useState('7 · 14 · 23 · 31 · 38');
  const [prizePool, setPrizePool] = useState('£40,250');
  const [charityFund, setCharityFund] = useState('£12,890');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrawData = async () => {
      try {
        const response = await axios.get('/api/draws');
        console.log('✅ Draw API Response:', response.data);
        if (response.data && response.data.length > 0) {
          const latestDraw = response.data[0];
          console.log('🎯 Latest Draw Object:', latestDraw);
          console.log('📊 Numbers:', latestDraw.numbers);
          console.log('💰 Prize Pool:', latestDraw.prize_pool);
          console.log('🎰 Jackpot:', latestDraw.jackpot_amount);
          
          if (latestDraw.numbers && Array.isArray(latestDraw.numbers)) {
            const nums = latestDraw.numbers.join(' · ');
            console.log('✨ Setting draw numbers to:', nums);
            setDrawNumbers(nums);
          }
          if (latestDraw.prize_pool) {
            const totalPool = (latestDraw.jackpot_amount || 0) + (latestDraw.prize_pool * 0.35) + (latestDraw.prize_pool * 0.25);
            console.log('💎 Setting prize pool to:', totalPool);
            setPrizePool(`£${Math.floor(totalPool).toLocaleString()}`);
          }
        } else {
          console.log('⚠️ No published draws found');
        }
        setLoading(false);
      } catch (error) {
        console.error('❌ Draw fetch error:', error);
        console.error('Details:', error.response?.data || error.message);
        setLoading(false);
      }
    };
    
    fetchDrawData();
    
    const interval = setInterval(fetchDrawData, 10000); // 10 seconds for faster testing
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ paddingTop: '80px' }}>

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-bg" />
        <div className="container">
          <motion.div className="hero-content"
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
            <div className="section-tag">⚡ Monthly Draws · Charity Impact · Real Prizes</div>
            <h1 className="hero-title">
              Golf with <span className="gradient-text">Purpose.</span>
              <br />Win with <span className="gradient-text">Heart.</span>
            </h1>
            <p className="hero-subtitle">
              The first subscription golf platform that turns your game into a force for good.
              Log scores, enter draws, win big — while supporting the charities that matter to you.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary" style={{ fontSize: '17px', padding: '16px 36px' }}>
                Start Playing for Good →
              </Link>
              <Link to="/charities" className="btn btn-outline" style={{ fontSize: '17px', padding: '16px 36px' }}>
                Explore Charities
              </Link>
            </div>
          </motion.div>

          {/* 3D floating cards */}
          <div className="hero-cards">
            {[
              { label: 'Draw Numbers', value: drawNumbers, color: 'var(--emerald)' },
              { label: 'Prize Pool', value: prizePool, color: 'var(--gold)' },
              { label: 'Charity Fund', value: charityFund, color: '#8b5cf6' },
            ].map((card, i) => (
              <motion.div key={i} className="glass hero-card"
                initial={{ opacity: 0, y: 60, rotateX: 15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.05 + i * 0.03, duration: 0.25, ease: "easeOut" }}
                whileHover={{ y: -10, rotateY: 5, transition: { duration: 0.08, ease: "easeOut" } }}
                style={{ '--card-color': card.color }}>
                <div className="hero-card-label">{card.label}</div>
                <div className="hero-card-value" style={{ color: card.color }}>{card.value}</div>
                <div className="hero-card-glow" style={{ background: card.color }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────── */}
      <section style={{ padding: '48px 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="stats-grid">
            {stats.map((s, i) => (
              <motion.div key={i} className="stat-item"
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }} viewport={{ once: true }}>
                <div className="stat-value gradient-text">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────── */}
      <section className="section">
        <div className="container text-center">
          <div className="section-tag" style={{ margin: '0 auto 16px' }}>How It Works</div>
          <h2 className="section-title">Simple. Rewarding. <span className="gradient-text">Impactful.</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto 48px' }}>
            Four steps to transform your round of golf into something that matters.
          </p>
          <div className="grid-2" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {steps.map((step, i) => (
              <motion.div key={i} className="glass step-card"
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }} viewport={{ once: true }}
                whileHover={{ y: -6, transition: { duration: 0.15, ease: "easeOut" } }}>
                <div className="step-icon">{step.icon}</div>
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>{step.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Prize Pool Visual ──────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg2)' }}>
        <div className="container text-center">
          <div className="section-tag" style={{ margin: '0 auto 16px' }}>Prize Structure</div>
          <h2 className="section-title">Monthly Draw <span className="gradient-text">Prizes</span></h2>
          <p className="section-subtitle" style={{ margin: '0 auto 48px' }}>
            Three tiers of winners every month. The jackpot rolls over if unclaimed.
          </p>
          <div className="grid-3" style={{ maxWidth: '900px', margin: '0 auto' }}>
            {[
              { match: '5 Numbers', share: '40%', label: 'Jackpot', badge: '🏆', rollover: true, color: '#f59e0b' },
              { match: '4 Numbers', share: '35%', label: 'Major Prize', badge: '🥇', rollover: false, color: '#10b981' },
              { match: '3 Numbers', share: '25%', label: 'Prize', badge: '🥈', rollover: false, color: '#8b5cf6' },
            ].map((tier, i) => (
              <motion.div key={i} className="glass prize-tier"
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.35, ease: "easeOut" }} viewport={{ once: true }}
                whileHover={{ scale: 1.02, transition: { duration: 0.12, ease: "easeOut" } }}
                style={{ borderColor: tier.color + '40' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>{tier.badge}</div>
                <div style={{ color: tier.color, fontSize: '32px', fontWeight: '800', fontFamily: 'Outfit' }}>{tier.share}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>of prize pool</div>
                <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{tier.match}</h3>
                <div className="badge badge-emerald" style={{ marginTop: '8px' }}>{tier.label}</div>
                {tier.rollover && <div style={{ fontSize: '12px', color: 'var(--gold)', marginTop: '8px' }}>🔄 Jackpot rolls over if unclaimed</div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Charity ──────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="featured-charity glass">
            <div className="featured-content">
              <div className="section-tag">⭐ Featured Charity</div>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: '12px 0' }}>Hearts United</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.7', marginBottom: '24px' }}>
                Supporting heart disease research and patient care across the UK.
                Every subscription contributes directly to life-saving research — because your golf game can do more than entertain.
              </p>
              <Link to="/charities" className="btn btn-primary">Explore All Charities →</Link>
            </div>
            <div className="featured-visual">
              <div className="charity-heart">❤️</div>
              <div className="charity-stat">
                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--emerald)' }}>£12,890</div>
                <div style={{ color: 'var(--text-muted)' }}>raised this month</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg2)' }}>
        <div className="container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, ease: "easeOut" }}>
            <h2 className="section-title">Ready to <span className="gradient-text">Play for Good?</span></h2>
            <p className="section-subtitle" style={{ margin: '0 auto 36px' }}>
              Join thousands of golfers already making an impact.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '17px' }}>
                Get Started — From £9.99/mo
              </Link>
              <Link to="/pricing" className="btn btn-outline" style={{ padding: '16px 40px', fontSize: '17px' }}>
                View Plans
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <style>{`
        .hero-section { min-height: 90vh; display: flex; align-items: center; position: relative; overflow: hidden; }
        .hero-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.15), transparent), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(245,158,11,0.08), transparent); pointer-events: none; }
        .hero-content { max-width: 700px; }
        .hero-title { font-size: clamp(2.8rem, 6vw, 5rem); font-weight: 900; line-height: 1.1; margin: 16px 0 24px; }
        .hero-subtitle { font-size: 19px; color: var(--text-muted); line-height: 1.7; margin-bottom: 36px; max-width: 560px; }
        .hero-cta { display: flex; gap: 16px; flex-wrap: wrap; }
        .hero-cards { display: flex; flex-direction: column; gap: 16px; position: absolute; right: 48px; top: 50%; transform: translateY(-50%); perspective: 1000px; }
        .hero-card { padding: 20px 24px; min-width: 220px; position: relative; overflow: hidden; cursor: default; }
        .hero-card-label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .hero-card-value { font-size: 22px; font-weight: 800; font-family: 'Outfit', sans-serif; }
        .hero-card-glow { position: absolute; bottom: -20px; right: -20px; width: 80px; height: 80px; border-radius: 50%; filter: blur(30px); opacity: 0.3; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; text-align: center; }
        .stat-value { font-size: 3rem; font-weight: 900; font-family: 'Outfit', sans-serif; }
        .stat-label { color: var(--text-muted); font-size: 15px; margin-top: 4px; }
        .step-card { padding: 32px; text-align: left; }
        .step-icon { font-size: 36px; margin-bottom: 16px; }
        .prize-tier { padding: 32px 24px; text-align: center; }
        .featured-charity { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; padding: 48px; align-items: center; }
        .featured-content { }
        .featured-visual { display: flex; flex-direction: column; align-items: center; gap: 24px; }
        .charity-heart { font-size: 80px; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        .charity-stat { text-align: center; }
        @media (max-width: 1024px) { .hero-cards { display: none; } }
        @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .featured-charity { grid-template-columns: 1fr; } }
        @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr 1fr; } .stat-value { font-size: 2rem; } }
      `}</style>
    </div>
  );
}
