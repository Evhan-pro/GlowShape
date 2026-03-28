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

## Flux de Paiement Differe
1. create-setup-intent -> Client Stripe + SetupIntent (PAS de reservation)
2. Frontend: stripe.confirmCardSetup() -> Valide la carte
3. confirm-and-book -> Verifie succeeded + anti-double-booking -> Cree reservation
4. CRON (8h00 jour J): Debite acompte 30%
5. Annulation >48h: gratuite. Annulation <48h: acompte debite.

## Bugs Corriges (Session actuelle)
- [x] PostgreSQL reinstalle et stabilise
- [x] filteredPrestations.map is not a function
- [x] Cannot read properties of undefined (reading length)
- [x] Images hero/about cassees
- [x] Reservations creees meme si paiement echoue
- [x] Message d'erreur apres reservation reussie (sessionStorage -> React Router state)
- [x] Creneaux affichaient seulement l'heure de debut (maintenant debut-fin)
- [x] CORS cluster origins
- [x] Rate limiter proxy config

## Fonctionnalites Implementees
- [x] Site responsive
- [x] Listing prestations avec filtres
- [x] Flux reservation 3 etapes
- [x] Restriction 48h
- [x] Paiement differe Stripe
- [x] CRON debit automatique
- [x] Annulation avec logique 48h
- [x] Anti-double-booking
- [x] Securite maximale
- [x] Page succes reservation (React Router state)

## Taches Restantes
### P2 - Futur
- [ ] Gestion des categories de prestations (CRUD + page admin)
