const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const emailService = require('../services/emailService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// Get current user's active subscription
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json(data || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Create new subscription, cancel previous active subscription
router.post('/create', auth, async (req, res) => {
  const { plan } = req.body;

  if (!['monthly', 'yearly'].includes(plan)) {
    return res.status(400).json({ error: 'Plan must be monthly or yearly' });
  }

  try {
    // Cancel old active subscription
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', req.user.id)
      .eq('status', 'active');

    const amount = plan === 'yearly' ? 99.99 : 9.99;

    const ends_at = new Date();
    if (plan === 'yearly') {
      ends_at.setFullYear(ends_at.getFullYear() + 1);
    } else {
      ends_at.setMonth(ends_at.getMonth() + 1);
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: req.user.id,
        plan,
        status: 'active', // ✅ important
        amount,
        ends_at: ends_at.toISOString(),
      })
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────
// CHECKOUT (Razorpay Order)
// Create Razorpay order for payment
router.post('/checkout', auth, async (req, res) => {
  try {
    const { data: sub, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !sub) {
      return res.status(404).json({
        error: 'No active subscription found',
      });
    }

    const amountInPaise = Math.round(sub.amount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${sub.id.substring(0, 10)}`,
    });

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      sub,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify Razorpay payment signature and activate subscription
// ─────────────────────────────────────────────
router.post('/verify', auth, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    sub_id,
  } = req.body;

  try {
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    console.log("EXPECTED:", generatedSignature);
    console.log("RECEIVED:", razorpay_signature);

    if (generatedSignature !== razorpay_signature) {
      console.log("❌ Signature mismatch");
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Activate subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('id', sub_id)
      .select('*')
      .single();

    if (error) throw error;

    // ✅ SEND SUBSCRIPTION CONFIRMATION EMAIL
    try {
      const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
      let charityName = 'Designated Charity';
      
      if (user?.charity_id) {
        const { data: charity } = await supabase.from('charities').select('name').eq('id', user.charity_id).single();
        charityName = charity?.name || 'Designated Charity';
      }

      await emailService.sendSubscriptionConfirmation(
        user,
        data.plan,
        data.amount,
        user?.charity_percentage || 10,
        charityName
      );
    } catch (emailErr) {
      console.error(`⚠️ Failed to send subscription confirmation email: ${emailErr.message}`);
    }

    res.json({
      status: 'success',
      message: 'Payment verified & subscription active',
      subscription: data,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Cancel user's active subscription
router.post('/cancel', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .select('*')
      .single();

    if (error) throw error;

    res.json({
      message: 'Subscription cancelled',
      subscription: data,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
