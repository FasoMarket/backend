require('dotenv').config();
const validateEnv = require('./config/validateEnv');
const { createServer } = require('http');
const { Server }       = require('socket.io');
const connectDB  = require('./config/database');
const app        = require('./app');
const { initSocket } = require('./socket/socketManager');

// Validate environment variables
validateEnv();

const httpServer = createServer(app);

// Socket.io - Configuration CORS basée sur l'environnement
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // En développement ou sans origine, accepter
      if (process.env.NODE_ENV === 'development' || !origin) {
        return callback(null, true);
      }
      // En production, vérifier uniquement les origines autorisées
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Non autorisé par CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
    allowEIO3: true, // Support pour les anciennes versions
  },
  transports: ['websocket', 'polling'], // Support websocket et polling
});

connectDB();

app.set('io', io);

initSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 Serveur + Socket.IO lancés sur http://0.0.0.0:${PORT}`)
);
