require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, initDatabase } = require('./models');
const path = require('path');

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// DB connect + init
sequelize.authenticate()
  .then(async () => {
    console.log('✓ PostgreSQL connected');
    await initDatabase();
  })
  .catch(err => console.error('PostgreSQL connection error:', err));

module.exports = { app };
