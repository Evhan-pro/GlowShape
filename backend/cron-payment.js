require('dotenv').config();
const cron = require('node-cron');

const BACKEND_URL = `http://localhost:${process.env.PORT}`;

async function processPayments() {
  try {
    console.log(`[CRON] Traitement des acomptes du jour - ${new Date().toISOString()}`);
    const response = await fetch(`${BACKEND_URL}/api/stripe/charge-today-deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    console.log('[CRON] Resultat:', JSON.stringify(data));
  } catch (error) {
    console.error('[CRON] Erreur:', error.message);
  }
}

cron.schedule('0 8 * * *', processPayments);
console.log('[CRON] Tache planifiee: debits acomptes a 8h00 chaque jour');
