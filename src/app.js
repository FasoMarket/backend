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

// CORS - Accepter toutes les IPs et domaines
const corsOptions = {
  origin: true, // Accepter toutes les origines
  credentials: false, // Désactiver credentials pour éviter les conflits avec origin: *
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Ajouter les headers CORS manuellement pour s'assurer qu'ils sont présents
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

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
