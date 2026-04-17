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
- [x] Site responsive (pages publiques + admin)
- [x] Scroll-to-top automatique (changement page + etapes reservation)
- [x] Footer dynamique en texte blanc, charge depuis site_settings
- [x] Page Contact avec carte Google Maps interactive (adresse dynamique)
- [x] Admin Parametres: edition complete (nom, adresse, ville, tel, email, reseaux, horaires)
- [x] Listing prestations avec filtres
- [x] Flux reservation 3 etapes
- [x] Restriction 48h
- [x] Paiement differe Stripe (SetupIntent, confirm-and-book)
- [x] CRON debit automatique acomptes
- [x] Annulation avec logique 48h
- [x] Anti-double-booking
- [x] Securite maximale (helmet, CORS, rate limit, validation)
- [x] Envoi emails reservation (MOCKED - Resend configure mais cle API manquante)

## Taches Restantes
### P1
- [ ] Fournir cle API Resend pour activer les emails
### P2
- [ ] Gestion des categories de prestations (CRUD + page admin)

## Credentials
- Admin: admin@glowshape.fr / admin123
- Admin email notifications: contact.glowshape49@gmail.com
