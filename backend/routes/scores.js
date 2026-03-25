const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../lib/supabase');

// Get user's latest 5 golf scores
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false })
      .limit(5);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new score, auto-delete oldest if user already has 5 scores
router.post('/', auth, async (req, res) => {
  const { score, date } = req.body;

  if (!score || !date) return res.status(400).json({ error: 'Score and date are required' });
  if (score < 1 || score > 45) return res.status(400).json({ error: 'Score must be between 1 and 45 (Stableford)' });

  try {
    const { data: existing } = await supabase
      .from('scores')
      .select('id, date')
      .eq('user_id', req.user.id)
      .order('date', { ascending: true });

    // If already 5 scores, delete the oldest one
    if (existing.length >= 5) {
      await supabase.from('scores').delete().eq('id', existing[0].id);
    }

    const { data, error } = await supabase
      .from('scores')
      .insert({ user_id: req.user.id, score, date })
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update specific score by ID (user can only edit their own scores)
router.put('/:id', auth, async (req, res) => {
  const { score, date } = req.body;
  try {
    const { data, error } = await supabase
      .from('scores')
      .update({ score, date })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id) // ensure user can only edit own scores
      .select('*')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete score by ID (user can only delete their own scores)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('scores')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Score deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
