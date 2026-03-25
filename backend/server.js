require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const supabase = require('./lib/supabase');

const app = express();

// Configure CORS for frontend (5173) and admin panel (5174)
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.ADMIN_URL || 'http://localhost:5174'
  ],
  credentials: true
}));

app.use(express.json());

// Serve uploaded winner proof screenshots on /uploads route
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Load all API route endpoints
app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/scores', require('./routes/scores.js'));
app.use('/api/charities', require('./routes/charities.js'));
app.use('/api/draws', require('./routes/draws.js'));
app.use('/api/winners', require('./routes/winners.js'));
app.use('/api/subscriptions', require('./routes/subscriptions.js'));
app.use('/api/admin', require('./routes/admin.js'));

// Health check endpoint
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Auto-cleanup: Delete draws older than 90 days (runs daily at 2 AM)
setInterval(async () => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data, error } = await supabase
      .from('draws')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString());
    
    if (!error && data?.length > 0) {
      console.log(`🗑️ Auto-cleanup: Deleted ${data.length} old draws`);
    }
  } catch (err) {
    console.error('Cleanup failed:', err.message);
  }
}, 86400000); // 24 hours in milliseconds

const PORT = process.env.PORT ;
app.listen(PORT, () => {
  console.log(`\x1b[32m✔ Golf Charity API running on http://localhost:${PORT}\x1b[0m`);
});
