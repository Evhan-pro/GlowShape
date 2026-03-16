require('dotenv').config();
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Reservation, Prestation } = require('./models');

// =============================================
// CRÉER UN SETUP INTENT (Enregistrement de carte SANS débit)
// =============================================
router.post('/create-setup-intent', async (req, res) => {
  try {
    const { prestation_id, nom_client, email_client, telephone_client, date, heure_debut, heure_fin } = req.body;

    // Récupérer la prestation
    const prestation = await Prestation.findByPk(prestation_id);
    if (!prestation) {
      return res.status(404).json({ error: 'Prestation non trouvée' });
    }

    const montantTotal = parseFloat(prestation.prix_euros);
    const montantAcompte = (montantTotal * 0.3).toFixed(2); // 30% d'acompte

    // Créer ou récupérer le client Stripe
    const customers = await stripe.customers.list({
      email: email_client,
      limit: 1
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email_client,
        name: nom_client,
        phone: telephone_client,
        metadata: {
          source: 'glowshape_reservation'
        }
      });
    }

    // Créer le Setup Intent pour enregistrer la carte
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      metadata: {
        nom_client,
        email_client,
        telephone_client,
        prestation_id,
        prestation_nom: prestation.nom,
        date,
        heure_debut,
        heure_fin,
        montant_total: montantTotal,
        montant_acompte: montantAcompte
      }
    });

    // Créer la réservation en attente
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
      statut_paiement: 'pending', // En attente du jour J
      statut: 'confirmed', // Réservation confirmée mais paiement en attente
      stripe_customer_id: customer.id,
      stripe_setup_intent_id: setupIntent.id
    });

    res.json({ 
      clientSecret: setupIntent.client_secret,
      reservationId: reservation.id,
      setupIntentId: setupIntent.id
    });

  } catch (error) {
    console.error('Erreur création setup intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// CONFIRMER L'ENREGISTREMENT DE LA CARTE
// =============================================
router.post('/confirm-card-registration/:reservationId', async (req, res) => {
  try {
    const { payment_method_id } = req.body;
    const reservation = await Reservation.findByPk(req.params.reservationId);

    if (!reservation) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    // Attacher le payment method au customer
    await stripe.paymentMethods.attach(payment_method_id, {
      customer: reservation.stripe_customer_id,
    });

    // Définir comme méthode par défaut
    await stripe.customers.update(reservation.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: payment_method_id,
      },
    });

    // Mettre à jour la réservation
    await Reservation.update({
      stripe_payment_method_id: payment_method_id,
      statut: 'confirmed'
    }, {
      where: { id: req.params.reservationId }
    });

    res.json({ 
      success: true, 
      message: 'Carte enregistrée avec succès',
      reservation: await Reservation.findByPk(req.params.reservationId)
    });

  } catch (error) {
    console.error('Erreur confirmation carte:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// DÉBITER L'ACOMPTE (appelé le jour J ou lors d'annulation < 48h)
// =============================================
router.post('/charge-deposit/:reservationId', async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.reservationId);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    if (reservation.statut_paiement === 'paid') {
      return res.status(400).json({ error: 'Acompte déjà débité' });
    }

    if (!reservation.stripe_payment_method_id) {
      return res.status(400).json({ error: 'Aucune carte enregistrée' });
    }

    // Créer le Payment Intent pour débiter l'acompte
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(reservation.montant_acompte) * 100), // 30% en centimes
      currency: 'eur',
      customer: reservation.stripe_customer_id,
      payment_method: reservation.stripe_payment_method_id,
      off_session: true, // Paiement sans présence du client
      confirm: true,
      description: `Acompte - ${reservation.prestation_nom} - ${reservation.date}`,
      metadata: {
        reservation_id: reservation.id,
        type: 'acompte',
        prestation_nom: reservation.prestation_nom,
        date: reservation.date
      }
    });

    // Mettre à jour la réservation
    await Reservation.update({
      statut_paiement: 'paid',
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id: paymentIntent.latest_charge,
      date_paiement: new Date()
    }, {
      where: { id: req.params.reservationId }
    });

    res.json({
      success: true,
      message: `Acompte de ${reservation.montant_acompte}€ débité avec succès`,
      payment_intent_id: paymentIntent.id
    });

  } catch (error) {
    console.error('Erreur débit acompte:', error);
    
    // Si la carte est refusée
    if (error.code === 'card_declined' || error.type === 'StripeCardError') {
      await Reservation.update({
        statut: 'payment_failed',
        statut_paiement: 'failed'
      }, {
        where: { id: req.params.reservationId }
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// ANNULER UNE RÉSERVATION (avec débit acompte si < 48h)
// =============================================
router.post('/cancel-reservation/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    // Calculer le délai avant le rendez-vous
    const now = new Date();
    const rdvDate = new Date(`${reservation.date}T${reservation.heure_debut}`);
    const heuresAvantRdv = (rdvDate - now) / (1000 * 60 * 60);

    let message;
    let montantDebite = 0;

    if (heuresAvantRdv >= 48) {
      // Plus de 48h : Annulation gratuite
      await Reservation.update({
        statut: 'cancelled',
        statut_paiement: 'no_charge',
        date_annulation: new Date()
      }, {
        where: { id: req.params.id }
      });

      message = 'Réservation annulée gratuitement (plus de 48h avant le RDV)';

    } else {
      // Moins de 48h : Débiter l'acompte de 30%
      if (reservation.statut_paiement !== 'paid') {
        try {
          // Débiter l'acompte
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(parseFloat(reservation.montant_acompte) * 100),
            currency: 'eur',
            customer: reservation.stripe_customer_id,
            payment_method: reservation.stripe_payment_method_id,
            off_session: true,
            confirm: true,
            description: `Acompte (annulation < 48h) - ${reservation.prestation_nom}`,
            metadata: {
              reservation_id: reservation.id,
              type: 'cancellation_fee',
              prestation_nom: reservation.prestation_nom
            }
          });

          await Reservation.update({
            statut: 'cancelled',
            statut_paiement: 'paid',
            stripe_payment_intent_id: paymentIntent.id,
            date_paiement: new Date(),
            date_annulation: new Date()
          }, {
            where: { id: req.params.id }
          });

          montantDebite = parseFloat(reservation.montant_acompte);
          message = `Annulation moins de 48h avant : acompte de ${montantDebite}€ (30%) débité`;

        } catch (error) {
          console.error('Erreur débit acompte annulation:', error);
          
          await Reservation.update({
            statut: 'cancelled',
            statut_paiement: 'payment_failed',
            date_annulation: new Date()
          }, {
            where: { id: req.params.id }
          });

          return res.status(500).json({ 
            error: 'Erreur lors du débit de l\'acompte',
            details: error.message 
          });
        }
      } else {
        // Acompte déjà débité
        await Reservation.update({
          statut: 'cancelled',
          date_annulation: new Date()
        }, {
          where: { id: req.params.id }
        });

        montantDebite = parseFloat(reservation.montant_acompte);
        message = `Annulation moins de 48h avant : acompte de ${montantDebite}€ déjà débité`;
      }
    }

    res.json({
      success: true,
      message,
      montant_debite: montantDebite,
      heures_avant_rdv: heuresAvantRdv.toFixed(2)
    });

  } catch (error) {
    console.error('Erreur annulation:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// DÉBITER TOUS LES ACOMPTES DU JOUR (Tâche CRON)
// =============================================
router.post('/charge-today-deposits', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Récupérer toutes les réservations du jour qui n'ont pas encore été débitées
    const reservations = await Reservation.findAll({
      where: {
        date: today,
        statut: 'confirmed',
        statut_paiement: 'pending'
      }
    });

    const results = {
      total: reservations.length,
      success: 0,
      failed: 0,
      details: []
    };

    for (const reservation of reservations) {
      try {
        // Débiter l'acompte
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(parseFloat(reservation.montant_acompte) * 100),
          currency: 'eur',
          customer: reservation.stripe_customer_id,
          payment_method: reservation.stripe_payment_method_id,
          off_session: true,
          confirm: true,
          description: `Acompte jour J - ${reservation.prestation_nom}`,
          metadata: {
            reservation_id: reservation.id,
            type: 'jour_j_acompte'
          }
        });

        await Reservation.update({
          statut_paiement: 'paid',
          stripe_payment_intent_id: paymentIntent.id,
          date_paiement: new Date()
        }, {
          where: { id: reservation.id }
        });

        results.success++;
        results.details.push({
          id: reservation.id,
          nom_client: reservation.nom_client,
          montant: reservation.montant_acompte,
          status: 'success'
        });

      } catch (error) {
        console.error(`Erreur débit réservation ${reservation.id}:`, error);
        
        await Reservation.update({
          statut_paiement: 'failed'
        }, {
          where: { id: reservation.id }
        });

        results.failed++;
        results.details.push({
          id: reservation.id,
          nom_client: reservation.nom_client,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Débits terminés : ${results.success} succès, ${results.failed} échecs`,
      results
    });

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
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'setup_intent.succeeded':
        const setupIntent = event.data.object;
        console.log('Setup Intent réussi:', setupIntent.id);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment Intent réussi:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.error('Paiement échoué:', failedPayment.id);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erreur webhook:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

module.exports = router;
