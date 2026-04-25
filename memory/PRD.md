# Glowshape - PRD (Product Requirements Document)

## Problème original
Application de réservation pour institut de beauté "Glow & Shape" - site vitrine avec réservation en ligne, paiement différé Stripe, notifications email, et panneau d'administration complet.

## Personas utilisateurs
- **Clientes** : Réservent des soins en ligne, consultent les prestations et transformations
- **Administratrice** : Gère les prestations, réservations, contenus du site, paramètres

## Architecture technique
- **Frontend** : React + TailwindCSS + Framer Motion
- **Backend** : Node.js + Express.js
- **Base de données** : PostgreSQL + Sequelize ORM
- **Intégrations** : Stripe (paiements), Resend (emails), Google Calendar (sync rdv)

## Structure des fichiers clés
```
/app/backend/
  ├── server.js, index.js, models.js, routes.js, stripe-routes.js
  ├── cron-payment.js, create_admin.js
  ├── services/ (email.js, googleCalendar.js)
  ├── middleware/ (auth.js)
  └── .env

/app/frontend/src/
  ├── App.js
  ├── components/ (Navbar.js, Footer.js, ScrollToTop.js, ProtectedRoute.js, ImageUploader.js)
  ├── pages/ (Home.js, Prestations.js, Contact.js, Reservation.js, ReservationSuccess.js, AvantApres.js, CGU.js, CGV.js)
  └── pages/admin/ (AdminLogin, AdminDashboard, AdminPrestations, AdminReservations, AdminContacts, AdminParametres, AdminHoraires, AdminHomepage, AdminAvantApres, AdminTemoignages)
```

## Fonctionnalités implémentées

### Core (sessions précédentes)
- [x] Base PostgreSQL stabilisée
- [x] Paiement différé Stripe (SetupIntent → débit après prestation)
- [x] Sécurité backend (Helmet, Rate Limiter, CORS, validation)
- [x] Notifications email via Resend
- [x] Google Calendar - sync des rendez-vous
- [x] Carte interactive page Contact
- [x] Footer dynamique éditable
- [x] Scroll to top
- [x] Correction bug double-render page succès réservation
- [x] Correction logique créneaux Google Calendar

### Session actuelle (Fév 2026)
- [x] Pages CGU et CGV (légal) avec liens dans le footer
- [x] Correction des accents manquants (Footer, AdminParametres, liens)
- [x] Texte blanc navbar sur fond transparent (page d'accueil)
- [x] Retours à la ligne respectés (whitespace-pre-line sur textes dynamiques)
- [x] Bouton "Nouvelle catégorie" dans admin Prestations
- [x] Interface Google Calendar dans admin Paramètres (connexion/déconnexion)
- [x] Centrage images Avant/Après
- [x] Lien TikTok dans footer + champ admin (modèle DB + route + UI)
- [x] Correction flickering (suppression données hardcodées, loading state)

## Endpoints API clés
- `GET/POST /api/prestations` - Liste/création prestations
- `GET /api/categories` - Catégories distinctes
- `GET /api/site-settings` / `PUT /api/admin/site-settings` - Paramètres site (incl. tiktok_url)
- `GET/PUT /api/admin/homepage-content` - Contenu page d'accueil
- `GET /api/auth/google/login` - Démarrer OAuth Google Calendar
- `GET /api/auth/google/callback` - Callback OAuth
- `GET /api/admin/google/status` - Statut connexion Google
- `POST /api/stripe/create-setup-intent` - Paiement
- `POST /api/reservations` - Créer réservation

## Schéma DB clé
- `site_settings` : id, nom_institut, adresse, ville, telephone, email, facebook_url, instagram_url, **tiktok_url**, horaires_defaut
- `prestations` : id, nom, categorie, duree_minutes, prix_euros, description
- `reservations` : id, prestation_id, prestation_nom, nom_client, email_client, date, heure_debut, heure_fin, statut, stripe_*

## Backlog
- [ ] P2 - Intégrer Google My Business Reviews (reporté par l'utilisateur)
- [ ] P3 - Refactoring : décomposition server.js en modules routes séparés
