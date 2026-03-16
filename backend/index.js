const { app } = require('./server');
const routes = require('./routes');
const stripeRoutes = require('./stripe-routes');

// Activer la tâche CRON pour les paiements différés
require('./cron-payment');

const path = require('path');
app.use('/uploads', require('express').static(path.join(__dirname, 'uploads')));
app.use('/api', routes);
app.use('/api/stripe', stripeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 8001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
