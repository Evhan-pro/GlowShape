# Glowshape - PRD

## Probleme Original
Application de reservation pour un institut de beaute "Glow & Shape" avec gestion des prestations, reservations en ligne et paiement differe Stripe.

## Architecture
- **Frontend**: React + TailwindCSS (port 3000)
- **Backend**: Node.js/Express + Sequelize ORM (port 8001)
- **Database**: PostgreSQL (glowandshape / glowshapeuser)
- **Paiements**: Stripe (Setup Intents pour paiement differe)
- **CRON**: node-cron debit automatique acomptes a 8h00

## Securite
- Helmet (7 headers HTTP)
- CORS restreint (origines autorisees + pattern cluster)
- Rate limiting: global (200/15min), login (10/15min), Stripe (15/5min)
- Validation input sur tous les endpoints sensibles
- JWT 8h, validation token renforcee
- Fail fast si variables critiques manquantes
- Toutes les cles dans .env

## Flux de Paiement Differe
1. `POST /api/stripe/create-setup-intent` -> Client Stripe + SetupIntent (PAS de reservation)
2. Frontend: `stripe.confirmCardSetup()` -> Valide la carte
3. `POST /api/stripe/confirm-and-book` -> Verifie succeeded + anti-double-booking -> Cree reservation
4. CRON (8h00 jour J): Debite acompte 30%
5. Annulation >48h: gratuite. Annulation <48h: acompte debite.

## Tests Valides (18/18 + testing agent 100%)
- Listing prestations (14), Categories (5), Disponibilites (19 creneaux)
- Restriction 48h, Setup Intent sans reservation, Rejet sans carte
- Validation input, Reservation confirmee, Creneaux bloques
- Anti-double-booking, Annulation >48h gratuite, Annulation <48h penalite
- Creneaux liberes apres annulation, CRON debit, Securite headers
- Frontend: homepage, prestations, reservation 3 etapes, admin, mobile responsive

## Taches Restantes
### P2 - Futur
- [ ] Gestion des categories de prestations (CRUD + page admin)

## Credentials
- Admin: admin@glowshape.fr / admin123
