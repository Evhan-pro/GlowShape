const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  Prestation,
  Reservation,
  Contact,
  Horaires,
  GoogleToken,
  Admin,
  AvantApres,
  HomePageContent,
  Temoignage,
  SiteSettings
} = require('./models');

const { sendEmail } = require('./services/email');
const { createCalendarEvent, getCalendarEvents, oauth2Client } = require('./services/googleCalendar');
const { authMiddleware } = require('./middleware/auth');


// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Seules les images sont autorisées'));
  }
});

const router = express.Router();

// ========== PUBLIC ROUTES ==========

// Prestations
router.get('/prestations', async (req, res) => {
  try {
    const { categorie, prix_min, prix_max, duree_max, recherche } = req.query;
    let where = {};

    if (categorie) where.categorie = categorie;
    if (prix_min) where.prix_euros = { ...where.prix_euros, [Op.gte]: parseFloat(prix_min) };
    if (prix_max) where.prix_euros = { ...where.prix_euros, [Op.lte]: parseFloat(prix_max) };
    if (duree_max) where.duree_minutes = { [Op.lte]: parseInt(duree_max) };
    if (recherche) {
      where[Op.or] = [
        { nom: { [Op.iLike]: `%${recherche}%` } },
        { description: { [Op.iLike]: `%${recherche}%` } }
      ];
    }

    const prestations = await Prestation.findAll({ where });
    res.json(prestations);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get('/prestations/:id', async (req, res) => {
  try {
    const prestation = await Prestation.findOne({ where: { id: req.params.id } });
    if (!prestation) return res.status(404).json({ detail: 'Prestation non trouvée' });
    res.json(prestation);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const prestations = await Prestation.findAll({ attributes: ['categorie'], group: ['categorie'] });
    const categories = prestations.map(p => p.categorie);
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Homepage content (public)
router.get('/homepage-content', async (req, res) => {
  try {
    let content = await HomePageContent.findByPk(1);
    if (!content) content = await HomePageContent.create({ id: 1 });
    res.json(content);
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// Témoignages (public)
router.get('/temoignages', async (req, res) => {
  try {
    const items = await Temoignage.findAll({ order: [['created_at', 'DESC']] });
    res.json(items);
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// ========== ADMIN: AVANT / APRES ==========
router.get('/admin/avant-apres', authMiddleware, async (req, res) => {
  try {
    const items = await AvantApres.findAll({ order: [['ordre', 'ASC'], ['id', 'ASC']] });
    res.json(items);
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

router.post('/admin/avant-apres', authMiddleware, async (req, res) => {
  try {
    const created = await AvantApres.create(req.body);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ detail: e.message });
  }
});

router.put('/admin/avant-apres/:id', authMiddleware, async (req, res) => {
  try {
    const item = await AvantApres.findByPk(req.params.id);
    if (!item) return res.status(404).json({ detail: 'Introuvable' });

    await item.update(req.body);
    res.json(item);
  } catch (e) {
    res.status(400).json({ detail: e.message });
  }
});

router.delete('/admin/avant-apres/:id', authMiddleware, async (req, res) => {
  try {
    const item = await AvantApres.findByPk(req.params.id);
    if (!item) return res.status(404).json({ detail: 'Introuvable' });

    await item.destroy();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// ========== ADMIN: UPLOAD IMAGE ==========
router.post('/admin/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ detail: 'Aucun fichier reçu' });

    // Important: renvoyer un chemin public
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});
// ========== PUBLIC ROUTES ==========

// Site settings (public)
router.get('/site-settings', async (req, res) => {
  try {
    let settings = await SiteSettings.findByPk(1);
    if (!settings) settings = await SiteSettings.create({ id: 1 });
    res.json(settings);
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// Disponibilités
router.get('/disponibilites', async (req, res) => {
  try {
    const { date, prestation_id } = req.query;
    
    const prestation = await Prestation.findOne({ where: { id: prestation_id } });
    if (!prestation) return res.status(404).json({ detail: 'Prestation non trouvée' });

    const duree = prestation.duree_minutes;
    
    // Horaires personnalisés ou par défaut
    const horairesPerso = await Horaires.findOne({ where: { date } });
    
    if (horairesPerso && !horairesPerso.ouvert) {
      return res.json({ date, creneaux: [], ferme: true });
    }

    const heureOuverture = horairesPerso?.heure_ouverture || '09:00:00';
    const heureFermeture = horairesPerso?.heure_fermeture || '19:00:00';

    // Générer créneaux
    const creneaux = [];
    const [hO, mO] = heureOuverture.split(':').map(Number);
    const [hF, mF] = heureFermeture.split(':').map(Number);
    
    let currentMinutes = hO * 60 + mO;
    const endMinutes = hF * 60 + mF;

    // Réservations existantes
    const reservations = await Reservation.findAll({ 
      where: { date, statut: 'confirmed' }
    });
    
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

    // Bloquer événements Google Calendar
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

    const prestation = await Prestation.findOne({ where: { id: prestation_id } });
    if (!prestation) return res.status(404).json({ detail: 'Prestation non trouvée' });

    const [h, m] = heure_debut.split(':').map(Number);
    const totalMinutes = h * 60 + m + prestation.duree_minutes;
    const hFin = Math.floor(totalMinutes / 60);
    const mFin = totalMinutes % 60;
    const heure_fin = `${String(hFin).padStart(2, '0')}:${String(mFin).padStart(2, '0')}`;

    // Anti double-booking
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
      return res.status(409).json({ detail: 'Ce créneau est déjà pris' });
    }

    const reservation = await Reservation.create({
      prestation_id,
      prestation_nom: prestation.nom,
      nom_client,
      email_client,
      telephone_client,
      date,
      heure_debut,
      heure_fin
    });

    // Emails
    const clientHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000;">
          <h2 style="color: #D8BAC3;">Confirmation de réservation</h2>
          <p>Bonjour ${nom_client},</p>
          <p>Votre réservation a été confirmée avec succès !</p>
          <div style="background: #FBFDFF; padding: 20px; margin: 20px 0; border-left: 4px solid #D8BAC3;">
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
        <body style="font-family: Arial, sans-serif;">
          <h2 style="color: #D8BAC3;">Nouvelle réservation</h2>
          <div style="background: #FBFDFF; padding: 20px;">
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
    createCalendarEvent(reservation.toJSON());

    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

//Avant/Après
router.get('/avant-apres', async (req, res) => {
  try {
    const items = await AvantApres.findAll({
      order: [['ordre', 'ASC'], ['id', 'ASC']]
      // si tu as un champ actif : where: { actif: true }
    });
    res.json(items);
  } catch (e) {
    console.error('GET /avant-apres error:', e);
    res.status(500).json({ detail: e.message });
  }
});

// Contact
router.post('/contact', async (req, res) => {
  try {
    const { nom, email, telephone, message } = req.body;
    
    const contact = await Contact.create({ nom, email, telephone, message });

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

    if (!email || !password) {
      return res.status(400).json({ detail: 'Email et mot de passe requis' });
    }

    const admin = await Admin.findOne({ where: { email: String(email).toLowerCase().trim() } });

    if (!admin || !admin.is_active) {
      return res.status(401).json({ detail: 'Email ou mot de passe incorrect' });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ detail: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { sub: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '8h' }
    );

    res.json({ access_token: token, token_type: 'bearer' });
  } catch (error) {
    res.status(500).json({ detail: 'Erreur serveur' });
  }
});

// Dashboard
router.get('/admin/dashboard', authMiddleware, async (req, res) => {
  try {
    const total_prestations = await Prestation.count();
    const total_reservations = await Reservation.count();
    
    const today = new Date().toISOString().split('T')[0];
    const reservations_today = await Reservation.count({ where: { date: today, statut: 'confirmed' } });
    
    const messages_non_lus = await Contact.count({ where: { lu: false } });
    
    const recent_reservations = await Reservation.findAll({
      where: { statut: 'confirmed' },
      order: [['created_at', 'DESC']],
      limit: 5
    });

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

router.get('/admin/homepage-content', async (req, res) => {
  try {
    let content = await HomePageContent.findByPk(1);

    if (!content) {
      content = await HomePageContent.create({ id: 1 });
    }

    return res.json(content);
  } catch (e) {
    console.error('GET /homepage-content error:', e);
    return res.status(500).json({ detail: 'Failed to fetch homepage content' });
  }
});

router.put('/admin/homepage-content', authMiddleware, async (req, res) => {
  try {
    const allowed = [
      'hero_titre',
      'hero_sous_titre',
      'hero_image',
      'about_titre',
      'about_texte',
      'about_image',
      'cta_titre',
      'cta_texte',
      'faq_items'
    ];

    const data = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) data[k] = req.body[k];
    }

    // Upsert = crée si absent, update si présent
    const [row] = await HomePageContent.upsert(
      { id: 1, ...data },
      { returning: true }
    );

    return res.json(row);
  } catch (e) {
    console.error('PUT /admin/homepage-content error:', e);
    return res.status(500).json({ detail: 'Failed to update homepage content' });
  }
});


// GET Admin site-settings
router.get('/admin/site-settings', authMiddleware, async (req, res) => {
  try {
    let settings = await SiteSettings.findByPk(1);
    if (!settings) settings = await SiteSettings.create({ id: 1 });
    res.json(settings);
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// PUT Admin site-settings (footer + coordonnees)
router.put('/admin/site-settings', authMiddleware, async (req, res) => {
  try {
    let settings = await SiteSettings.findByPk(1);
    if (!settings) settings = await SiteSettings.create({ id: 1 });

    const fields = ['nom_institut', 'adresse', 'ville', 'telephone', 'email', 'facebook_url', 'instagram_url', 'tiktok_url', 'horaires_defaut'];
    const updateData = {};
    fields.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

    await SiteSettings.update(updateData, { where: { id: 1 } });
    const updated = await SiteSettings.findByPk(1);
    res.json(updated);
  } catch (e) {
    console.error('PUT /admin/site-settings error:', e);
    res.status(500).json({ detail: e.message });
  }
});


// Gestion Prestations
router.post('/admin/prestations', authMiddleware, async (req, res) => {
  try {
    const prestation = await Prestation.create(req.body);
    res.json(prestation);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.put('/admin/prestations/:id', authMiddleware, async (req, res) => {
  try {
    await Prestation.update(req.body, { where: { id: req.params.id } });
    const prestation = await Prestation.findOne({ where: { id: req.params.id } });
    
    if (!prestation) return res.status(404).json({ detail: 'Prestation non trouvée' });
    res.json(prestation);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.delete('/admin/prestations/:id', authMiddleware, async (req, res) => {
  try {
    const result = await Prestation.destroy({ where: { id: req.params.id } });
    if (result === 0) return res.status(404).json({ detail: 'Prestation non trouvée' });
    res.json({ message: 'Prestation supprimée' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Gestion Réservations
router.get('/admin/reservations', authMiddleware, async (req, res) => {
  try {
    const { date, statut } = req.query;
    let where = {};
    if (date) where.date = date;
    if (statut) where.statut = statut;

    const reservations = await Reservation.findAll({
      where,
      order: [['date', 'DESC']]
    });
    
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.patch('/admin/reservations/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const result = await Reservation.update({ statut: 'cancelled' }, { where: { id: req.params.id } });
    
    if (result[0] === 0) return res.status(404).json({ detail: 'Réservation non trouvée' });
    res.json({ message: 'Réservation annulée' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Gestion Contacts
router.get('/admin/contacts', authMiddleware, async (req, res) => {
  try {
    const contacts = await Contact.findAll({ order: [['created_at', 'DESC']] });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.patch('/admin/contacts/:id/mark-read', authMiddleware, async (req, res) => {
  try {
    await Contact.update({ lu: true }, { where: { id: req.params.id } });
    res.json({ message: 'Message marqué comme lu' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.delete('/admin/contacts/:id', authMiddleware, async (req, res) => {
  try {
    const result = await Contact.destroy({ where: { id: req.params.id } });
    if (result === 0) return res.status(404).json({ detail: 'Message non trouvé' });
    res.json({ message: 'Message supprimé' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Horaires
router.get('/admin/horaires', authMiddleware, async (req, res) => {
  try {
    const { date_debut, date_fin } = req.query;
    let where = {};
    if (date_debut && date_fin) {
      where.date = { [Op.between]: [date_debut, date_fin] };
    }
    
    const horaires = await Horaires.findAll({ where, order: [['date', 'ASC']] });
    res.json(horaires);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.post('/admin/horaires', authMiddleware, async (req, res) => {
  try {
    await Horaires.upsert(req.body);
    res.json({ message: 'Horaires enregistrés' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.post('/admin/horaires/batch', authMiddleware, async (req, res) => {
  try {
    const horaires = req.body;
    for (const h of horaires) {
      await Horaires.upsert(h);
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
    
    await GoogleToken.destroy({ where: {} });
    await GoogleToken.create(tokens);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/admin/parametres?google=connected`);
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/admin/parametres?google=error`);
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
    await GoogleToken.destroy({ where: {} });
    res.json({ message: 'Google Calendar déconnecté' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
