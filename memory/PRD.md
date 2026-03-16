# Glowshape - PRD

## Problème Original
Application de réservation pour un institut de beauté "Glow & Shape" avec gestion des prestations, réservations en ligne et paiement différé Stripe.

## Architecture
- **Frontend**: React + TailwindCSS (port 3000)
- **Backend**: Node.js/Express + Sequelize ORM (port 8001)
- **Database**: PostgreSQL (glowandshape / glowshapeuser)
- **Paiements**: Stripe (Setup Intents pour paiement différé)

## Fonctionnalités Implémentées
- [x] Site responsive (pages publiques + admin)
- [x] Navigation mobile avec fond opaque
- [x] Listing des prestations avec filtres (catégorie, prix, durée, recherche)
- [x] Flux de réservation en 3 étapes (prestation → date/heure → infos client)
- [x] Restriction de réservation 48h à l'avance
- [x] Page d'accueil avec hero, prestations phares, témoignages, FAQ
- [x] Panel admin (dashboard, prestations, réservations, contacts, horaires, avant/après)
- [x] Login admin (admin@glowshape.fr / admin123)
- [x] Intégration Google Calendar (optionnelle)
- [x] Formulaire de contact
- [x] Upload d'images

## Bugs Corrigés (Session actuelle - Mars 2026)
- [x] PostgreSQL réinstallé et stabilisé sous supervisor
- [x] Erreur `filteredPrestations.map is not a function` — ajout Array.isArray checks
- [x] Erreur `Cannot read properties of undefined (reading 'length')` — creneaux défensif
- [x] Images hero/about cassées — mise à jour homepage_content en BDD
- [x] Colonnes Stripe manquantes dans la table reservations — ALTER TABLE
- [x] Tables manquantes (avant_apres, admins, etc.) — sequelize.sync({alter: true})
- [x] Bug temoignages endpoint — createdAt → created_at

## Tâches En Cours / À Faire

### P0 - Prioritaire
- [ ] Finaliser l'intégration paiement différé Stripe (SetupIntent, cron-payment.js)
- [ ] Implémenter la logique d'annulation (pénalité 30% si < 48h)

### P1 - Important
- [ ] Activer le script cron-payment.js dans le serveur principal
- [ ] Implémenter l'annulation de réservation (API + interface client/admin)

### P2 - Futur
- [ ] Gestion des catégories de prestations (CRUD + page admin)

## Credentials
- Admin: admin@glowshape.fr / admin123
- Stripe PK: pk_test_51TBc5lRow7O4W1B5vzUmAfu1JM4zi27p5AXpwIBVOIJhR0OaUVuCbtrVm6L632KddgVRD855hMDtbFSSSkIKGBgt00rbDxFp2J
- Stripe SK: sk_test_51TBc5lRow7O4W1B5lSSVJZPsRhyL9v7Y4VczxKs5EcexYxkHKpTnwYV43F2BAgITIRl6dtpauAXrTQoVi5uz62bL00CZb6oUXD
