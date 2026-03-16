require('dotenv').config();
const express = require('express');
const router = express.Router();

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('FATAL: STRIPE_SECRET_KEY manquante');
  process.exit(1);
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Op } = require('sequelize');
const { Reservation, Prestation } = require('./models');

// Validation des champs requis
function validateFields(body, fields) {
  const missing = fields.filter(f => !body[f] || String(body[f]).trim() === '');
  if (missing.length > 0) {
    return `Champs manquants: ${missing.join(', ')}`;
  }
  return null;
}

// Validation email basique
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// =============================================
// ÉTAPE 1 : CRÉER UN SETUP INTENT (PAS de réservation)
// =============================================
router.post('/create-setup-intent', async (req, res) => {
  try {
    const { prestation_id, nom_client, email_client, telephone_client, date, heure_debut, heure_fin } = req.body;

    const validationError = validateFields(req.body, ['prestation_id', 'nom_client', 'email_client', 'telephone_client', 'date', 'heure_debut', 'heure_fin']);
    if (validationError) return res.status(400).json({ error: validationError });
    if (!isValidEmail(email_client)) return res.status(400).json({ error: 'Email invalide' });

    const prestation = await Prestation.findByPk(prestation_id);
    if (!prestation) {
      return res.status(404).json({ error: 'Prestation non trouvée' });
    }

    const montantTotal = parseFloat(prestation.prix_euros);
    const montantAcompte = (montantTotal * 0.3).toFixed(2);

    // Créer ou récupérer le client Stripe
    const customers = await stripe.customers.list({ email: email_client, limit: 1 });
    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email_client,
        name: nom_client,
        phone: telephone_client,
        metadata: { source: 'glowshape_reservation' }
      });
    }

    // Créer le Setup Intent (enregistrement carte uniquement)
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      metadata: {
        nom_client, email_client, telephone_client,
        prestation_id, prestation_nom: prestation.nom,
        date, heure_debut, heure_fin,
        montant_total: String(montantTotal),
        montant_acompte: String(montantAcompte)
      }
    });

    // Retourner UNIQUEMENT le clientSecret — PAS de réservation créée
    res.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      customerId: customer.id,
      montantTotal,
      montantAcompte: parseFloat(montantAcompte)
    });

  } catch (error) {
    console.error('Erreur création setup intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// ÉTAPE 2 : CONFIRMER CARTE + CRÉER RÉSERVATION
// La réservation n'est créée QUE si la carte est validée
// =============================================
router.post('/confirm-and-book', async (req, res) => {
  try {
    const {
      setup_intent_id,
      payment_method_id,
      customer_id,
      prestation_id,
      nom_client,
      email_client,
      telephone_client,
      date,
      heure_debut,
      heure_fin
    } = req.body;

    const validationError = validateFields(req.body, ['setup_intent_id', 'payment_method_id', 'customer_id', 'prestation_id', 'nom_client', 'email_client', 'telephone_client', 'date', 'heure_debut', 'heure_fin']);
    if (validationError) return res.status(400).json({ error: validationError });
    if (!isValidEmail(email_client)) return res.status(400).json({ error: 'Email invalide' });

    // 1. Vérifier que le SetupIntent est bien succeeded
    const setupIntent = await stripe.setupIntents.retrieve(setup_intent_id);
    if (setupIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'L\'enregistrement de la carte n\'a pas réussi. Veuillez réessayer.'
      });
    }

    // 2. Récupérer la prestation
    const prestation = await Prestation.findByPk(prestation_id);
    if (!prestation) {
      return res.status(404).json({ error: 'Prestation non trouvée' });
    }

    // 3. Vérifier anti-double-booking
    const conflits = await Reservation.count({
      where: {
        date,
        statut: 'confirmed',
        [Op.or]: [
          { heure_debut: { [Op.lt]: heure_fin }, heure_fin: { [Op.gt]: heure_debut } }
        ]
      }
    });

    if (conflits > 0) {
      return res.status(409).json({ error: 'Ce créneau vient d\'être pris. Veuillez en choisir un autre.' });
    }

    // 4. Attacher la méthode de paiement au client
    try {
      await stripe.paymentMethods.attach(payment_method_id, { customer: customer_id });
    } catch (attachErr) {
      // Si déjà attaché, on continue
      if (attachErr.code !== 'resource_already_exists') {
        throw attachErr;
      }
    }

    await stripe.customers.update(customer_id, {
      invoice_settings: { default_payment_method: payment_method_id }
    });

    // 5. MAINTENANT créer la réservation (carte validée + créneau libre)
    const montantTotal = parseFloat(prestation.prix_euros);
    const montantAcompte = parseFloat((montantTotal * 0.3).toFixed(2));

    const reservation = await Reservation.create({
      prestation_id,
      prestation_nom: prestation.nom,
      nom_client,
      email_client,
      telephone_client,
      date,
      heure_debut,
      heure_fin,
      montant_total: montantTotal,
      montant_acompte: montantAcompte,
      statut: 'confirmed',
      statut_paiement: 'card_registered',
      stripe_customer_id: customer_id,
      stripe_setup_intent_id: setup_intent_id,
      stripe_payment_method_id: payment_method_id
    });

    res.json({
      success: true,
      message: 'Réservation confirmée ! Votre carte sera débitée de l\'acompte le jour du rendez-vous.',
      reservation
    });

  } catch (error) {
    console.error('Erreur confirm-and-book:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// DÉBITER L'ACOMPTE (jour J ou annulation < 48h)
// =============================================
router.post('/charge-deposit/:reservationId', async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.reservationId);
    if (!reservation) return res.status(404).json({ error: 'Réservation non trouvée' });
    if (reservation.statut_paiement === 'paid') return res.status(400).json({ error: 'Acompte déjà débité' });
    if (!reservation.stripe_payment_method_id) return res.status(400).json({ error: 'Aucune carte enregistrée' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(reservation.montant_acompte) * 100),
      currency: 'eur',
      customer: reservation.stripe_customer_id,
      payment_method: reservation.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      description: `Acompte - ${reservation.prestation_nom} - ${reservation.date}`,
      metadata: { reservation_id: reservation.id, type: 'acompte' }
    });

    await Reservation.update({
      statut_paiement: 'paid',
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id: paymentIntent.latest_charge,
      date_paiement: new Date()
    }, { where: { id: req.params.reservationId } });

    res.json({ success: true, message: `Acompte de ${reservation.montant_acompte}€ débité` });

  } catch (error) {
    console.error('Erreur débit acompte:', error);
    if (error.code === 'card_declined' || error.type === 'StripeCardError') {
      await Reservation.update({ statut_paiement: 'failed' }, { where: { id: req.params.reservationId } });
    }
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// ANNULER UNE RÉSERVATION (avec logique 48h)
// =============================================
router.post('/cancel-reservation/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Réservation non trouvée' });
    if (reservation.statut === 'cancelled') return res.status(400).json({ error: 'Réservation déjà annulée' });

    const now = new Date();
    const rdvDate = new Date(`${reservation.date}T${reservation.heure_debut}`);
    const heuresAvantRdv = (rdvDate - now) / (1000 * 60 * 60);

    let message;
    let montantDebite = 0;

    if (heuresAvantRdv >= 48) {
      // Annulation gratuite (>48h)
      await Reservation.update({
        statut: 'cancelled',
        statut_paiement: 'no_charge',
        date_annulation: new Date()
      }, { where: { id: req.params.id } });

      message = 'Réservation annulée gratuitement (plus de 48h avant le RDV)';

    } else {
      // Annulation avec pénalité (<48h) — débiter l'acompte
      if (reservation.statut_paiement !== 'paid' && reservation.stripe_payment_method_id) {
        try {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(parseFloat(reservation.montant_acompte) * 100),
            currency: 'eur',
            customer: reservation.stripe_customer_id,
            payment_method: reservation.stripe_payment_method_id,
            off_session: true,
            confirm: true,
            description: `Pénalité annulation < 48h - ${reservation.prestation_nom}`,
            metadata: { reservation_id: reservation.id, type: 'cancellation_fee' }
          });

          await Reservation.update({
            statut: 'cancelled',
            statut_paiement: 'paid',
            stripe_payment_intent_id: paymentIntent.id,
            date_paiement: new Date(),
            date_annulation: new Date()
          }, { where: { id: req.params.id } });

          montantDebite = parseFloat(reservation.montant_acompte);
          message = `Annulation < 48h : acompte de ${montantDebite}€ (30%) débité`;

        } catch (chargeErr) {
          console.error('Erreur débit annulation:', chargeErr);
          await Reservation.update({
            statut: 'cancelled',
            statut_paiement: 'payment_failed',
            date_annulation: new Date()
          }, { where: { id: req.params.id } });
          return res.status(500).json({ error: 'Erreur lors du débit', details: chargeErr.message });
        }
      } else {
        await Reservation.update({
          statut: 'cancelled',
          date_annulation: new Date()
        }, { where: { id: req.params.id } });
        montantDebite = reservation.statut_paiement === 'paid' ? parseFloat(reservation.montant_acompte) : 0;
        message = reservation.statut_paiement === 'paid'
          ? `Annulation < 48h : acompte de ${montantDebite}€ déjà débité`
          : 'Réservation annulée';
      }
    }

    res.json({ success: true, message, montant_debite: montantDebite, heures_avant_rdv: parseFloat(heuresAvantRdv.toFixed(2)) });

  } catch (error) {
    console.error('Erreur annulation:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// TÂCHE CRON : DÉBITER TOUS LES ACOMPTES DU JOUR
// =============================================
router.post('/charge-today-deposits', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const reservations = await Reservation.findAll({
      where: { date: today, statut: 'confirmed', statut_paiement: 'card_registered' }
    });

    const results = { total: reservations.length, success: 0, failed: 0, details: [] };

    for (const reservation of reservations) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(parseFloat(reservation.montant_acompte) * 100),
          currency: 'eur',
          customer: reservation.stripe_customer_id,
          payment_method: reservation.stripe_payment_method_id,
          off_session: true,
          confirm: true,
          description: `Acompte jour J - ${reservation.prestation_nom}`,
          metadata: { reservation_id: reservation.id, type: 'jour_j_acompte' }
        });

        await Reservation.update({
          statut_paiement: 'paid',
          stripe_payment_intent_id: paymentIntent.id,
          date_paiement: new Date()
        }, { where: { id: reservation.id } });

        results.success++;
        results.details.push({ id: reservation.id, nom_client: reservation.nom_client, montant: reservation.montant_acompte, status: 'success' });
      } catch (err) {
        console.error(`Erreur débit ${reservation.id}:`, err);
        await Reservation.update({ statut_paiement: 'failed' }, { where: { id: reservation.id } });
        results.failed++;
        results.details.push({ id: reservation.id, nom_client: reservation.nom_client, status: 'failed', error: err.message });
      }
    }

    res.json({ success: true, message: `Débits: ${results.success} OK, ${results.failed} échecs`, results });
  } catch (error) {
    console.error('Erreur débits du jour:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// WEBHOOK STRIPE
// =============================================
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    switch (event.type) {
      case 'setup_intent.succeeded':
        console.log('Setup Intent réussi:', event.data.object.id);
        break;
      case 'payment_intent.succeeded':
        console.log('Payment Intent réussi:', event.data.object.id);
        break;
      case 'payment_intent.payment_failed':
        console.error('Paiement échoué:', event.data.object.id);
        break;
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Erreur webhook:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

module.exports = router;
