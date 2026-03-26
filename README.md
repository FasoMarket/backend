# FasoMarket Backend

Backend API pour la plateforme de commerce électronique FasoMarket.

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env` à la racine du dossier backend:

```env
MONGODB_URI=mongodb://localhost:27017/fasomarket
PORT=5000
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

## Démarrage

### Mode développement

```bash
npm run dev
```

### Mode production

```bash
npm start
```

## Seed de la Base de Données

Pour créer une base de données complète avec des données de test:

```bash
node seed.js
```

Cela créera:
- 1 Admin
- 4 Vendeurs avec boutiques
- 22 Produits
- 2 Clients
- 3 Commandes livrées
- 3 Avis

## Vérification des Données

Pour vérifier que toutes les données sont correctement créées:

```bash
node verify_backend.js
```

## Structure du Projet

```
backend/
├── src/
│   ├── controllers/       # Logique métier
│   ├── models/           # Schémas MongoDB
│   ├── routes/           # Définition des routes
│   ├── middlewares/       # Middlewares Express
│   ├── utils/            # Utilitaires
│   ├── config/           # Configuration
│   └── socket/           # WebSocket
├── seed.js               # Script de seed
├── verify_backend.js     # Script de vérification
├── package.json
└── .env
```

## Endpoints Principaux

### Produits
- `GET /products` - Tous les produits (paginés)
- `GET /products/:id` - Détail d'un produit
- `POST /products` - Créer un produit (vendeur)
- `PUT /products/:id` - Modifier un produit (vendeur)
- `DELETE /products/:id` - Supprimer un produit (vendeur)

### Avis
- `POST /reviews` - Créer un avis (client)
- `GET /reviews/my-reviews` - Mes avis (client)
- `GET /reviews/product/:productId` - Avis d'un produit
- `GET /vendor/reviews` - Avis reçus (vendeur)
- `POST /vendor/reviews/:id/reply` - Répondre à un avis (vendeur)

### Admin
- `GET /admin/stats` - Statistiques
- `GET /admin/vendors` - Tous les vendeurs
- `GET /admin/users` - Tous les utilisateurs
- `PUT /admin/vendors/:id/approve` - Approuver un vendeur
- `PUT /admin/vendors/:id/reject` - Rejeter un vendeur

### Authentification
- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `POST /auth/logout` - Déconnexion

## Comptes de Test

### Admin
- Email: `admin@fasomarket.com`
- Mot de passe: `admin123456`

### Vendeurs
- Email: `kone@test.com` / `traore@test.com` / `diallo@test.com` / `sawadogo@test.com`
- Mot de passe: `vendor123`

### Clients
- Email: `client1@test.com` / `client2@test.com`
- Mot de passe: `client123`

## Technologies

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Base de données
- **Mongoose** - ODM MongoDB
- **JWT** - Authentification
- **Socket.io** - WebSocket en temps réel

## Développement

### Linter

```bash
npm run lint
```

### Tests

```bash
npm test
```

## Déploiement

Pour déployer en production:

1. Configurez les variables d'environnement
2. Exécutez `npm run build`
3. Démarrez avec `npm start`

## Support

Pour toute question ou problème, contactez l'équipe de développement.
