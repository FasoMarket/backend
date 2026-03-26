# Scripts Disponibles

## 1. Seed de la Base de Données

Crée une base de données complète avec des données de test.

```bash
node seed.js
```

**Crée:**
- 1 Admin
- 4 Vendeurs avec boutiques
- 22 Produits
- 2 Clients
- 3 Commandes livrées
- 3 Avis

**Comptes créés:**
- Admin: `admin@fasomarket.com` / `admin123456`
- Vendeurs: `kone@test.com`, `traore@test.com`, `diallo@test.com`, `sawadogo@test.com` / `vendor123`
- Clients: `client1@test.com`, `client2@test.com` / `client123`

## 2. Vérification des Données

Vérifie que toutes les données sont correctement créées dans la base de données.

```bash
node verify_backend.js
```

**Affiche:**
- Nombre total d'utilisateurs (admins, vendeurs, clients)
- Nombre de boutiques
- Nombre de produits par vendeur
- Nombre de commandes
- Nombre d'avis par rating

## 3. Test des Endpoints

Teste les endpoints principaux du backend.

```bash
# Assurez-vous que le serveur est en cours d'exécution
npm run dev

# Dans un autre terminal
node test_endpoints.js
```

**Teste:**
- `GET /products` - Récupération de tous les produits
- `GET /products/categories` - Récupération des catégories
- `GET /reviews/product/:id` - Récupération des avis d'un produit

## Ordre d'Exécution Recommandé

1. **Démarrer MongoDB**
   ```bash
   mongod
   ```

2. **Créer la base de données**
   ```bash
   node seed.js
   ```

3. **Vérifier les données**
   ```bash
   node verify_backend.js
   ```

4. **Démarrer le serveur**
   ```bash
   npm run dev
   ```

5. **Tester les endpoints** (dans un autre terminal)
   ```bash
   node test_endpoints.js
   ```

## Dépannage

### Erreur: "Cannot find module 'mongoose'"
```bash
npm install
```

### Erreur: "connect ECONNREFUSED"
Assurez-vous que MongoDB est en cours d'exécution:
```bash
mongod
```

### Erreur: "MONGODB_URI not found"
Créez un fichier `.env` avec:
```env
MONGODB_URI=mongodb://localhost:27017/fasomarket
PORT=5000
JWT_SECRET=your_secret_key
```

## Nettoyage

Pour réinitialiser la base de données, exécutez simplement:
```bash
node seed.js
```

Le script supprimera automatiquement les données existantes et créera une nouvelle base de données propre.
