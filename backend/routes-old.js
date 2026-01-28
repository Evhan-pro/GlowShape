const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { 
  Prestation, 
  Reservation, 
  Contact, 
  Horaires, 
  GoogleToken,
  authMiddleware, 
  sendEmail, 
  createCalendarEvent, 
  getCalendarEvents,
  oauth2Client 
} = require('./server');

const router = express.Router();

// ========== PUBLIC ROUTES ==========

// Prestations
router.get('/prestations', async (req, res) => {
  try {
    const { categorie, prix_min, prix_max, duree_max, recherche } = req.query;
    let query = {};

    if (categorie) query.categorie = categorie;
    if (prix_min) query.prix_euros = { ...query.prix_euros, $gte: parseFloat(prix_min) };
    if (prix_max) query.prix_euros = { ...query.prix_euros, $lte: parseFloat(prix_max) };
    if (duree_max) query.duree_minutes = { $lte: parseInt(duree_max) };
    if (recherche) {
      query.$or = [
        { nom: { $regex: recherche, $options: 'i' } },
        { description: { $regex: recherche, $options: 'i' } }
      ];
    }

    const prestations = await Prestation.find(query).select('-_id -__v');
    res.json(prestations);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get('/prestations/:id', async (req, res) => {
  try {
    const prestation = await Prestation.findOne({ id: req.params.id }).select('-_id -__v');
    if (!prestation) return res.status(404).json({ detail: 'Prestation non trouvée' });
    res.json(prestation);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Prestation.distinct('categorie');
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Disponibilités
router.get('/disponibilites', async (req, res) => {
  try {
    const { date, prestation_id } = req.query;
    
    const prestation = await Prestation.findOne({ id: prestation_id });
    if (!prestation) return res.status(404).json({ detail: 'Prestation non trouvée' });

    const duree = prestation.duree_minutes;
    
    // Horaires personnalisés ou par défaut
    const horairesPerso = await Horaires.findOne({ date });
    
    if (horairesPerso && !horairesPerso.ouvert) {
      return res.json({ date, creneaux: [], ferme: true });
    }

    const heureOuverture = horairesPerso?.heure_ouverture || '09:00';
    const heureFermeture = horairesPerso?.heure_fermeture || '19:00';

    // Générer créneaux
    const creneaux = [];
    let [hO, mO] = heureOuverture.split(':').map(Number);
    let [hF, mF] = heureFermeture.split(':').map(Number);
    
    let currentMinutes = hO * 60 + mO;
    const endMinutes = hF * 60 + mF;

    // Réservations existantes
    const reservations = await Reservation.find({ date, statut: 'confirmed' });
    
    // Événements Google Calendar
    const dateDebut = new Date(`${date}T00:00:00`);
    const dateFin = new Date(`${date}T23:59:59`);
    const calendarEvents = await getCalendarEvents(dateDebut, dateFin);
    
    const blockedSlots = [];
    
    // Bloquer réservations site
    reservations.forEach(r => {
      const [hD, mD] = r.heure_debut.split(':').map(Number);
      const [hFin, mFin] = r.heure_fin.split(':').map(Number);
      blockedSlots.push({
        debut: hD * 60 + mD,
        fin: hFin * 60 + mFin
      });
    });

    // Bloquer événements Google Calendar (sauf ceux du site)
    calendarEvents.forEach(event => {
      if (event.extendedProperties?.private?.source === 'website') return;
      
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;
      
      if (start && start.includes('T')) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        blockedSlots.push({
          debut: startDate.getHours() * 60 + startDate.getMinutes(),
          fin: endDate.getHours() * 60 + endDate.getMinutes()
        });
      }
    });

    while (currentMinutes < endMinutes) {
      const finCreneau = currentMinutes + duree;
      
      if (finCreneau <= endMinutes) {
        let disponible = true;
        
        for (const slot of blockedSlots) {
          if (!(finCreneau <= slot.debut || currentMinutes >= slot.fin)) {
            disponible = false;
            break;
          }
        }

        const hDebut = Math.floor(currentMinutes / 60);
        const mDebut = currentMinutes % 60;
        const hFin = Math.floor(finCreneau / 60);
        const mFin = finCreneau % 60;

        creneaux.push({
          heure_debut: `${String(hDebut).padStart(2, '0')}:${String(mDebut).padStart(2, '0')}`,
          heure_fin: `${String(hFin).padStart(2, '0')}:${String(mFin).padStart(2, '0')}`,
          disponible
        });
      }
      
      currentMinutes += 30;
    }

    res.json({ date, creneaux, ferme: false });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Réservations
router.post('/reservations', async (req, res) => {
  try {
    const { prestation_id, nom_client, email_client, telephone_client, date, heure_debut } = req.body;

    const prestation = await Prestation.findOne({ id: prestation_id });
    if (!prestation) return res.status(404).json({ detail: 'Prestation non trouvée' });

    const [h, m] = heure_debut.split(':').map(Number);
    const totalMinutes = h * 60 + m + prestation.duree_minutes;
    const hFin = Math.floor(totalMinutes / 60);
    const mFin = totalMinutes % 60;
    const heure_fin = `${String(hFin).padStart(2, '0')}:${String(mFin).padStart(2, '0')}`;

    // Anti double-booking
    const conflits = await Reservation.find({
      date,
      statut: 'confirmed',
      $or: [
        { heure_debut: { $lt: heure_fin }, heure_fin: { $gt: heure_debut } }
      ]
    });

    if (conflits.length > 0) {
      return res.status(409).json({ detail: 'Ce créneau est déjà pris' });
    }

    const reservation = new Reservation({
      id: uuidv4(),
      prestation_id,
      prestation_nom: prestation.nom,
      nom_client,
      email_client,
      telephone_client,
      date,
      heure_debut,
      heure_fin
    });

    await reservation.save();

    // Emails
    const clientHtml = `
      <html>
        <body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #2D2A26;\">
          <h2 style=\"color: #D8BAC3;\">Confirmation de réservation</h2>
          <p>Bonjour ${nom_client},</p>
          <p>Votre réservation a été confirmée avec succès !</p>
          <div style=\"background: #FBFDFF; padding: 20px; margin: 20px 0; border-left: 4px solid #D8BAC3;\">
            <h3>Détails de votre réservation :</h3>
            <p><strong>Prestation :</strong> ${prestation.nom}</p>
            <p><strong>Date :</strong> ${date}</p>
            <p><strong>Horaire :</strong> ${heure_debut} - ${heure_fin}</p>
          </div>
          <p>Nous vous attendons avec plaisir !</p>
        </body>
      </html>
    `;

    const adminHtml = `
      <html>
        <body style=\"font-family: Arial, sans-serif;\">
          <h2 style=\"color: #D8BAC3;\">Nouvelle réservation</h2>
          <div style=\"background: #FBFDFF; padding: 20px;\">
            <p><strong>Client :</strong> ${nom_client}</p>
            <p><strong>Email :</strong> ${email_client}</p>
            <p><strong>Téléphone :</strong> ${telephone_client}</p>
            <p><strong>Prestation :</strong> ${prestation.nom}</p>
            <p><strong>Date :</strong> ${date}</p>
            <p><strong>Horaire :</strong> ${heure_debut} - ${heure_fin}</p>
          </div>
        </body>
      </html>
    `;

    sendEmail(email_client, 'Confirmation de votre réservation', clientHtml);
    sendEmail(process.env.ADMIN_EMAIL, `Nouvelle réservation - ${prestation.nom}`, adminHtml);

    // Google Calendar (async)
    createCalendarEvent(reservation.toObject());

    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Contact
router.post('/contact', async (req, res) => {
  try {
    const { nom, email, telephone, message } = req.body;
    
    const contact = new Contact({
      id: uuidv4(),
      nom,
      email,
      telephone,
      message
    });

    await contact.save();

    const adminHtml = `
      <html>
        <body>
          <h2>Nouveau message de contact</h2>
          <p><strong>Nom :</strong> ${nom}</p>
          <p><strong>Email :</strong> ${email}</p>
          <p><strong>Téléphone :</strong> ${telephone}</p>
          <p><strong>Message :</strong></p>
          <p>${message}</p>
        </body>
      </html>
    `;

    sendEmail(process.env.ADMIN_EMAIL, 'Nouveau message de contact', adminHtml);

    res.json({ message: 'Message envoyé avec succès' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// ========== ADMIN ROUTES ==========

// Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ detail: 'Email ou mot de passe incorrect' });
    }

    const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    if (!isValid) {
      return res.status(401).json({ detail: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign({ sub: email }, process.env.JWT_SECRET_KEY, { expiresIn: '24h' });
    res.json({ access_token: token, token_type: 'bearer' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Dashboard
router.get('/admin/dashboard', authMiddleware, async (req, res) => {
  try {
    const total_prestations = await Prestation.countDocuments();
    const total_reservations = await Reservation.countDocuments();
    
    const today = new Date().toISOString().split('T')[0];
    const reservations_today = await Reservation.countDocuments({ date: today, statut: 'confirmed' });
    
    const messages_non_lus = await Contact.countDocuments({ lu: false });
    
    const recent_reservations = await Reservation.find({ statut: 'confirmed' })
      .sort({ created_at: -1 })
      .limit(5)
      .select('-_id -__v');

    res.json({
      total_prestations,
      total_reservations,
      reservations_today,
      messages_non_lus,
      recent_reservations
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Gestion Prestations
router.post('/admin/prestations', authMiddleware, async (req, res) => {
  try {
    const prestation = new Prestation({ ...req.body, id: uuidv4() });
    await prestation.save();
    res.json(prestation);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.put('/admin/prestations/:id', authMiddleware, async (req, res) => {
  try {
    const prestation = await Prestation.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    ).select('-_id -__v');
    
    if (!prestation) return res.status(404).json({ detail: 'Prestation non trouvée' });
    res.json(prestation);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.delete('/admin/prestations/:id', authMiddleware, async (req, res) => {
  try {
    const result = await Prestation.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ detail: 'Prestation non trouvée' });
    res.json({ message: 'Prestation supprimée' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Gestion Réservations
router.get('/admin/reservations', authMiddleware, async (req, res) => {
  try {
    const { date, statut } = req.query;
    let query = {};
    if (date) query.date = date;
    if (statut) query.statut = statut;

    const reservations = await Reservation.find(query)
      .sort({ date: -1 })
      .select('-_id -__v');
    
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.patch('/admin/reservations/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const reservation = await Reservation.findOneAndUpdate(
      { id: req.params.id },
      { statut: 'cancelled' },
      { new: true }
    );
    
    if (!reservation) return res.status(404).json({ detail: 'Réservation non trouvée' });
    res.json({ message: 'Réservation annulée' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Gestion Contacts
router.get('/admin/contacts', authMiddleware, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ created_at: -1 }).select('-_id -__v');
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.patch('/admin/contacts/:id/mark-read', authMiddleware, async (req, res) => {
  try {
    await Contact.findOneAndUpdate({ id: req.params.id }, { lu: true });
    res.json({ message: 'Message marqué comme lu' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.delete('/admin/contacts/:id', authMiddleware, async (req, res) => {
  try {
    const result = await Contact.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ detail: 'Message non trouvé' });
    res.json({ message: 'Message supprimé' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Horaires
router.get('/admin/horaires', authMiddleware, async (req, res) => {
  try {
    const { date_debut, date_fin } = req.query;
    let query = {};
    if (date_debut && date_fin) {
      query.date = { $gte: date_debut, $lte: date_fin };
    }
    
    const horaires = await Horaires.find(query).sort({ date: 1 }).select('-_id -__v');
    res.json(horaires);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.post('/admin/horaires', authMiddleware, async (req, res) => {
  try {
    await Horaires.findOneAndUpdate(
      { date: req.body.date },
      req.body,
      { upsert: true, new: true }
    );
    res.json({ message: 'Horaires enregistrés' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.post('/admin/horaires/batch', authMiddleware, async (req, res) => {
  try {
    const horaires = req.body;
    for (const h of horaires) {
      await Horaires.findOneAndUpdate({ date: h.date }, h, { upsert: true });
    }
    res.json({ message: `${horaires.length} horaires enregistrés` });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Google Calendar OAuth
router.get('/auth/google/login', authMiddleware, (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent'
  });
  res.json({ authorization_url: authUrl });
});

router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    
    await GoogleToken.deleteMany({});
    await GoogleToken.create(tokens);
    
    res.redirect('/admin/horaires');
  } catch (error) {
    res.status(400).json({ detail: error.message });
  }
});

router.get('/admin/google/status', authMiddleware, async (req, res) => {
  try {
    const token = await GoogleToken.findOne();
    res.json({ connected: !!token });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.delete('/admin/google/disconnect', authMiddleware, async (req, res) => {
  try {
    await GoogleToken.deleteMany({});
    res.json({ message: 'Google Calendar déconnecté' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
