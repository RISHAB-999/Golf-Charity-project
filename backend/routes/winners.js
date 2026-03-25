const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Get all winners with user and draw details (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('winners')
      .select(`*, users(name, email), draws(numbers, month_year)`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user's winnings
router.get('/me', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('winners')
      .select(`*, draws(numbers, month_year)`)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload proof screenshot for winning (user can only upload for their own winnings)
router.post('/:id/proof', auth, upload.single('proof'), async (req, res) => {
  try {
    const proofUrl = `/uploads/${req.file.filename}`;
    const { data, error } = await supabase
      .from('winners')
      .update({ proof_url: proofUrl, status: 'pending' })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('*').single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin verifies or rejects winner, sends notification email
router.put('/:id/verify', adminAuth, async (req, res) => {
  const { status } = req.body; // 'verified' or 'rejected'
  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be verified or rejected' });
  }
  try {
    const { data, error } = await supabase
      .from('winners').update({ status }).eq('id', req.params.id).select('*, users(*), draws(*)').single();
    if (error) throw error;

    try {
      if (data.users?.email) {
        await emailService.sendVerificationNotification(
          data.users,
          data.draws,
          data.match_type,
          data.prize_amount,
          status
        );
      }
    } catch (emailErr) {
      console.error(`Failed to send verification email: ${emailErr.message}`);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/winners/:id/payout — admin: mark as paid ───────────────────────
router.put('/:id/payout', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('winners').update({ status: 'paid' }).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
