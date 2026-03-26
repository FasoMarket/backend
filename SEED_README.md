# Script de Seed - FasoMarket

## Description

Le script `seed.js` crée une base de données complète et fonctionnelle pour FasoMarket avec:

- **1 Admin** avec accès complet
- **4 Vendeurs** avec leurs boutiques respectives
- **22 Produits** répartis entre les vendeurs
- **2 Clients** pour tester les commandes
- **3 Commandes livrées** avec avis

## Utilisation

### 1. Démarrer le serveur MongoDB

```bash
# Assurez-vous que MongoDB est en cours d'exécution
# Localement: mongod
# Ou utilisez MongoDB Atlas
```

### 2. Exécuter le script de seed

```bash
cd backend
node seed.js
```

### 3. Résultat

Le script affichera:

```
✅ SEED COMPLÉTÉ AVEC SUCCÈS!
==================================================

📊 Résumé:
  • 1 Admin: admin@fasomarket.com / admin123456
  • 4 Vendeurs avec boutiques et produits
  • 22 Produits
  • 2 Clients
  • 3 Commandes livrées
  • 3 Avis

🔗 URLs:
  • Admin: http://localhost:5174/login
  • Web App: http://localhost:5173
  • Backend API: http://localhost:5000
```

## Comptes de Test

### Admin
- **Email**: admin@fasomarket.com
- **Mot de passe**: admin123456
- **Accès**: http://localhost:5174/login

### Vendeurs
1. **Koné Électronique**
   - Email: kone@test.com
   - Mot de passe: vendor123
   - Produits: 5 (Électronique)

2. **Traore Bio**
   - Email: traore@test.com
   - Mot de passe: vendor123
   - Produits: 6 (Produits Bio)

3. **Diallo Mode**
   - Email: diallo@test.com
   - Mot de passe: vendor123
   - Produits: 5 (Mode)

4. **Sawadogo Art**
   - Email: sawadogo@test.com
   - Mot de passe: vendor123
   - Produits: 6 (Art)

### Clients
1. **Client Test 1**
   - Email: client1@test.com
   - Mot de passe: client123

2. **Client Test 2**
   - Email: client2@test.com
   - Mot de passe: client123

## Données Créées

### Produits par Vendeur

**Koné Électronique (5 produits)**
- Laptop i7 (450,000 FCFA) - Stock: 8
- Caméra 4K (380,000 FCFA) - Stock: 5
- Power Bank 20000mAh (18,000 FCFA) - Stock: 40
- Casque Bluetooth (45,000 FCFA) - Stock: 25
- Smartphone 5G (250,000 FCFA) - Stock: 15

**Traore Bio (6 produits)**
- Beurre de Karité Bio (12,000 FCFA) - Stock: 50
- Miel Pur (8,000 FCFA) - Stock: 30
- Huile d'Argan (15,000 FCFA) - Stock: 20
- Savon Naturel (3,000 FCFA) - Stock: 100
- Thé Bio (5,000 FCFA) - Stock: 60
- Café Bio (7,000 FCFA) - Stock: 45

**Diallo Mode (5 produits)**
- Pagne Fasso (25,000 FCFA) - Stock: 35
- Boubou Traditionnel (45,000 FCFA) - Stock: 20
- Chaussures Artisanales (35,000 FCFA) - Stock: 15
- Sac à Main (28,000 FCFA) - Stock: 25
- Ceinture Cuir (12,000 FCFA) - Stock: 40

**Sawadogo Art (6 produits)**
- Bronze Art (85,000 FCFA) - Stock: 8
- Sculpture Bois (55,000 FCFA) - Stock: 12
- Tableau Peint (45,000 FCFA) - Stock: 18
- Masque Traditionnel (22,000 FCFA) - Stock: 30
- Poterie Artisanale (15,000 FCFA) - Stock: 25
- Bijoux Artisanaux (18,000 FCFA) - Stock: 35

### Commandes et Avis

- **Commande 1**: Client 1 → Laptop i7 (Avis: 5⭐)
- **Commande 2**: Client 1 → Beurre de Karité Bio x2 (Avis: 4⭐)
- **Commande 3**: Client 2 → Pagne Fasso (Avis: 5⭐)

## Notes

- Le script nettoie les données existantes avant de créer les nouvelles
- Tous les vendeurs sont approuvés par défaut
- Toutes les commandes sont marquées comme livrées
- Les avis sont visibles et peuvent être répondus par les vendeurs
- Les images des produits sont des placeholders

## Dépannage

### Erreur de connexion MongoDB

```
❌ Erreur: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**: Assurez-vous que MongoDB est en cours d'exécution

### Erreur de modèle

```
❌ Erreur: Cannot find module './src/models/...'
```

**Solution**: Vérifiez que vous êtes dans le répertoire `backend`

## Nettoyage

Pour réinitialiser la base de données, exécutez simplement le script à nouveau:

```bash
node seed.js
```

Le script supprimera automatiquement les données existantes et créera une nouvelle base de données propre.
