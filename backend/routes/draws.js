const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const adminAuth = require('../middleware/adminAuth');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');

// Get all draws (public endpoint returns only published, admin can request all)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('draws')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all draws for admin (including simulated)
router.get('/admin/all', require('../middleware/adminAuth'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('draws')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-delete draws older than 90 days
router.delete('/cleanup', require('../middleware/adminAuth'), async (req, res) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data, error } = await supabase
      .from('draws')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString());
    if (error) throw error;
    res.json({ deleted: data?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simulate draw with random or algorithm-based number generation
router.post('/simulate',adminAuth, async (req, res) => {
  const { draw_type, month_year } = req.body;
  try {
    const { data: activeSubs } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'active');

    const userIds = activeSubs.map(s => s.user_id);
    const { data: allScores } = await supabase
      .from('scores')
      .select('score')
      .in('user_id', userIds);

    let numbers = [];

    if (draw_type === 'random') {
      // Standard lottery-style: Fisher-Yates shuffle
      const pool = Array.from({ length: 45 }, (_, i) => i + 1);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      numbers = pool.slice(0, 5).sort((a, b) => a - b);
    } else {
      // Algorithm: weighted by score frequency
      const freq = {};
      allScores.forEach(({ score }) => { freq[score] = (freq[score] || 0) + 1; });
      const weighted = [];
      Object.entries(freq).forEach(([score, count]) => {
        for (let i = 0; i < count; i++) weighted.push(Number(score));
      });
      const picked = new Set();
      while (picked.size < 5 && weighted.length > 0) {
        const idx = Math.floor(Math.random() * weighted.length);
        picked.add(weighted[idx]);
        weighted.splice(idx, 1);
      }
      while (picked.size < 5) picked.add(Math.ceil(Math.random() * 45));
      numbers = [...picked].sort((a, b) => a - b);
    }

    // Calculate prize pool: £9.99 * active subs * 0.7 (rest goes to charity)
    const prizePool = parseFloat((activeSubs.length * 9.99 * 0.7).toFixed(2));
// Check for existing jackpot rollover
    const { data: lastDraw } = await supabase
      .from('draws')
      .select('jackpot_amount')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    const rollover = lastDraw?.jackpot_amount || 0;
    const jackpot = parseFloat((prizePool * 0.4 + rollover).toFixed(2));

    const { data: draw, error } = await supabase
      .from('draws')
      .insert({
        numbers,
        draw_type,
        status: 'simulated',
        prize_pool: prizePool,
        jackpot_amount: jackpot,
        month_year
      })
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json({ draw, numbers, prize_pool: prizePool, jackpot });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Publish simulated draw, calculate winners, send notifications
router.post('/publish', adminAuth, async (req, res) => {
  const { draw_id } = req.body;
  if (!draw_id) return res.status(400).json({ error: 'draw_id is required' });

  try {
    const { data: draw, error: drawErr } = await supabase
      .from('draws').select('*').eq('id', draw_id).single();
    if (drawErr || !draw) return res.status(404).json({ error: 'Draw not found' });

    // Find winners: match users' latest 5 scores against draw numbers
    const drawNums = new Set(draw.numbers);
    const { data: activeSubs } = await supabase
      .from('subscriptions').select('user_id').eq('status', 'active');
    const userIds = activeSubs.map(s => s.user_id);

    const { data: allScores } = await supabase
      .from('scores').select('user_id, score').in('user_id', userIds);

    // Group scores by user
    const userScores = {};
    allScores.forEach(({ user_id, score }) => {
      if (!userScores[user_id]) userScores[user_id] = [];
      userScores[user_id].push(score);
    });

    const winners = { 3: [], 4: [], 5: [] };
    Object.entries(userScores).forEach(([uid, scores]) => {
      const matches = scores.filter(s => drawNums.has(s)).length;
      if (matches >= 3) winners[Math.min(matches, 5)].push(uid);
    });

    // Insert winners and send notifications
    for (const [match_type, uids] of Object.entries(winners)) {
      if (uids.length === 0) continue;
      const tierShare = match_type == 5 ? 0.4 : match_type == 4 ? 0.35 : 0.25;
      const tierPool = match_type == 5 ? draw.jackpot_amount : draw.prize_pool * tierShare;
      const prizeEach = parseFloat((tierPool / uids.length).toFixed(2));
      const winnerRows = uids.map(uid => ({
        user_id: uid, draw_id: draw_id,
        match_type: Number(match_type), prize_amount: prizeEach, status: 'pending'
      }));
      await supabase.from('winners').insert(winnerRows);

      // Send email notifications to winners
      try {
        for (const uid of uids) {
          const { data: user } = await supabase.from('users').select('*').eq('id', uid).single();
          if (user?.email) {
            await emailService.sendWinnerAnnouncement(user, draw, Number(match_type), prizeEach);
          }
        }
      } catch (emailErr) {
        console.error(`Failed to send winner emails: ${emailErr.message}`);
      }
    }

    // If no 5-match winner, jackpot rolls over to next draw
    const jackpotRollover = winners[5].length === 0 ? draw.jackpot_amount : 0;

    const { data: updated, error: updateErr } = await supabase
      .from('draws')
      .update({ status: 'published', published_at: new Date().toISOString(), jackpot_amount: jackpotRollover })
      .eq('id', draw_id).select('*').single();

    if (updateErr) throw updateErr;
    res.json({ draw: updated, winners });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
