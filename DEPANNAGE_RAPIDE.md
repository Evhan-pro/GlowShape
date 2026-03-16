# 🔧 GUIDE DE DÉPANNAGE RAPIDE

## ❌ PROBLÈME 1 : Erreur après sélection du jour (réservation)

### Symptôme :
- Page de réservation bloque après avoir sélectionné une date
- Erreur JavaScript dans la console
- Page blanche ou ne charge pas

### ✅ Solutions :

#### Solution 1 : Vérifier les logs frontend
```bash
tail -n 50 /var/log/supervisor/frontend.err.log
```

#### Solution 2 : Redémarrer le frontend
```bash
sudo supervisorctl restart frontend
sleep 5
sudo supervisorctl status frontend
```

#### Solution 3 : Vérifier la compilation
```bash
tail -n 30 /var/log/supervisor/frontend.out.log
```
**Attendu :** `webpack compiled with X warning` (pas d'erreur critique)

#### Solution 4 : Tester l'API créneaux
```bash
# Obtenir une date future
FUTURE_DATE=$(date -d "+3 days" +%Y-%m-%d)

# Obtenir l'ID d'une prestation
PRESTATION_ID=$(curl -s http://localhost:8001/api/prestations | jq -r '.[0].id')

# Tester l'API créneaux
curl -s "http://localhost:8001/api/creneaux?date=$FUTURE_DATE&prestation_id=$PRESTATION_ID" | jq .
```
**Attendu :** Liste de créneaux avec `disponible: true/false`

---

## ❌ PROBLÈME 2 : Images ne s'affichent pas

### Symptôme :
- Carré vide ou image cassée
- Logo manquant
- Images hero/about vides

### ✅ Solutions :

#### Solution 1 : Vérifier les images dans la BDD
```bash
sudo -u postgres psql -d glowandshape -c "
SELECT 
  id, 
  LENGTH(hero_image) as hero_len, 
  LENGTH(about_image) as about_len 
FROM homepage_content;
"
```
**Problème si :** `hero_len` ou `about_len` est NULL ou 0

**Fix :**
```bash
sudo -u postgres psql -d glowandshape << 'EOF'
UPDATE homepage_content 
SET 
  hero_image = 'https://images.unsplash.com/photo-1722350766824-f8520e9676ac?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwyfHx3b21hbiUyMGZhY2lhbCUyMHRyZWF0bWVudCUyMGNsb3NlJTIwdXAlMjBhZXN0aGV0aWN8ZW58MHx8fHwxNzY2MTA1Mjk5fDA&ixlib=rb-4.1.0&q=85',
  about_image = 'https://images.unsplash.com/photo-1763485956229-a5e1396f7d3a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBzcGElMjBpbnRlcmlvciUyMGJlaWdlJTIwc3RvbmUlMjBtaW5pbWFsaXN0fGVufDB8fHx8MTc2NjEwNTI5N3ww&ixlib=rb-4.1.0&q=85'
WHERE id = 1;
EOF
```

#### Solution 2 : Vérifier que les logos existent
```bash
ls -lh /app/frontend/public/*.png
```
**Attendu :**
```
-rw-r--r-- 1 root root 1.4M logo_glowshape.png
-rw-r--r-- 1 root root  95K logo.png
```

#### Solution 3 : Tester l'accès aux logos
```bash
curl -I http://localhost:3000/logo_glowshape.png | head -3
```
**Attendu :** `HTTP/1.1 200 OK`

#### Solution 4 : Vider le cache du navigateur
```
Chrome/Edge : Ctrl + Shift + R
Firefox : Ctrl + F5
Safari : Cmd + Option + R
```

---

## ❌ PROBLÈME 3 : Backend ne répond pas

### Symptôme :
- Erreur 502 Bad Gateway
- API ne répond pas
- Timeout

### ✅ Solutions :

#### Solution 1 : Vérifier le statut
```bash
sudo supervisorctl status backend
```
**Attendu :** `RUNNING`

**Si STOPPED ou ERROR :**
```bash
sudo supervisorctl restart backend
sleep 3
tail -n 20 /var/log/supervisor/backend.err.log
```

#### Solution 2 : Vérifier PostgreSQL
```bash
pg_isready
```
**Si pas actif :**
```bash
sudo -u postgres /usr/lib/postgresql/15/bin/pg_ctl -D /var/lib/postgresql/15/main -l /var/log/postgresql/postgresql.log start
```

#### Solution 3 : Tester l'API directement
```bash
curl -s http://localhost:8001/api/prestations | jq '. | length'
```
**Attendu :** Un nombre (ex: 14)

---

## ❌ PROBLÈME 4 : Formulaire de carte ne s'affiche pas

### Symptôme :
- Étape 3 de réservation : formulaire de carte invisible
- Message "Veuillez remplir tous les champs"
- Pas de champ de carte bancaire

### ✅ Solutions :

#### Solution 1 : Vérifier la clé publique Stripe
```bash
grep REACT_APP_STRIPE_PUBLIC_KEY /app/frontend/.env
```
**Attendu :**
```
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_51TBc5lRow7O4W1B5...
```

**Si manquante :**
```bash
echo "REACT_APP_STRIPE_PUBLIC_KEY=pk_test_51TBc5lRow7O4W1B5vzUmAfu1JM4zi27p5AXpwIBVOIJhR0OaUVuCbtrVm6L632KddgVRD855hMDtbFSSSkIKGBgt00rbDxFp2J" >> /app/frontend/.env
sudo supervisorctl restart frontend
```

#### Solution 2 : Vérifier que Stripe est chargé
Ouvrir la console du navigateur (F12) et chercher :
```
Stripe is not loaded
```

#### Solution 3 : Vérifier CardPaymentForm
```bash
ls -lh /app/frontend/src/components/CardPaymentForm.js
```
**Attendu :** Fichier existe

---

## ❌ PROBLÈME 5 : Réservation ne se crée pas

### Symptôme :
- Clic sur "Confirmer" ne fait rien
- Message d'erreur "Setup Intent failed"
- Redirection ne fonctionne pas

### ✅ Solutions :

#### Solution 1 : Vérifier l'API Setup Intent
```bash
curl -X POST http://localhost:8001/api/stripe/create-setup-intent \
  -H "Content-Type: application/json" \
  -d '{
    "prestation_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "nom_client": "Test",
    "email_client": "test@test.com",
    "telephone_client": "0612345678",
    "date": "2025-02-10",
    "heure_debut": "14:00",
    "heure_fin": "15:00"
  }' | jq .
```
**Attendu :**
```json
{
  "clientSecret": "seti_xxx...",
  "reservationId": "uuid",
  "setupIntentId": "seti_xxx"
}
```

#### Solution 2 : Vérifier les colonnes BDD
```bash
sudo -u postgres psql -d glowandshape -c "
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND column_name LIKE 'stripe%';
"
```
**Attendu :** 5 colonnes (customer_id, setup_intent_id, payment_method_id, payment_intent_id, charge_id)

#### Solution 3 : Vérifier la clé secrète Stripe
```bash
grep STRIPE_SECRET_KEY /app/backend/.env | cut -c 1-50
```
**Attendu :** `STRIPE_SECRET_KEY=sk_test_51TBc5lRow7O4W1B5...`

---

## ❌ PROBLÈME 6 : Page blanche / React Error

### Symptôme :
- Page entièrement blanche
- Message "Something went wrong"
- Console React Error

### ✅ Solutions :

#### Solution 1 : Voir l'erreur dans la console
Ouvrir DevTools (F12) → Console → Chercher les erreurs en rouge

#### Solution 2 : Vérifier la syntaxe des fichiers React
```bash
# Reservation.js
cd /app/frontend && npx eslint src/pages/Reservation.js --no-eslintrc --parser @babel/eslint-parser

# CardPaymentForm
npx eslint src/components/CardPaymentForm.js --no-eslintrc --parser @babel/eslint-parser
```

#### Solution 3 : Redémarrer proprement
```bash
sudo supervisorctl stop frontend
sleep 2
sudo supervisorctl start frontend
sleep 10
curl -s http://localhost:3000 | grep title
```

---

## ❌ PROBLÈME 7 : CRON ne débite pas

### Symptôme :
- Le jour J à 8h, rien ne se passe
- Réservations restent en "pending"
- Pas de débits automatiques

### ✅ Solutions :

#### Solution 1 : Vérifier que le CRON est démarré
```bash
ps aux | grep "cron-payment.js"
```
**Si rien :**
```bash
cd /app/backend
node cron-payment.js &
```

#### Solution 2 : Tester manuellement le débit du jour
```bash
curl -X POST http://localhost:8001/api/stripe/charge-today-deposits | jq .
```

#### Solution 3 : Vérifier les réservations du jour
```bash
TODAY=$(date +%Y-%m-%d)
sudo -u postgres psql -d glowandshape -c "
SELECT id, nom_client, statut_paiement 
FROM reservations 
WHERE date = '$TODAY';
"
```

#### Solution 4 : Démarrer avec Supervisor
```bash
cat > /etc/supervisor/conf.d/cron-payment.conf << 'EOF'
[program:cron-payment]
command=node /app/backend/cron-payment.js
directory=/app/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/cron-payment.err.log
stdout_logfile=/var/log/supervisor/cron-payment.out.log
EOF

sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status cron-payment
```

---

## 🔍 DIAGNOSTIC GÉNÉRAL

### Commande tout-en-un pour vérifier l'état global
```bash
#!/bin/bash
echo "=== DIAGNOSTIC GLOWSHAPE ==="
echo ""
echo "1. Services:"
sudo supervisorctl status | grep -E "backend|frontend|postgres|cron"
echo ""
echo "2. PostgreSQL:"
pg_isready
echo ""
echo "3. API Backend:"
curl -s http://localhost:8001/api/prestations | jq '. | length' 2>/dev/null && echo "prestations" || echo "❌ API ne répond pas"
echo ""
echo "4. Frontend:"
curl -s http://localhost:3000 | grep -o "<title>.*</title>" || echo "❌ Frontend ne répond pas"
echo ""
echo "5. Images Homepage:"
sudo -u postgres psql -d glowandshape -c "SELECT LENGTH(hero_image) as hero, LENGTH(about_image) as about FROM homepage_content;" 2>/dev/null
echo ""
echo "6. Réservations pending:"
sudo -u postgres psql -d glowandshape -c "SELECT COUNT(*) FROM reservations WHERE statut_paiement = 'pending';" 2>/dev/null
echo ""
echo "=== FIN DIAGNOSTIC ==="
```

Copier ce script dans un fichier et l'exécuter :
```bash
bash diagnostic.sh
```

---

## 📞 CHECKLIST DE DÉPANNAGE

Avant de demander de l'aide, vérifier :
- [ ] Backend en cours d'exécution
- [ ] Frontend en cours d'exécution  
- [ ] PostgreSQL actif
- [ ] Images dans la BDD
- [ ] Clés Stripe configurées
- [ ] Colonnes BDD créées
- [ ] Logs sans erreurs critiques
- [ ] API répond aux requêtes
- [ ] Cache navigateur vidé

---

## 🆘 RÉINITIALISATION COMPLÈTE

**En dernier recours, redémarrer tout :**
```bash
# 1. Arrêter tout
sudo supervisorctl stop all

# 2. Attendre
sleep 5

# 3. Redémarrer PostgreSQL
sudo -u postgres /usr/lib/postgresql/15/bin/pg_ctl -D /var/lib/postgresql/15/main -l /var/log/postgresql/postgresql.log restart

# 4. Attendre
sleep 3

# 5. Redémarrer tout
sudo supervisorctl start all

# 6. Vérifier
sleep 10
sudo supervisorctl status
```

---

**💡 Conseil :** Toujours commencer par vérifier les logs !
- Backend : `/var/log/supervisor/backend.err.log`
- Frontend : `/var/log/supervisor/frontend.err.log`
- PostgreSQL : `/var/log/postgresql/postgresql.log`
