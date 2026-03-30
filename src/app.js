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

// CORS - Configuration basée sur l'environnement
const corsOptions = {
  origin: (origin, callback) => {
    // En développement, accepter toutes les origines (y compris localhost)
    if (process.env.NODE_ENV === 'development' || !origin) {
      return callback(null, true);
    }
    
    // En production, vérifier les origines autorisées uniquement
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Non autorisé par CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const apiRoutes = require('./routes/index');
const configRoutes = require('./routes/config.routes');
app.use('/api', apiRoutes);
app.use('/config', configRoutes);

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
