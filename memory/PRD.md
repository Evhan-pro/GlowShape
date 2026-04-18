# Glowshape - PRD

## Probleme Original
Application de reservation pour un institut de beaute "Glow & Shape" avec gestion des prestations, reservations en ligne et paiement differe Stripe.

## Architecture
- **Frontend**: React + TailwindCSS (port 3000)
- **Backend**: Node.js/Express + Sequelize ORM (port 8001)
- **Database**: PostgreSQL (glowandshape / glowshapeuser)
- **Paiements**: Stripe (Setup Intents pour paiement differe)
- **Emails**: Resend (MOCKED - en attente de cle API)
- **CRON**: node-cron debit automatique acomptes a 8h00

## Fonctionnalites Implementees
- [x] Site responsive
- [x] Scroll-to-top automatique
- [x] Footer dynamique texte blanc, editable depuis admin
- [x] Page Contact avec carte Google Maps interactive
- [x] Admin Parametres: edition complete footer/contact
- [x] Favicon logo.png + titre "GlowShape"
- [x] Images hero/about avec fallback quand BDD null
- [x] Listing prestations avec filtres
- [x] Flux reservation 3 etapes
- [x] Restriction 48h
- [x] Paiement differe Stripe
- [x] Anti-double-booking
- [x] Annulation avec logique 48h
- [x] Securite (helmet, CORS, rate limit)
- [x] Envoi emails reservation (MOCKED)

## Taches Restantes
### P1
- [ ] Fournir cle API Resend pour activer les emails
### P2
- [ ] Avis Google (integration API Google Places) - reporte par le client
- [ ] Gestion des categories de prestations (CRUD + page admin)

## Credentials
- Admin: admin@glowshape.fr / admin123
- Admin URL: /admin/login
- Carte test Stripe: 4242 4242 4242 4242 / Exp: 12/27 / CVC: 123
- Admin email notifications: contact.glowshape49@gmail.com
