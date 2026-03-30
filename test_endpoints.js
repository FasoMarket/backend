require('dotenv').config();
const http = require('http');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/database');
const app = require('./src/app');
const { initSocket } = require('./src/socket/socketManager');

// Create server
const httpServer = createServer(app);

// Socket.io Configuration
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (process.env.NODE_ENV === 'development' || !origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
        return callback(null, true);
      }
      callback(new Error('Non autorisé par CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
    allowEIO3: true,
  },
  transports: ['websocket', 'polling'],
});

connectDB();
app.set('io', io);
initSocket(io);

const PORT = process.env.PORT || 5000;

// Start server and run tests
httpServer.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server started on http://0.0.0.0:${PORT}`);
  
  // Wait a moment for server to be ready
  await new Promise(r => setTimeout(r, 2000));
  
  // Test endpoints
  try {
    console.log('\n=== Testing Endpoints ===\n');
    
    // Test 1: GET /
    console.log('Test 1: GET http://localhost:5000/');
    const res1 = await makeRequest('http://localhost:5000/');
    console.log('Status:', res1.status);
    console.log('Response:', JSON.stringify(res1.data, null, 2));
    
    // Test 2: GET /api/products
    console.log('\n\nTest 2: GET http://localhost:5000/api/products');
    const res2 = await makeRequest('http://localhost:5000/api/products');
    console.log('Status:', res2.status);
    console.log('Response:', JSON.stringify(res2.data, null, 2));
    
    console.log('\n=== Tests Complete ===');
  } catch (error) {
    console.error('Test Error:', error.message);
  } finally {
    process.exit(0);
  }
});

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}
