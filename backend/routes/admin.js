const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const adminAuth = require('../middleware/adminAuth');

// Get aggregated analytics: users, subscribers, revenue, draws
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const [users, subs, scores, draws, winners, charities] = await Promise.all([
      supabase.from('users').select('id, created_at', { count: 'exact' }),
      supabase.from('subscriptions').select('plan, status, amount'),
      supabase.from('scores').select('score'),
      supabase.from('draws').select('prize_pool, status, month_year'),
      supabase.from('winners').select('prize_amount, status'),
      supabase.from('charities').select('id', { count: 'exact' })
    ]);

    const totalUsers = users.count || 0;
    const activeSubs = subs.data?.filter(s => s.status === 'active') || [];
    const totalPrizePool = draws.data?.reduce((sum, d) => sum + (d.prize_pool || 0), 0) || 0;
    const totalCharityContrib = activeSubs.reduce((sum, s) => sum + (s.amount * 0.1), 0);
    const totalPaidOut = winners.data?.filter(w => w.status === 'paid').reduce((sum, w) => sum + w.prize_amount, 0) || 0;

    res.json({
      totalUsers,
      activeSubscribers: activeSubs.length,
      totalCharities: charities.count || 0,
      totalPrizePool: totalPrizePool.toFixed(2),
      totalCharityContrib: totalCharityContrib.toFixed(2),
      totalPaidOut: totalPaidOut.toFixed(2),
      totalDraws: draws.data?.length || 0,
      publishedDraws: draws.data?.filter(d => d.status === 'published').length || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get list of all users with their subscriptions and charity selection
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`id, name, email, role, charity_percentage, created_at, 
        charities(name), subscriptions(plan, status, ends_at, created_at)`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin update user details (name, email, role, charity selection, charity percentage)
router.put('/users/:id', adminAuth, async (req, res) => {
  const { name, email, role, charity_id, charity_percentage } = req.body;
  try {
    const { data, error } = await supabase
      .from('users').update({ name, email, role, charity_id, charity_percentage })
      .eq('id', req.params.id).select('*').single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin view user's scores for verification and manual adjustments
router.get('/scores/:userId', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scores').select('*').eq('user_id', req.params.userId)
      .order('date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin update score (for corrections)
router.put('/scores/:id', adminAuth, async (req, res) => {
  const { score, date } = req.body;
  try {
    const { data, error } = await supabase
      .from('scores').update({ score, date }).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin delete user (prevent deletion of admin accounts)
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    // Prevent deleting admin accounts
    const { data: targetUser } = await supabase.from('users').select('role').eq('id', req.params.id).single();
    if (targetUser?.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin accounts' });
    }

    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
