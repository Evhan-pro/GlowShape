const { app } = require('./server');
const routes = require('./routes');
const stripeRoutes = require('./stripe-routes');

require('./cron-payment');

app.use('/api', routes);
app.use('/api/stripe', stripeRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
