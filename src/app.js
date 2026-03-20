const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { errorHandler, notFound } = require('./middlewares/errorHandler.middleware');

const app = express();

// Sécurité
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: false,
}));
app.use(mongoSanitize());

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/stores', require('./routes/store.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/vendor', require('./routes/vendor.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Bienvenue sur FasoMarket API',
    version: '1.0.0'
  });
});

// Gestion des erreurs
app.use(notFound);
app.use(errorHandler);

module.exports = app;
