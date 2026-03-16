# 🧪 GUIDE DE TESTS COMPLET - PAIEMENT DIFFÉRÉ

## 📋 PRÉREQUIS

Avant de commencer les tests, vérifiez que :
- ✅ Backend démarré : `sudo supervisorctl status backend`
- ✅ Frontend démarré : `sudo supervisorctl status frontend`
- ✅ PostgreSQL actif : `pg_isready`
- ✅ Colonnes BDD ajoutées (voir section 1)

---

## 🗄️ SECTION 1 : VÉRIFIER LA BASE DE DONNÉES

### Test 1.1 : Vérifier les colonnes Stripe
```bash
sudo -u postgres psql -d glowandshape -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND column_name LIKE 'stripe%'
ORDER BY column_name;
"
```

**✅ Résultat attendu :**
```
       column_name        |     data_type     
--------------------------+-------------------
 stripe_charge_id         | character varying
 stripe_customer_id       | character varying
 stripe_payment_intent_id | character varying
 stripe_payment_method_id | character varying
 stripe_setup_intent_id   | character varying
(5 rows)
```

### Test 1.2 : Vérifier les prestations
```bash
curl -s http://localhost:8001/api/prestations | jq '. | length'
```

**✅ Résultat attendu :** Un nombre (ex: `14`)

---

## 🔧 SECTION 2 : TESTER L'API BACKEND

### Test 2.1 : Setup Intent (Enregistrement carte)
```bash
curl -X POST http://localhost:8001/api/stripe/create-setup-intent \
  -H "Content-Type: application/json" \
  -d '{
    "prestation_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "nom_client": "Test Client",
    "email_client": "test@example.com",
    "telephone_client": "0612345678",
    "date": "2025-02-15",
    "heure_debut": "14:00",
    "heure_fin": "15:30"
  }' | jq .
```

**✅ Résultat attendu :**
```json
{
  "clientSecret": "seti_xxx...",
  "reservationId": "uuid-xxx",
  "setupIntentId": "seti_xxx"
}
```

**📝 Note :** Gardez le `reservationId` pour les tests suivants

---

### Test 2.2 : Vérifier la réservation dans la BDD
```bash
# Remplacez RESERVATION_ID par l'ID du test précédent
sudo -u postgres psql -d glowandshape -c "
SELECT 
  id, 
  nom_client, 
  date, 
  statut,
  statut_paiement, 
  montant_total, 
  montant_acompte,
  stripe_customer_id,
  stripe_setup_intent_id
FROM reservations 
WHERE id = 'RESERVATION_ID';
"
```

**✅ Résultat attendu :**
- `statut` = `confirmed`
- `statut_paiement` = `pending`
- `montant_total` = prix de la prestation
- `montant_acompte` = 30% du total
- `stripe_customer_id` = rempli
- `stripe_setup_intent_id` = rempli

---

### Test 2.3 : Débiter l'acompte manuellement
```bash
# Remplacez RESERVATION_ID
curl -X POST http://localhost:8001/api/stripe/charge-deposit/RESERVATION_ID \
  -H "Content-Type: application/json" | jq .
```

**✅ Résultat attendu :**
```json
{
  "success": true,
  "message": "Acompte de XX.XX€ débité avec succès",
  "payment_intent_id": "pi_xxx"
}
```

**⚠️ IMPORTANT :** Ce test va VRAIMENT débiter la carte de test ! Utilisez uniquement la carte Stripe test.

---

### Test 2.4 : Vérifier le statut après débit
```bash
sudo -u postgres psql -d glowandshape -c "
SELECT 
  id, 
  nom_client,
  statut_paiement, 
  stripe_payment_intent_id,
  date_paiement
FROM reservations 
WHERE id = 'RESERVATION_ID';
"
```

**✅ Résultat attendu :**
- `statut_paiement` = `paid`
- `stripe_payment_intent_id` = rempli
- `date_paiement` = timestamp actuel

---

## 🕐 SECTION 3 : TESTER LE SYSTÈME CRON

### Test 3.1 : Créer une réservation pour aujourd'hui
```bash
# Obtenir la date d'aujourd'hui
TODAY=$(date +%Y-%m-%d)
echo "Date d'aujourd'hui: $TODAY"

# Créer une réservation pour aujourd'hui (SANS débiter encore)
curl -X POST http://localhost:8001/api/stripe/create-setup-intent \
  -H "Content-Type: application/json" \
  -d "{
    \"prestation_id\": \"a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d\",
    \"nom_client\": \"Client CRON Test\",
    \"email_client\": \"cron@test.com\",
    \"telephone_client\": \"0699887766\",
    \"date\": \"$TODAY\",
    \"heure_debut\": \"16:00\",
    \"heure_fin\": \"17:00\"
  }" | jq .
```

### Test 3.2 : Lister les réservations du jour en attente
```bash
TODAY=$(date +%Y-%m-%d)
sudo -u postgres psql -d glowandshape -c "
SELECT 
  id, 
  nom_client, 
  date, 
  statut_paiement,
  montant_acompte
FROM reservations 
WHERE date = '$TODAY' 
AND statut_paiement = 'pending';
"
```

**✅ Résultat attendu :** Au moins 1 réservation

### Test 3.3 : Débiter TOUS les acomptes du jour (CRON manuel)
```bash
curl -X POST http://localhost:8001/api/stripe/charge-today-deposits \
  -H "Content-Type: application/json" | jq .
```

**✅ Résultat attendu :**
```json
{
  "success": true,
  "message": "Débits terminés : X succès, Y échecs",
  "results": {
    "total": X,
    "success": X,
    "failed": Y,
    "details": [...]
  }
}
```

### Test 3.4 : Vérifier que les débits ont fonctionné
```bash
TODAY=$(date +%Y-%m-%d)
sudo -u postgres psql -d glowandshape -c "
SELECT 
  id, 
  nom_client, 
  statut_paiement,
  date_paiement
FROM reservations 
WHERE date = '$TODAY';
"
```

**✅ Résultat attendu :** Toutes les réservations ont `statut_paiement = 'paid'`

---

## ❌ SECTION 4 : TESTER LES ANNULATIONS

### Cas 4.1 : Annulation > 48h (GRATUITE)

#### Étape 1 : Créer une réservation dans 3 jours
```bash
FUTURE_DATE=$(date -d "+3 days" +%Y-%m-%d)
echo "Date future: $FUTURE_DATE"

RESERVATION_RESPONSE=$(curl -s -X POST http://localhost:8001/api/stripe/create-setup-intent \
  -H "Content-Type: application/json" \
  -d "{
    \"prestation_id\": \"a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d\",
    \"nom_client\": \"Test Annulation >48h\",
    \"email_client\": \"annulation48@test.com\",
    \"telephone_client\": \"0611223344\",
    \"date\": \"$FUTURE_DATE\",
    \"heure_debut\": \"10:00\",
    \"heure_fin\": \"11:00\"
  }")

RESERVATION_ID=$(echo $RESERVATION_RESPONSE | jq -r '.reservationId')
echo "Reservation ID: $RESERVATION_ID"
```

#### Étape 2 : Annuler la réservation
```bash
curl -X POST http://localhost:8001/api/stripe/cancel-reservation/$RESERVATION_ID \
  -H "Content-Type: application/json" | jq .
```

**✅ Résultat attendu :**
```json
{
  "success": true,
  "message": "Réservation annulée gratuitement (plus de 48h avant le RDV)",
  "montant_debite": 0,
  "heures_avant_rdv": "XX.XX"
}
```

#### Étape 3 : Vérifier dans la BDD
```bash
sudo -u postgres psql -d glowandshape -c "
SELECT 
  id, 
  nom_client, 
  statut,
  statut_paiement,
  date_annulation
FROM reservations 
WHERE id = '$RESERVATION_ID';
"
```

**✅ Résultat attendu :**
- `statut` = `cancelled`
- `statut_paiement` = `no_charge`
- `date_annulation` = timestamp

---

### Cas 4.2 : Annulation < 48h (DÉBITE 30%)

#### Étape 1 : Créer une réservation demain
```bash
TOMORROW=$(date -d "+1 day" +%Y-%m-%d)
echo "Date demain: $TOMORROW"

RESERVATION_RESPONSE=$(curl -s -X POST http://localhost:8001/api/stripe/create-setup-intent \
  -H "Content-Type: application/json" \
  -d "{
    \"prestation_id\": \"a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d\",
    \"nom_client\": \"Test Annulation <48h\",
    \"email_client\": \"annulation24@test.com\",
    \"telephone_client\": \"0655443322\",
    \"date\": \"$TOMORROW\",
    \"heure_debut\": \"14:00\",
    \"heure_fin\": \"15:00\"
  }")

RESERVATION_ID=$(echo $RESERVATION_RESPONSE | jq -r '.reservationId')
echo "Reservation ID: $RESERVATION_ID"
```

#### Étape 2 : Annuler la réservation
```bash
curl -X POST http://localhost:8001/api/stripe/cancel-reservation/$RESERVATION_ID \
  -H "Content-Type: application/json" | jq .
```

**✅ Résultat attendu :**
```json
{
  "success": true,
  "message": "Annulation moins de 48h avant : acompte de XX.XX€ (30%) débité",
  "montant_debite": XX.XX,
  "heures_avant_rdv": "XX.XX"
}
```

**⚠️ ATTENTION :** Ceci va DÉBITER la carte test !

#### Étape 3 : Vérifier dans la BDD
```bash
sudo -u postgres psql -d glowandshape -c "
SELECT 
  id, 
  nom_client, 
  statut,
  statut_paiement,
  stripe_payment_intent_id,
  date_paiement,
  date_annulation
FROM reservations 
WHERE id = '$RESERVATION_ID';
"
```

**✅ Résultat attendu :**
- `statut` = `cancelled`
- `statut_paiement` = `paid`
- `stripe_payment_intent_id` = rempli
- `date_paiement` = timestamp
- `date_annulation` = timestamp

---

## 🌐 SECTION 5 : TESTER L'INTERFACE FRONTEND

### Test 5.1 : Page de réservation
```bash
# Vérifier que la page charge
curl -s http://localhost:3000/reservation | grep -o "<title>.*</title>"
```

**✅ Résultat attendu :** `<title>Emergent | Fullstack App</title>`

### Test 5.2 : Test manuel dans le navigateur

1. **Ouvrir** : `http://localhost:3000/reservation`

2. **Étape 1 - Prestation** :
   - Choisir une prestation
   - Cliquer sur une carte
   - ✅ Vérifier que ça passe à l'étape 2

3. **Étape 2 - Date & Créneau** :
   - Les dates doivent commencer **48h après aujourd'hui**
   - Sélectionner une date
   - Sélectionner un créneau
   - Cliquer "Continuer"
   - ✅ Vérifier que ça passe à l'étape 3

4. **Étape 3 - Informations & Carte** :
   - Remplir nom, email, téléphone
   - ✅ Le formulaire de carte doit apparaître
   - ✅ Voir le message : "Aucun débit immédiat"
   - ✅ Voir les montants : Total / Acompte 30% / Reste 70%

5. **Entrer carte de test** :
   - Numéro : `4242 4242 4242 4242`
   - Date : `12/28`
   - CVC : `123`
   - Code postal : `75001`

6. **Cliquer "Confirmer et enregistrer la carte"**
   - ✅ Message "Enregistrement en cours..."
   - ✅ Redirection vers `/reservation-success`

7. **Page de succès** :
   - ✅ Voir "Carte Enregistrée !"
   - ✅ Voir le message : "Aucun débit aujourd'hui"
   - ✅ Voir : "Acompte débité le jour J"
   - ✅ Voir tous les détails de la réservation

---

## 🚨 SECTION 6 : TESTER LES CAS D'ERREUR

### Test 6.1 : Carte refusée
```bash
# Utiliser la carte qui échoue
# Dans le navigateur, entrer :
# Numéro: 4000 0000 0000 0002
# Date: 12/28
# CVC: 123
```

**✅ Résultat attendu :** Message d'erreur clair

### Test 6.2 : Prestation inexistante
```bash
curl -X POST http://localhost:8001/api/stripe/create-setup-intent \
  -H "Content-Type: application/json" \
  -d '{
    "prestation_id": "00000000-0000-0000-0000-000000000000",
    "nom_client": "Test",
    "email_client": "test@test.com",
    "telephone_client": "0612345678",
    "date": "2025-02-15",
    "heure_debut": "14:00",
    "heure_fin": "15:00"
  }' | jq .
```

**✅ Résultat attendu :**
```json
{
  "error": "Prestation non trouvée"
}
```

### Test 6.3 : Débiter une réservation déjà débitée
```bash
# Utiliser un RESERVATION_ID déjà payé
curl -X POST http://localhost:8001/api/stripe/charge-deposit/RESERVATION_ID | jq .
```

**✅ Résultat attendu :**
```json
{
  "error": "Acompte déjà débité"
}
```

---

## ⏰ SECTION 7 : TESTER LE SERVICE CRON

### Test 7.1 : Démarrer le CRON manuellement
```bash
cd /app/backend
node cron-payment.js
```

**✅ Résultat attendu :**
```
✅ Service CRON démarré - Débit automatique des acomptes à 8h00 chaque jour
```

**📝 Note :** Le processus reste actif. Appuyer sur `Ctrl+C` pour arrêter.

### Test 7.2 : Vérifier les logs CRON (si démarré avec supervisor)
```bash
tail -f /var/log/supervisor/cron-payment.out.log
```

### Test 7.3 : Modifier le CRON pour test (toutes les 2 minutes)
```bash
# Éditer temporairement le fichier
nano /app/backend/cron-payment.js
```

Changer :
```javascript
// Avant
cron.schedule('0 8 * * *', async () => {

// Après (test - toutes les 2 minutes)
cron.schedule('*/2 * * * *', async () => {
```

Puis :
```bash
# Redémarrer le CRON
pkill -f "node cron-payment.js"
node /app/backend/cron-payment.js
```

**✅ Résultat attendu :** Toutes les 2 minutes, voir les débits dans les logs

**⚠️ NE PAS OUBLIER** de remettre `'0 8 * * *'` après le test !

---

## 📊 SECTION 8 : RÉCAPITULATIF DES TESTS

### Checklist complète

- [ ] 1.1 - Colonnes BDD vérifiées
- [ ] 1.2 - Prestations chargées
- [ ] 2.1 - Setup Intent fonctionne
- [ ] 2.2 - Réservation créée en BDD
- [ ] 2.3 - Débit manuel fonctionne
- [ ] 2.4 - Statut mis à jour après débit
- [ ] 3.1 - Réservation du jour créée
- [ ] 3.2 - Réservations en attente listées
- [ ] 3.3 - CRON débite tous les acomptes
- [ ] 3.4 - Tous les statuts passent à "paid"
- [ ] 4.1 - Annulation > 48h gratuite
- [ ] 4.2 - Annulation < 48h débite 30%
- [ ] 5.1 - Page frontend charge
- [ ] 5.2 - Flow complet de réservation
- [ ] 6.1 - Carte refusée gérée
- [ ] 6.2 - Prestation inexistante gérée
- [ ] 6.3 - Double débit bloqué
- [ ] 7.1 - CRON démarre
- [ ] 7.2 - Logs CRON consultables
- [ ] 7.3 - CRON teste toutes les 2 min

---

## 🎯 TESTS DE SCÉNARIOS RÉELS

### Scénario A : Client réserve et vient au RDV

1. Client réserve pour dans 3 jours ✅
2. Carte enregistrée, aucun débit ✅
3. Le jour J à 8h00, CRON débite 30% ✅
4. Client vient, paie 70% au salon ✅

### Scénario B : Client annule 3 jours avant

1. Client réserve pour dans 5 jours ✅
2. Client annule 2 jours après (reste 3 jours) ✅
3. Annulation gratuite, aucun débit ✅

### Scénario C : Client annule la veille

1. Client réserve pour demain ✅
2. Client annule aujourd'hui (< 48h) ✅
3. 30% débité automatiquement ✅

---

## 🔍 COMMANDES UTILES POUR DEBUG

### Voir toutes les réservations
```bash
sudo -u postgres psql -d glowandshape -c "
SELECT 
  id, 
  nom_client, 
  date, 
  statut,
  statut_paiement, 
  montant_acompte,
  created_at
FROM reservations 
ORDER BY created_at DESC 
LIMIT 10;
"
```

### Compter les réservations par statut
```bash
sudo -u postgres psql -d glowandshape -c "
SELECT 
  statut_paiement, 
  COUNT(*) as nombre
FROM reservations 
GROUP BY statut_paiement;
"
```

### Voir les réservations avec carte enregistrée mais pas encore débitée
```bash
sudo -u postgres psql -d glowandshape -c "
SELECT 
  id, 
  nom_client, 
  date, 
  montant_acompte
FROM reservations 
WHERE stripe_payment_method_id IS NOT NULL 
AND statut_paiement = 'pending'
ORDER BY date;
"
```

### Nettoyer les réservations de test
```bash
sudo -u postgres psql -d glowandshape -c "
DELETE FROM reservations 
WHERE email_client LIKE '%test%';
"
```

---

## ✅ VALIDATION FINALE

Si TOUS les tests passent :
- ✅ Le système de paiement différé fonctionne
- ✅ Les acomptes sont débités le jour J
- ✅ Les annulations sont gérées correctement
- ✅ Le CRON automatise les débits
- ✅ L'interface frontend est opérationnelle

**🎉 Système prêt pour la production !**

---

**📧 Support :** Consultez `/app/PAIEMENT_DIFFERE_COMPLET.md` pour plus de détails
