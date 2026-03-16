require('dotenv').config();
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Reservation, Prestation } = require('./models');

// =============================================
// CRÉER UNE SESSION DE PAIEMENT STRIPE
// =============================================
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { prestation_id, nom_client, email_client, telephone_client, date, heure_debut, heure_fin } = req.body;

    // Récupérer la prestation
    const prestation = await Prestation.findByPk(prestation_id);
    if (!prestation) {
      return res.status(404).json({ error: 'Prestation non trouvée' });
    }

    const montantTotal = parseFloat(prestation.prix_euros);
    const montantAcompte = (montantTotal * 0.3).toFixed(2); // 30% d'acompte

    // Créer la réservation en attente de paiement
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
      statut_paiement: 'pending',
      statut: 'pending'
    });

    // Créer la session de paiement Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: prestation.nom,
              description: `Réservation pour le ${date} à ${heure_debut}`,
            },
            unit_amount: Math.round(montantTotal * 100), // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000'}/reservation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000'}/reservation`,
      client_reference_id: reservation.id,
      customer_email: email_client,
      metadata: {
        reservation_id: reservation.id,
        prestation_nom: prestation.nom
      }
    });

    res.json({ 
      sessionId: session.id,
      reservationId: reservation.id,
      url: session.url
    });

  } catch (error) {
    console.error('Erreur création session Stripe:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// CONFIRMER LE PAIEMENT (après redirection Stripe)
// =============================================
router.get('/confirm-payment/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

    if (session.payment_status === 'paid') {
      const reservationId = session.client_reference_id;
      
      await Reservation.update({
        statut_paiement: 'paid',
        statut: 'confirmed',
        stripe_payment_intent_id: session.payment_intent,
        date_paiement: new Date()
      }, {
        where: { id: reservationId }
      });

      const reservation = await Reservation.findByPk(reservationId);
      res.json({ success: true, reservation });
    } else {
      res.json({ success: false, message: 'Paiement non confirmé' });
    }

  } catch (error) {
    console.error('Erreur confirmation paiement:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// ANNULER UNE RÉSERVATION AVEC REMBOURSEMENT
// =============================================
router.post('/cancel-reservation/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    if (reservation.statut_paiement !== 'paid') {
      return res.status(400).json({ error: 'Réservation non payée' });
    }

    // Calculer le délai avant le rendez-vous
    const now = new Date();
    const rdvDate = new Date(`${reservation.date}T${reservation.heure_debut}`);
    const heuresAvantRdv = (rdvDate - now) / (1000 * 60 * 60);

    let montantRemboursement;
    let nouveauStatut;

    if (heuresAvantRdv >= 48) {
      // Plus de 48h : remboursement 100%
      montantRemboursement = parseFloat(reservation.montant_total);
      nouveauStatut = 'refunded_full';
    } else {
      // Moins de 48h : remboursement 70% (garde 30% acompte)
      montantRemboursement = parseFloat(reservation.montant_total) - parseFloat(reservation.montant_acompte);
      nouveauStatut = 'refunded_partial';
    }

    // Effectuer le remboursement via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: reservation.stripe_payment_intent_id,
      amount: Math.round(montantRemboursement * 100), // Convertir en centimes
      reason: 'requested_by_customer',
      metadata: {
        reservation_id: reservation.id,
        delai_heures: heuresAvantRdv.toFixed(2)
      }
    });

    // Mettre à jour la réservation
    await Reservation.update({
      statut: 'cancelled',
      statut_paiement: nouveauStatut,
      date_annulation: new Date()
    }, {
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      montant_rembourse: montantRemboursement,
      montant_garde: nouveauStatut === 'refunded_partial' ? parseFloat(reservation.montant_acompte) : 0,
      refund_id: refund.id,
      message: heuresAvantRdv >= 48 
        ? 'Remboursement complet effectué' 
        : `Remboursement de ${montantRemboursement}€ effectué (acompte de 30% conservé)`
    });

  } catch (error) {
    console.error('Erreur annulation/remboursement:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// WEBHOOK STRIPE (pour notifications temps réel)
// =============================================
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const reservationId = session.client_reference_id;
        
        await Reservation.update({
          statut_paiement: 'paid',
          statut: 'confirmed',
          stripe_payment_intent_id: session.payment_intent,
          date_paiement: new Date()
        }, {
          where: { id: reservationId }
        });
        break;

      case 'charge.refunded':
        // Gérer les remboursements
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erreur webhook:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

module.exports = router;
