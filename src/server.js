require('dotenv').config();
const express    = require('express');
const { createServer } = require('http');
const { Server }       = require('socket.io');
const cors       = require('cors');
const path       = require('path');
const connectDB  = require('./config/database');
const routes     = require('./routes/index');
const { initSocket } = require('./socket/socketManager');

const app        = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

connectDB();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.set('io', io);

app.use('/api', routes);

initSocket(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error caught by middleware:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur Interne du Serveur',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () =>
  console.log(`🚀 Serveur + Socket.IO lancés sur http://localhost:${PORT}`)
);
