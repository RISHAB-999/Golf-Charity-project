const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

// Register new user with subscription
router.post('/register', async (req, res) => {
  const { name, email, password, charity_id, charity_percentage, plan } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password_hash,
        charity_id: charity_id || null,
        charity_percentage: charity_percentage || 10,
        role: 'user'
      })
      .select('id, name, email, role, charity_id, charity_percentage')
      .single();

    if (error) throw error;

    // Create subscription if plan provided
    if (plan) {
      const amount = plan === 'yearly' ? 99.99 : 9.99;
      const ends_at = new Date();
      plan === 'yearly'
        ? ends_at.setFullYear(ends_at.getFullYear() + 1)
        : ends_at.setMonth(ends_at.getMonth() + 1);

      await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan,
        status: 'active',
        amount,
        ends_at: ends_at.toISOString()
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Authenticate user and return JWT token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, charity_id, charity_percentage, password_hash')
      .eq('email', email)
      .single();

    if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get current authenticated user profile
const auth = require('../middleware/auth');
router.get('/me', auth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, charity_id, charity_percentage, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user account and all associated data
router.delete('/me', auth, async (req, res) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
