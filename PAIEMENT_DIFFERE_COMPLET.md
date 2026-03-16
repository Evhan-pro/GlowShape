# 🎉 PAIEMENT DIFFÉRÉ - IMPLÉMENTATION COMPLÈTE

## ✅ SYSTÈME IMPLÉMENTÉ

### **Fonctionnement :**

**1. À la réservation (Jour -N) :**
- Client choisit prestation + date + créneau
- Client enregistre sa carte bancaire (Setup Intent)
- ❌ **AUCUN DÉBIT** immédiat
- ✅ Réservation confirmée

**2. Le Jour J (automatiquement à 8h00) :**
- Tâche CRON s'exécute
- Débite automatiquement **30%** (acompte) de toutes les réservations du jour
- Les **70% restants** sont payés en physique au salon

**3. Si annulation > 48h avant :**
- ❌ Aucun débit
- ✅ Annulation gratuite

**4. Si annulation < 48h avant :**
- 💰 Débite **30%** (acompte) comme frais d'annulation
- Réservation annulée

---

## 📁 FICHIERS CRÉÉS/MODIFIÉS

### **Backend :**

#### 1. `/app/backend/stripe-routes.js` - RÉÉCRIT COMPLET
**Nouvelles routes :**

| Route | Méthode | Description |
|-------|---------|-------------|
| `/create-setup-intent` | POST | Enregistrer carte (sans débit) |
| `/confirm-card-registration/:id` | POST | Confirmer l'enregistrement |
| `/charge-deposit/:id` | POST | Débiter l'acompte 30% |
| `/cancel-reservation/:id` | POST | Annuler (avec ou sans débit selon délai) |
| `/charge-today-deposits` | POST | Débiter tous les acomptes du jour (CRON) |
| `/webhook` | POST | Webhook Stripe |

#### 2. `/app/backend/cron-payment.js` - NOUVEAU
**Tâche planifiée :**
- S'exécute tous les jours à **8h00**
- Appelle `/charge-today-deposits`
- Débite l'acompte de toutes les réservations du jour

#### 3. `/app/backend/models.js` - MODIFIÉ
**Nouveaux champs Reservation :**
```javascript
stripe_customer_id       // ID client Stripe
stripe_setup_intent_id   // ID Setup Intent (enregistrement carte)
stripe_payment_method_id // ID carte enregistrée
stripe_payment_intent_id // ID paiement (quand débité)
```

### **Frontend :**

#### 1. `/app/frontend/src/pages/Reservation.js` - À MODIFIER
**Changements nécessaires :**
- Utiliser `Elements` et `CardElement` de Stripe
- Appeler `/create-setup-intent` au lieu de checkout
- Confirmer l'enregistrement de carte
- Afficher message clair : "Carte enregistrée, débit le jour J"

---

## 🗄️ BASE DE DONNÉES

### **Nouvelles colonnes `reservations` :**

```sql
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_setup_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_payment_method_id VARCHAR(255);
```

**Statuts de paiement :**
- `pending` : En attente du jour J
- `paid` : Acompte débité
- `failed` : Échec du débit
- `no_charge` : Annulation gratuite (> 48h)

---

## 🔄 FLOW COMPLET

```
1. Client remplit formulaire réservation
   ↓
2. Client entre infos carte bancaire (CardElement)
   ↓
3. Frontend appelle /create-setup-intent
   ↓
4. Backend crée Setup Intent + Customer Stripe
   ↓
5. Backend crée réservation (statut: pending)
   ↓
6. Frontend confirme enregistrement carte
   ↓
7. Backend attache payment method au customer
   ↓
8. Client voit "Réservation confirmée, carte enregistrée"
   ↓
9. **LE JOUR J à 8h00** - CRON s'exécute
   ↓
10. Backend appelle /charge-today-deposits
    ↓
11. Pour chaque réservation du jour :
    - Crée Payment Intent (30% du montant)
    - Débite la carte enregistrée
    - Met à jour statut_paiement = 'paid'
    ↓
12. Client reçoit email : "Acompte débité, RDV aujourd'hui"
    ↓
13. Client vient au salon, paie les 70% restants en physique
```

---

## 🧪 TESTER LE SYSTÈME

### **1. Tester une réservation**
1. Aller sur `/reservation`
2. Choisir prestation + date (minimum 48h après)
3. Remplir infos + carte test :
   - Numéro : `4242 4242 4242 4242`
   - Date : `12/28`
   - CVC : `123`
4. Valider
5. Voir confirmation : "Carte enregistrée"

### **2. Vérifier dans la base**
```sql
SELECT 
  id, nom_client, date, 
  statut_paiement, 
  stripe_customer_id, 
  stripe_payment_method_id
FROM reservations 
WHERE statut_paiement = 'pending'
ORDER BY date;
```

### **3. Tester le débit manuel (sans attendre le jour J)**
```bash
# Débiter l'acompte d'une réservation spécifique
curl -X POST http://localhost:8001/api/stripe/charge-deposit/RESERVATION_ID
```

### **4. Tester le CRON manuellement**
```bash
# Débiter tous les acomptes du jour
curl -X POST http://localhost:8001/api/stripe/charge-today-deposits
```

### **5. Tester une annulation > 48h**
```bash
curl -X POST http://localhost:8001/api/stripe/cancel-reservation/RESERVATION_ID
# Résultat : Annulation gratuite, aucun débit
```

### **6. Tester une annulation < 48h**
1. Créer une réservation pour demain (dans 24h)
2. L'annuler
3. Résultat : 30% débité automatiquement

---

## 🚀 DÉMARRER LE SERVICE CRON

### **Option 1 : Démarrer manuellement**
```bash
cd /app/backend
node cron-payment.js
```

### **Option 2 : Ajouter à supervisor**
Créer `/etc/supervisor/conf.d/cron-payment.conf` :
```ini
[program:cron-payment]
command=node /app/backend/cron-payment.js
directory=/app/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/cron-payment.err.log
stdout_logfile=/var/log/supervisor/cron-payment.out.log
```

Puis :
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start cron-payment
```

---

## ⚙️ CONFIGURATION

### **Backend `.env`**
```env
STRIPE_SECRET_KEY=sk_test_51TBc5lRow7O4W1B5...
BACKEND_URL=http://localhost:8001  # Pour le CRON
```

### **Frontend `.env`**
```env
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_51TBc5lRow7O4W1B5...
```

---

## 📋 TÂCHES ADMINISTRATIVES

### **Panel Admin - Débiter un acompte manuellement**
Si vous voulez débiter avant le jour J :
```javascript
const handleChargeDeposit = async (reservationId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(
    `${backendUrl}/api/stripe/charge-deposit/${reservationId}`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const data = await response.json();
  alert(data.message);
};
```

### **Panel Admin - Voir les paiements en attente**
```javascript
// Filtrer les réservations par statut_paiement = 'pending'
const reservationsEnAttente = reservations.filter(
  r => r.statut_paiement === 'pending'
);
```

---

## 🔔 NOTIFICATIONS (À IMPLÉMENTER)

### **Emails à envoyer :**

1. **À la réservation :**
   - "Réservation confirmée"
   - "Carte enregistrée, acompte de X€ sera débité le jour J"

2. **Le jour J (après débit) :**
   - "Acompte de X€ débité"
   - "RDV aujourd'hui à Xh, reste Y€ à payer en physique"

3. **Si débit échoue :**
   - "Erreur de paiement, veuillez mettre à jour votre carte"

4. **Annulation > 48h :**
   - "Réservation annulée gratuitement"

5. **Annulation < 48h :**
   - "Réservation annulée, acompte de X€ débité"

---

## ⚠️ POINTS D'ATTENTION

### **1. Gestion des cartes expirées**
Si une carte expire avant le jour J, le débit échouera.
**Solution :** Envoyer un email 3 jours avant pour vérifier.

### **2. Débit échoué le jour J**
Si le débit échoue (carte refusée, fonds insuffisants) :
- Le statut passe à `failed`
- Contacter le client immédiatement
- Peut-être annuler le RDV

### **3. Fuseau horaire**
Le CRON s'exécute à 8h du serveur.
**Vérifier :** `date` dans le terminal pour voir le fuseau.

### **4. Testing CRON**
Ne pas attendre 8h pour tester !
**Solutions :**
- Tester manuellement avec curl
- Modifier temporairement le CRON : `*/5 * * * *` (toutes les 5 min)

---

## ✅ CHECKLIST

### Backend :
- [x] stripe-routes.js réécrit
- [x] cron-payment.js créé
- [x] node-cron installé
- [x] models.js mis à jour
- [ ] Base de données mise à jour (colonnes)
- [ ] CRON démarré avec supervisor

### Frontend :
- [x] @stripe/react-stripe-js installé
- [ ] Reservation.js modifié (CardElement)
- [ ] ReservationSuccess.js adapté
- [ ] Messages clairs pour le client

### Tests :
- [ ] Enregistrement carte fonctionnel
- [ ] Débit manuel fonctionne
- [ ] Débit automatique CRON fonctionne
- [ ] Annulation > 48h (gratuite)
- [ ] Annulation < 48h (débite 30%)

---

## 🎯 CE QU'IL RESTE À FAIRE

1. **Modifier Reservation.js** pour utiliser CardElement
2. **Mettre à jour la base de données** (nouvelles colonnes)
3. **Démarrer le service CRON**
4. **Tester le flow complet**
5. **Ajouter boutons admin** (débiter acompte, voir paiements en attente)

---

**Voulez-vous que je continue avec la modification du frontend pour intégrer le CardElement ?** 🚀
