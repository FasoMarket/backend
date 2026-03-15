# FasoMarket Backend API

API REST pour marketplace multi-vendeurs permettant aux producteurs burkinabè de vendre leurs produits en ligne.

## 🚀 Installation

```bash
git clone https://github.com/FasoMarket/backend.git
cd backend
npm install
cp .env.example .env
# Configurer les variables dans .env
npm run seed
npm run dev
```

## 🛠️ Technologies

- **Runtime:** Node.js + Express.js
- **Base de données:** MongoDB + Mongoose
- **Authentification:** JWT + bcrypt
- **Upload:** Multer
- **Sécurité:** Helmet, Rate limiting, Validation

## 📋 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur
- `PUT /api/auth/profile` - Modifier profil
- `PUT /api/auth/change-password` - Changer mot de passe

### Boutiques
- `POST /api/stores` - Créer boutique
- `GET /api/stores` - Liste boutiques
- `GET /api/stores/:slug` - Détails boutique
- `GET /api/stores/:slug/products` - Produits boutique
- `PUT /api/stores/:id` - Modifier boutique
- `DELETE /api/stores/:id` - Supprimer boutique
- `GET /api/stores/check-slug/:slug` - Vérifier slug

### Produits
- `POST /api/products` - Créer produit
- `GET /api/products` - Liste produits (pagination, filtres)
- `GET /api/products/:id` - Détails produit
- `PUT /api/products/:id` - Modifier produit
- `DELETE /api/products/:id` - Supprimer produit
- `POST /api/products/:id/images` - Ajouter images
- `DELETE /api/products/:id/images` - Supprimer image
- `GET /api/products/categories` - Liste catégories

### Panier
- `GET /api/cart` - Voir panier
- `POST /api/cart` - Ajouter au panier
- `PUT /api/cart/:productId` - Modifier quantité
- `DELETE /api/cart/:productId` - Retirer produit
- `DELETE /api/cart` - Vider panier

### Commandes
- `POST /api/orders` - Créer commande
- `GET /api/orders/my-orders` - Mes commandes
- `GET /api/orders/:id` - Détails commande

### Paiements
- `POST /api/payments/mobile-money` - Paiement Mobile Money

### Messagerie
- `POST /api/messages/conversation` - Créer conversation
- `POST /api/messages` - Envoyer message
- `GET /api/messages/conversations` - Liste conversations
- `GET /api/messages/:conversationId` - Messages

### Vendeur
- `GET /api/vendor/orders` - Commandes reçues
- `GET /api/vendor/stats` - Statistiques
- `PUT /api/vendor/orders/:id/status` - Mettre à jour statut

### Administration
- `GET /api/admin/vendors` - Liste vendeurs
- `PUT /api/admin/vendors/:id/approve` - Approuver vendeur
- `PUT /api/admin/vendors/:id/reject` - Refuser vendeur
- `GET /api/admin/users` - Liste utilisateurs

## 👥 Rôles

- **Customer:** Achète des produits, gère panier/commandes
- **Vendor:** Crée boutique, gère produits, voit commandes (après approbation admin)
- **Admin:** Approuve vendeurs, supervise plateforme

## 🔧 Configuration

### Variables d'environnement (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/FasoMarket
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
```

### Comptes de test (après `npm run seed`)
- **Admin:** admin@fasomarket.com / admin123
- **Vendeur:** vendeur@fasomarket.com / vendeur123
- **Client:** client@fasomarket.com / client123

## 📊 Fonctionnalités

### Sécurité
- Authentification JWT
- Hash mots de passe (bcrypt)
- Rate limiting (connexion, inscription)
- Validation données stricte
- Protection en-têtes HTTP (Helmet)
- Sanitization NoSQL

### Upload d'images
- Formats: jpeg, jpg, png, gif, webp
- Taille max: 5MB
- Stockage: `/uploads/`
- Validation automatique

### Recherche & Filtres
- Recherche textuelle
- Filtres: catégorie, prix, boutique
- Pagination avec métadonnées
- Tri: prix, date, nom

### URLs conviviales
- Boutiques accessibles par slug: `/api/stores/ma-boutique-bio`
- Génération automatique de slug
- Vérification unicité

## 🚦 Scripts

```bash
npm start          # Production
npm run dev        # Développement (nodemon)
npm run seed       # Créer données de test
```

## 📱 Utilisation

### Créer un compte vendeur
1. `POST /api/auth/register` avec `role: "vendor"`
2. Admin approuve via `PUT /api/admin/vendors/:id/approve`
3. Vendeur peut créer sa boutique

### Processus d'achat
1. Client parcourt produits (public)
2. Ajoute au panier (authentifié)
3. Crée commande `POST /api/orders`
4. Paie via `POST /api/payments/mobile-money`

### Gestion boutique
1. Vendeur crée boutique avec slug personnalisé
2. Ajoute produits avec images
3. Gère commandes via `/api/vendor/orders`
4. Voit statistiques via `/api/vendor/stats`

## 🌐 Déploiement

L'API est prête pour la production avec:
- Gestion d'erreurs centralisée
- Logs structurés
- Variables d'environnement
- Sécurité renforcée
- Documentation complète

---

**Développé pour FasoMarket - Marketplace burkinabè** 🇧🇫