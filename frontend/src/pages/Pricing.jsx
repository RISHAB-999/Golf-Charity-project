import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const plans = [
  {
    id: 'monthly', label: 'Monthly', price: '£9.99', period: '/month',
    features: ['Monthly prize draw entry', 'Charity contribution (min 10%)', '5-score rolling tracker', 'Winner verification', 'Community access'],
    cta: 'Start Monthly Plan', color: 'var(--emerald)', primary: false,
  },
  {
    id: 'yearly', label: 'Yearly', price: '£99.99', period: '/year', badge: 'Best Value — Save 17%',
    features: ['Everything in Monthly', '2 free months included', 'Priority prize pool tier', '12× draw entries', 'Exclusive charity events'],
    cta: 'Start Yearly Plan', color: 'var(--gold)', primary: true,
  },
];

export default function Pricing() {
  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
        <motion.div className="text-center" style={{ marginBottom: '56px' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="section-tag" style={{ margin: '0 auto 16px' }}>Simple Pricing</div>
          <h1 className="section-title">Play. <span className="gradient-text">Give. Win.</span></h1>
          <p className="section-subtitle" style={{ margin: '16px auto' }}>
            One platform. Two plans. Unlimited impact.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', maxWidth: '760px', margin: '0 auto 60px' }}>
          {plans.map((plan, i) => (
            <motion.div key={plan.id} className="glass pricing-card"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
              whileHover={{ y: -6 }}
              style={{ padding: '40px 32px', border: plan.primary ? `2px solid ${plan.color}` : '', position: 'relative' }}>
              {plan.badge && (
                <div className="badge badge-gold" style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '13px', padding: '6px 16px' }}>
                  {plan.badge}
                </div>
              )}
              <div style={{ marginBottom: '8px', color: plan.color, fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>{plan.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                <span style={{ fontSize: '3rem', fontWeight: '900', fontFamily: 'Outfit', color: plan.primary ? plan.color : 'var(--text)' }}>{plan.price}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px' }}>
                    <span style={{ color: plan.color, fontSize: '16px', fontWeight: '700' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to={`/register?plan=${plan.id}`} className={`btn btn-full ${plan.primary ? 'btn-gold' : 'btn-primary'}`}
                style={{ background: plan.primary ? `linear-gradient(135deg, ${plan.color}, #d97706)` : undefined }}>
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* FAQ / info */}
        <motion.div className="glass" style={{ padding: '36px', maxWidth: '760px', margin: '0 auto' }}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h3 style={{ fontWeight: '700', marginBottom: '20px', fontSize: '20px' }}>Frequently Asked</h3>
          {[
            { q: 'What is Stableford format?', a: 'Stableford is a golf scoring system where you score points per hole rather than counting total strokes. Typical round scores range from 1–45 points.' },
            { q: 'How does the charity contribution work?', a: 'At signup you select a charity. Minimum 10% of your subscription fee goes to it. You can increase this to 100% if you wish.' },
            { q: 'When are draws held?', a: 'Draws happen once per month. Results are published by the admin and you\'ll be notified if you\'re a winner.' },
            { q: 'What happens to the jackpot if nobody wins?', a: 'The 5-Number Match jackpot rolls over to the next month, growing until someone matches all 5 numbers.' },
          ].map((faq, i) => (
            <div key={i} style={{ padding: '16px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontWeight: '600', marginBottom: '6px' }}>{faq.q}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>{faq.a}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
