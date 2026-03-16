require('dotenv').config();
const cron = require('node-cron');
const fetch = require('node-fetch');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

// Tâche CRON : Débiter les acomptes chaque jour à 8h00
cron.schedule('0 8 * * *', async () => {
  console.log('🕐 [CRON] Démarrage du débit des acomptes du jour...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/stripe/charge-today-deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ [CRON] Débits terminés : ${data.results.success} succès, ${data.results.failed} échecs`);
      
      // Logger les détails
      data.results.details.forEach(detail => {
        if (detail.status === 'success') {
          console.log(`  ✓ ${detail.nom_client} : ${detail.montant}€ débité`);
        } else {
          console.error(`  ✗ ${detail.nom_client} : ${detail.error}`);
        }
      });
    } else {
      console.error('❌ [CRON] Erreur lors du débit des acomptes');
    }
    
  } catch (error) {
    console.error('❌ [CRON] Erreur:', error.message);
  }
});

console.log('✅ Service CRON démarré - Débit automatique des acomptes à 8h00 chaque jour');

// Garder le processus actif
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du service CRON');
  process.exit(0);
});
