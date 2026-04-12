const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for prescription uploads
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Routes
app.get('/', (req, res) => {
  res.send('MediGuide API is running');
});

// Health check endpoint for all services
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      auth: 'active',
      ai: 'active',
      emergency: 'active',
      rag: 'active',
      booking: 'active',
      consultation: 'active',
      pharmacy: 'active'
    },
    demoMode: process.env.IS_DEMO_MODE === 'true',
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// EXISTING Routes (UNCHANGED)
// ============================================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/emergency', require('./routes/emergency'));

// ============================================================
// NEW Service Routes
// ============================================================
app.use('/api/rag', require('./routes/rag'));
app.use('/api/booking', require('./routes/booking'));
app.use('/api/consultation', require('./routes/consultation'));
app.use('/api/pharmacy', require('./routes/pharmacy'));

// ============================================================
// Global Error Handler
// ============================================================
app.use((err, req, res, next) => {
  console.error('[Global Error]', err.message);
  console.error(err.stack);
  
  // Don't expose internal errors in production
  const isDev = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack })
  });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Port
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (Background)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mediguide';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.env.IS_DEMO_MODE = 'true';
    console.log('Running in DEMO MODE (without MongoDB)');
  });

// ============================================================
// HTTP + WebSocket Server
// ============================================================
const server = http.createServer(app);

// WebSocket server for real-time consultation chat
try {
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ server, path: '/ws/consultation' });

  // Track connected clients by consultation ID
  const consultationClients = new Map();

  wss.on('connection', (ws, req) => {
    console.log('[WebSocket] New connection');
    let clientConsultationId = null;

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        // Join a consultation room
        if (msg.type === 'join') {
          clientConsultationId = msg.consultationId;
          if (!consultationClients.has(clientConsultationId)) {
            consultationClients.set(clientConsultationId, new Set());
          }
          consultationClients.get(clientConsultationId).add(ws);
          ws.send(JSON.stringify({ type: 'joined', consultationId: clientConsultationId }));
          return;
        }

        // Broadcast chat message to all clients in the same consultation
        if (msg.type === 'chat' && clientConsultationId) {
          const clients = consultationClients.get(clientConsultationId);
          if (clients) {
            const broadcast = JSON.stringify({
              type: 'chat',
              sender: msg.sender,
              message: msg.message,
              timestamp: new Date().toISOString()
            });
            clients.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(broadcast);
              }
            });
          }
        }
      } catch (err) {
        console.error('[WebSocket] Message parse error:', err.message);
      }
    });

    ws.on('close', () => {
      if (clientConsultationId && consultationClients.has(clientConsultationId)) {
        consultationClients.get(clientConsultationId).delete(ws);
        if (consultationClients.get(clientConsultationId).size === 0) {
          consultationClients.delete(clientConsultationId);
        }
      }
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Error:', err.message);
    });
  });

  console.log('[WebSocket] Real-time chat server initialized on /ws/consultation');
} catch (err) {
  console.warn('[WebSocket] ws module not available — real-time chat disabled:', err.message);
}

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Services: auth, ai, emergency, rag, booking, consultation, pharmacy`);
});
