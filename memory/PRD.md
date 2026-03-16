# Glowshape - PRD

## Probleme Original
Application de reservation pour un institut de beaute "Glow & Shape" avec gestion des prestations, reservations en ligne et paiement differe Stripe.

## Architecture
- **Frontend**: React + TailwindCSS (port 3000)
- **Backend**: Node.js/Express + Sequelize ORM (port 8001)
- **Database**: PostgreSQL (glowandshape / glowshapeuser)
- **Paiements**: Stripe (Setup Intents pour paiement differe)
- **CRON**: node-cron debit automatique acomptes a 8h00

## Securite Implementee
- Helmet (7 headers HTTP: strict-transport-security, x-content-type-options, x-frame-options, etc.)
- CORS restreint aux origines autorisees uniquement
- Rate limiting: global (200 req/15min), login (10/15min), Stripe (15/5min)
- Validation input sur tous les endpoints sensibles (champs requis, format email)
- JWT avec expiration 8h, validation token renforcee
- Fail fast si variables d'environnement critiques manquantes
- Toutes les cles API dans .env (aucune valeur hardcodee)
- Pas de messages d'erreur revelant des details internes en production

## Flux de Paiement
1. `POST /api/stripe/create-setup-intent` -> Cree client Stripe + SetupIntent. PAS de reservation creee.
2. Frontend: `stripe.confirmCardSetup()` -> Valide la carte
3. `POST /api/stripe/confirm-and-book` -> Verifie SetupIntent succeeded + anti-double-booking -> Cree reservation UNIQUEMENT si carte validee
4. CRON (8h00 jour J): Debite automatiquement l'acompte de 30%
5. Annulation >48h: gratuite. Annulation <48h: acompte debite.

## Fonctionnalites Implementees
- [x] Site responsive (pages publiques + admin)
- [x] Navigation mobile avec fond opaque
- [x] Listing des prestations avec filtres
- [x] Flux de reservation en 3 etapes
- [x] Restriction de reservation 48h a l'avance
- [x] Paiement differe Stripe - SetupIntent
- [x] CRON debit automatique acomptes
- [x] Annulation avec logique 48h
- [x] Protection: reservation creee UNIQUEMENT si carte validee
- [x] Anti-double-booking
- [x] Securite maximale (helmet, rate limit, CORS, validation)
- [x] Toutes les cles dans .env

## Taches Restantes
### P2 - Futur
- [ ] Gestion des categories de prestations (CRUD + page admin)

## Credentials
- Admin: admin@glowshape.fr / admin123
