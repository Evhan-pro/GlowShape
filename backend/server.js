require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize, initDatabase } = require('./models');
const path = require('path');

// Fail fast si variables critiques manquantes
const requiredEnvVars = ['POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'JWT_SECRET_KEY', 'STRIPE_SECRET_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL: Variable d'environnement ${envVar} manquante`);
    process.exit(1);
  }
}

const app = express();

// Securite HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

// CORS restreint
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://glowshape-fix.preview.emergentagent.com',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error('CORS non autorise'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requetes, veuillez reessayer plus tard' }
});
app.use('/api', globalLimiter);

// Rate limiting strict pour login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion. Reessayez dans 15 minutes.' }
});
app.use('/api/admin/login', loginLimiter);

// Rate limiting pour endpoints Stripe
const stripeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  message: { error: 'Trop de tentatives de paiement. Reessayez dans quelques minutes.' }
});
app.use('/api/stripe/create-setup-intent', stripeLimiter);
app.use('/api/stripe/confirm-and-book', stripeLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB connect + init
sequelize.authenticate()
  .then(async () => {
    console.log('PostgreSQL connected');
    await initDatabase();
  })
  .catch(err => {
    console.error('PostgreSQL connection error:', err);
    process.exit(1);
  });

module.exports = { app };
