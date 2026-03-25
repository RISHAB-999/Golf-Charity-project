const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// ─── GET /api/charities — public list with search ─────────────────────────────
router.get('/', async (req, res) => {
  // Get all charities with optional search filter
  try {
    let query = supabase.from('charities').select('*').order('featured', { ascending: false });
    if (req.query.search) {
      query = query.ilike('name', `%${req.query.search}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single charity by ID with details
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('charities').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Charity not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin creates new charity
router.post('/', adminAuth, async (req, res) => {
  const { name, description, image_url, events, featured } = req.body;
  try {
    const { data, error } = await supabase
      .from('charities')
      .insert({ name, description, image_url, events: events || [], featured: featured || false })
      .select('*').single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin updates charity details
router.put('/:id', adminAuth, async (req, res) => {
  const { name, description, image_url, events, featured } = req.body;
  try {
    const { data, error } = await supabase
      .from('charities').update({ name, description, image_url, events, featured })
      .eq('id', req.params.id).select('*').single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin deletes charity
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('charities').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Charity deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
