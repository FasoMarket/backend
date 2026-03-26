require('dotenv').config();
const { createServer } = require('http');
const { Server }       = require('socket.io');
const connectDB  = require('./config/database');
const app        = require('./app');
const { initSocket } = require('./socket/socketManager');

const httpServer = createServer(app);

// Socket.io - Accepter toutes les IPs et domaines
const io = new Server(httpServer, {
  cors: {
    origin: true, // Accepter toutes les origines
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
