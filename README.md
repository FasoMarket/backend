# FasoMarket Backend API

API REST pour la plateforme marketplace multi-vendeurs FasoMarket.

## Technologies

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env` à la racine :

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fasomarket
JWT_SECRET=votre_secret_jwt
JWT_EXPIRE=7d
```

## Démarrage

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## Routes API

### Authentification
- POST `/api/auth/register` - Inscription (avec avatar optionnel)
- POST `/api/auth/login` - Connexion
- GET `/api/auth/profile` - Profil utilisateur
- PUT `/api/auth/profile` - Mettre à jour le profil (avec avatar)

### Boutiques
- POST `/api/stores` - Créer une boutique (avec logo)
- GET `/api/stores` - Liste des boutiques
- GET `/api/stores/:id` - Détails d'une boutique
- PUT `/api/stores/:id` - Modifier une boutique (avec logo)
- DELETE `/api/stores/:id` - Supprimer une boutique

### Produits
- POST `/api/products` - Créer un produit (avec images, max 5)
- GET `/api/products` - Liste des produits (avec filtres)
- GET `/api/products/:id` - Détails d'un produit
- PUT `/api/products/:id` - Modifier un produit (ajouter images)
- DELETE `/api/products/:id` - Supprimer un produit
- POST `/api/products/:id/images` - Ajouter des images à un produit
- DELETE `/api/products/:id/images` - Supprimer une image d'un produit

### Panier
- GET `/api/cart` - Voir le panier
- POST `/api/cart` - Ajouter au panier
- PUT `/api/cart/:productId` - Modifier quantité
- DELETE `/api/cart/:productId` - Retirer du panier
- DELETE `/api/cart` - Vider le panier

### Commandes
- POST `/api/orders` - Créer une commande
- GET `/api/orders/my-orders` - Mes commandes
- GET `/api/orders/:id` - Détails d'une commande

### Paiements
- POST `/api/payments/mobile-money` - Simuler paiement Mobile Money

### Messagerie
- POST `/api/messages/conversation` - Créer une conversation
- POST `/api/messages` - Envoyer un message
- GET `/api/messages/conversations` - Liste des conversations
- GET `/api/messages/:conversationId` - Messages d'une conversation

### Administration
- GET `/api/admin/vendors` - Liste des vendeurs
- PUT `/api/admin/vendors/:id/approve` - Approuver un vendeur
- PUT `/api/admin/vendors/:id/reject` - Refuser un vendeur
- GET `/api/admin/users` - Liste des utilisateurs

## Rôles

- `customer` - Client
- `vendor` - Vendeur
- `admin` - Administrateur


## Upload d'images

Le système d'upload d'images est configuré avec Multer :

- Taille maximale : 5MB par image
- Formats acceptés : jpeg, jpg, png, gif, webp
- Stockage : dossier `uploads/`
- Les images sont accessibles via : `http://localhost:5000/uploads/nom-fichier.jpg`

### Exemples d'utilisation

#### Créer un produit avec images
```bash
POST /api/products
Content-Type: multipart/form-data

name: Mangue bio
description: Mangue naturelle
price: 2000
category: fruit
stock: 50
images: [fichier1.jpg, fichier2.jpg]
```

#### Ajouter un logo à une boutique
```bash
POST /api/stores
Content-Type: multipart/form-data

name: Ma Boutique
description: Description
logo: logo.jpg
```

#### Inscription avec avatar
```bash
POST /api/auth/register
Content-Type: multipart/form-data

name: John Doe
email: john@email.com
password: password123
role: customer
avatar: photo.jpg
```


## Améliorations de sécurité et robustesse

### Sécurité
- ✅ Helmet.js pour les en-têtes HTTP sécurisés
- ✅ Rate limiting sur les routes sensibles
- ✅ Sanitization des données MongoDB
- ✅ Validation stricte des entrées
- ✅ Gestion des erreurs centralisée
- ✅ Hash des mots de passe avec bcrypt
- ✅ JWT pour l'authentification

### Fonctionnalités avancées
- ✅ Pagination des produits
- ✅ Recherche et filtres avancés
- ✅ Upload d'images multiples
- ✅ Statistiques vendeur
- ✅ Gestion du stock
- ✅ Middleware de propriété
- ✅ Service layer pour la logique métier
- ✅ Seeder pour données de test

### Routes vendeur
- GET `/api/vendor/orders` - Commandes du vendeur
- GET `/api/vendor/stats` - Statistiques du vendeur
- PUT `/api/vendor/orders/:orderId/status` - Mettre à jour le statut

### Commandes utiles

```bash
# Installer les dépendances
npm install

# Créer des données de test
npm run seed

# Démarrer en développement
npm run dev

# Démarrer en production
npm start
```

### Variables d'environnement requises

Voir `.env.example` pour la configuration complète.

### Limites de sécurité

- Connexion : 5 tentatives / 15 minutes
- Inscription : 3 comptes / 1 heure
- API générale : 100 requêtes / 15 minutes
- Taille fichier : 5MB max
- Images par produit : 5 max
