# Glowshape - PRD

## Probleme Original
Application de reservation pour un institut de beaute "Glow & Shape" avec gestion des prestations, reservations en ligne et paiement differe Stripe.

## Architecture
- **Frontend**: React + TailwindCSS (port 3000)
- **Backend**: Node.js/Express + Sequelize ORM (port 8001)
- **Database**: PostgreSQL (glowandshape / glowshapeuser)
- **Paiements**: Stripe (Setup Intents pour paiement differe)
- **CRON**: node-cron debit automatique acomptes a 8h00

## Flux de Paiement (Corrige)
1. `POST /api/stripe/create-setup-intent` → Cree client Stripe + SetupIntent. **PAS de reservation creee.**
2. Frontend: `stripe.confirmCardSetup()` → Valide la carte
3. `POST /api/stripe/confirm-and-book` → Verifie que SetupIntent est `succeeded` + anti-double-booking → Cree la reservation **UNIQUEMENT si carte validee**
4. CRON (8h00 jour J): Debite automatiquement l'acompte de 30%
5. Annulation >48h: gratuite. Annulation <48h: acompte debite.

## Fonctionnalites Implementees
- [x] Site responsive (pages publiques + admin)
- [x] Navigation mobile avec fond opaque
- [x] Listing des prestations avec filtres (categorie, prix, duree, recherche)
- [x] Flux de reservation en 3 etapes (prestation → date/heure → infos client + carte)
- [x] Restriction de reservation 48h a l'avance
- [x] Paiement differe Stripe - SetupIntent (carte enregistree, debit jour J)
- [x] CRON debit automatique acomptes a 8h00 chaque jour
- [x] Annulation avec logique 48h (gratuit >48h, penalite <48h)
- [x] Protection: reservation creee UNIQUEMENT si carte validee
- [x] Anti-double-booking a la confirmation
- [x] Page de succes reservation avec details paiement
- [x] Page d'accueil avec hero, prestations phares, temoignages, FAQ
- [x] Panel admin (dashboard, prestations, reservations, contacts, horaires, avant/apres)
- [x] Login admin (admin@glowshape.fr / admin123)
- [x] Integration Google Calendar (optionnelle)
- [x] Formulaire de contact
- [x] Upload d'images

## Bugs Corriges (Mars 2026)
- [x] PostgreSQL reinstalle et stabilise sous supervisor
- [x] Erreur filteredPrestations.map — ajout Array.isArray checks
- [x] Erreur Cannot read properties of undefined (reading length) — creneaux defensif
- [x] Images hero/about cassees — mise a jour homepage_content en BDD
- [x] Colonnes Stripe manquantes — ALTER TABLE + sequelize.sync({alter: true})
- [x] Bug temoignages endpoint — createdAt → created_at
- [x] Reservations creees meme si paiement echoue — refactorisation complete du flux

## Taches Restantes

### P2 - Futur
- [ ] Gestion des categories de prestations (CRUD + page admin)

## Credentials
- Admin: admin@glowshape.fr / admin123
- Stripe PK: pk_test_51TBc5lRow7O4W1B5vzUmAfu1JM4zi27p5AXpwIBVOIJhR0OaUVuCbtrVm6L632KddgVRD855hMDtbFSSSkIKGBgt00rbDxFp2J
- Stripe SK: sk_test_51TBc5lRow7O4W1B5lSSVJZPsRhyL9v7Y4VczxKs5EcexYxkHKpTnwYV43F2BAgITIRl6dtpauAXrTQoVi5uz62bL00CZb6oUXD
