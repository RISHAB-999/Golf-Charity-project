import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const TABS = [
  { id: 'card', icon: '💳', label: 'Credit Card' },
  { id: 'razorpay', icon: '⚡', label: 'Razorpay' },
  { id: 'upi', icon: '📱', label: 'UPI / QR' },
];

export default function Checkout() {
  const { user, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('card');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sub, setSub] = useState(null);

  // Card form state
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', name: '' });

  useEffect(() => {
    // Fetch pending sub to get amount
    api.get('/api/subscriptions').then(r => setSub(r.data)).catch(() => { });

    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePay = async (e) => {
    e?.preventDefault();
    setLoading(true);

    try {
      // ✅ STEP 1: CREATE SUBSCRIPTION FIRST
      await api.post('/api/subscriptions/create', {
        plan: sub?.plan || 'monthly',
      });

      // ✅ STEP 2: THEN CALL CHECKOUT
      const { data } = await api.post('/api/subscriptions/checkout');

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "GolfGive",
        description: "Subscription Payment",
        order_id: data.order_id,

        handler: async function (response) {
          console.log("💚 PAYMENT SUCCESS HANDLER CALLED");
          console.log("Response:", response);
          
          try {
            console.log("🔄 Verifying payment...");
            const res = await api.post('/api/subscriptions/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              sub_id: data.sub.id
            });

            console.log("✅ VERIFY RESPONSE:", res.data);

            if (res.data.status === 'success') {
              console.log("✨ Setting success state...");
              setSuccess(true);
              setTimeout(() => {
                console.log("🎯 Navigating to dashboard...");
                navigate('/dashboard');
              }, 2000);
            } else {
              console.error("❌ Unexpected response status:", res.data.status);
              alert('Payment verification failed. Status: ' + res.data.status);
            }
          } catch (err) {
            console.error("❌ VERIFICATION ERROR:", err);
            alert(err.response?.data?.error || 'Payment verification failed: ' + err.message);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#10b981"
        }
      };

      console.log("📦 Creating Razorpay instance...");
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
        console.error("❌ RAZORPAY PAYMENT FAILED:", response);
        alert('Payment Failed: ' + response.error.description);
      });
      
      rzp.on('payment.success', function (response) {
        console.log("✅ RAZORPAY SUCCESS EVENT:", response);
      });
      
      console.log("🚀 Opening Razorpay modal...");
      rzp.open();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to initialize payment.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '100vh' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass" style={{ padding: '60px 40px', maxWidth: '400px', width: '100%' }}>
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
            style={{ width: '80px', height: '80px', background: 'var(--emerald)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', color: '#fff', margin: '0 auto 24px' }}>
            ✓
          </motion.div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Payment Successful!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Your subscription is now active.</p>
          <div className="spinner" style={{ margin: '0 auto', width: '24px', height: '24px' }} />
          <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '16px' }}>Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', paddingTop: '80px', paddingBottom: '60px' }}>
      <div className="auth-bg" />

      <div style={{ display: 'flex', gap: '32px', maxWidth: '900px', width: '100%', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>

        {/* Left Side: Summary */}
        <motion.div className="glass" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          style={{ flex: '1 1 300px', padding: '40px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '24px' }}>Order Summary</h2>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: '600' }}>GolfGive {sub?.plan === 'yearly' ? 'Yearly' : 'Monthly'} Plan</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Includes {user?.charity_percentage}% charity contribution</div>
              </div>
              <div style={{ fontWeight: '700' }}>£{sub?.amount || '9.99'}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>
              <span>Subtotal</span>
              <span>£{sub?.amount || '9.99'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              <span>Tax</span>
              <span>£0.00</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>Total Due</span>
              <span style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Outfit', color: 'var(--emerald)' }}>£{sub?.amount || '9.99'}</span>
            </div>
          </div>

          <div style={{ marginTop: '32px', fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center' }}>
            🔒 Secured by 256-bit SSL encryption
          </div>
        </motion.div>

        {/* Right Side: Payment Form */}
        <motion.div className="glass" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          style={{ flex: '2 1 400px', padding: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '24px' }}>Payment Method</h2>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '4px' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', border: '2px solid',
                  borderColor: tab === t.id ? 'var(--emerald)' : 'var(--border)',
                  background: tab === t.id ? 'rgba(16,185,129,0.05)' : 'var(--surface)',
                  color: tab === t.id ? 'var(--emerald)' : 'var(--text)',
                  cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontWeight: '600'
                }}>
                <span style={{ fontSize: '24px' }}>{t.icon}</span>
                <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>{t.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* CREDIT CARD */}
            {tab === 'card' && (
              <motion.form key="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handlePay}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Name on Card</label>
                    <input className="form-input" placeholder="e.g. John Doe" required value={card.name} onChange={e => setCard({ ...card, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <div style={{ position: 'relative' }}>
                      <input className="form-input" placeholder="0000 0000 0000 0000" required maxLength="19"
                        value={card.number} onChange={e => {
                          let val = e.target.value.replace(/\D/g, '');
                          val = val.replace(/(.{4})/g, '$1 ').trim();
                          setCard({ ...card, number: val });
                        }}
                        style={{ paddingLeft: '40px', letterSpacing: '1px', fontFamily: 'monospace', fontSize: '16px' }} />
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>💳</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Expiry (MM/YY)</label>
                      <input className="form-input" placeholder="MM/YY" required maxLength="5" value={card.expiry} onChange={e => setCard({ ...card, expiry: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">CVC</label>
                      <input className="form-input" placeholder="123" required maxLength="4" type="password" value={card.cvc} onChange={e => setCard({ ...card, cvc: e.target.value })} />
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '32px', padding: '14px', fontSize: '16px' }} disabled={loading}>
                  {loading ? 'Processing...' : `Pay £${sub?.amount || '9.99'}`}
                </button>
              </motion.form>
            )}

            {/* RAZORPAY (Replacing PayPal tab) */}
            {tab === 'razorpay' && (
              <motion.div key="razorpay" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '40px 20px', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                  <div style={{ fontSize: '30px', fontWeight: '900', color: '#10b981', marginBottom: '16px', fontFamily: 'Outfit' }}>⚡ Razorpay</div>
                  <p style={{ marginBottom: '24px', color: '#64748b', fontSize: '14px' }}>Pay securely using UPI, Cards, NetBanking, and Wallets through Razorpay.</p>
                  <button onClick={handlePay} disabled={loading} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '50px', padding: '14px 32px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', width: '100%', maxWidth: '300px', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}>
                    {loading ? 'Connecting...' : 'Pay with Razorpay'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* UPI */}
            {tab === 'upi' && (
              <motion.div key="upi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>Scan the QR code with any UPI app (GPay, PhonePe, Paytm)</p>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', display: 'inline-block', marginBottom: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                  {/* Fake QR Code made with CSS blocks for demo purposes */}
                  <div style={{ width: '200px', height: '200px', background: `repeating-linear-gradient(45deg, #000 0, #000 10px, #fff 10px, #fff 20px), repeating-linear-gradient(-45deg, #000 0, #000 10px, #fff 10px, #fff 20px)`, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: '60px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: 'var(--emerald)', fontSize: '24px' }}>UPI</div>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '40px', height: '40px', border: '6px solid #000', background: '#fff' }}><div style={{ margin: '6px', width: '16px', height: '16px', background: '#000' }} /></div>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', border: '6px solid #000', background: '#fff' }}><div style={{ margin: '6px', width: '16px', height: '16px', background: '#000' }} /></div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '40px', height: '40px', border: '6px solid #000', background: '#fff' }}><div style={{ margin: '6px', width: '16px', height: '16px', background: '#000' }} /></div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>Or enter UPI ID</div>
                  <div style={{ display: 'flex', gap: '8px', maxWidth: '300px', margin: '0 auto' }}>
                    <input className="form-input" placeholder="name@upi" />
                    <button className="btn btn-primary" onClick={handlePay} disabled={loading}>{loading ? '...' : 'Verify'}</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </div>
  );
}
