const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');

// Load environment variables securely from backend/.env or root .env
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { initDatabase, cleanExpiredCrops } = require('./database/database');
const { initSocketService } = require('./services/socketService');

const authRoutes = require('./routes/authRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const mandiPriceRoutes = require('./routes/mandiPrices');
const communicationRoutes = require('./routes/communicationRoutes');

const compression = require('compression');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// High-Performance Middleware
app.use(compression({ level: 6 })); // Gzip compression for instantaneous network transfer
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Dedicated folder paths for Main Website and Admin Website
const mainWebsitePath = path.join(__dirname, '..', 'main-website');
const adminWebsitePath = path.join(__dirname, '..', 'admin-website');
const frontendPath = path.join(__dirname, '..', 'frontend');

const staticCacheOptions = {
  etag: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
};

// Serve dedicated Admin Website at /admin and /admin/
app.get(['/admin', '/admin/'], (req, res) => {
  res.sendFile(path.join(adminWebsitePath, 'index.html'));
});
app.use('/admin', express.static(adminWebsitePath, staticCacheOptions));

// Serve Main Website at root /
app.use(express.static(mainWebsitePath, staticCacheOptions));
app.use(express.static(frontendPath, staticCacheOptions)); // Fallback compatibility

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/mandi-prices', mandiPriceRoutes);
app.use('/api/communication', communicationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'KISSAN-HUB API server is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend SPA fallback
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/admin')) {
    return res.sendFile(path.join(adminWebsitePath, 'index.html'));
  }
  res.sendFile(path.join(mainWebsitePath, 'index.html'));
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.'
  });
});

// Initialize database & start server
const startServer = async () => {
  try {
    await initDatabase();

    // Initialize Socket.IO server
    initSocketService(server);

    // Schedule background expired crops cleanup every hour
    setInterval(async () => {
      await cleanExpiredCrops();
    }, 60 * 60 * 1000);

    server.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🌾 KISSAN-HUB Server running at: http://localhost:${PORT}`);
      console.log(`🌾 Connected to SQLite database with migration safety`);
      console.log(`🌾 5-Day automatic crop expiry engine active`);
      console.log(`🌾 Real-time Socket.IO & WebRTC signaling ready`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error('Fatal error starting KISSAN-HUB server:', error);
    process.exit(1);
  }
};

startServer();
