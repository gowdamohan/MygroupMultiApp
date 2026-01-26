import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize, { testConnection, analyzeSchema, tableExists } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import geoRoutes from './routes/geoRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/admin.routes.js';
import franchiseRoutes from './routes/franchise.routes.js';
import footerRoutes from './routes/footer.routes.js';
import homeRoutes from './routes/home.routes.js';
import memberRoutes from './routes/member.routes.js';
import headerAdsRoutes from './routes/headerAds.routes.js';
import headerAdsPricingRoutes from './routes/headerAdsPricing.routes.js';
import companyAdsRoutes from './routes/companyAds.routes.js';
import applicationsRoutes from './routes/applications.routes.js';
import franchiseTermsRoutes from './routes/franchiseTerms.routes.js';
import franchiseOfferAdsRoutes from './routes/franchiseOfferAds.routes.js';
import userTermsRoutes from './routes/userTerms.routes.js';
import tncDetailsRoutes from './routes/tncDetails.routes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import mediaChannelRoutes from './routes/mediaChannel.routes.js';
import mediaDocumentRoutes from './routes/mediaDocument.routes.js';
import mediaDashboardRoutes from './routes/mediaDashboard.routes.js';
import mymediaRoutes from './routes/mymedia.routes.js';
import appsRoutes from './routes/apps.routes.js';
import advertisementRoutes from './routes/advertisement.routes.js';
import supportRoutes from './routes/support.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import { cleanupExpiredTokens, markInactiveUsers } from './utils/tokenCleanup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Middleware
// Configure helmet with CSP that allows API connections
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

// Add self (same origin) and any API backend URLs for CSP
const cspConnectSrc = ["'self'", ...allowedOrigins];

// In production, allow connections to same origin (API is served from same server)
// In development, allow localhost connections
if (process.env.NODE_ENV !== 'production') {
  cspConnectSrc.push('http://localhost:5000', 'http://localhost:5002', 'ws://localhost:*');
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: cspConnectSrc,
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "*"],
      mediaSrc: ["'self'", "data:", "blob:", "*"],
      frameSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Rate limiting - skip in development or use very high limit
const isDevelopment = process.env.NODE_ENV !== 'production';
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100000 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000), // very high limit in dev
  message: 'Too many requests from this IP, please try again later.',
  skip: () => isDevelopment // Skip rate limiting entirely in development
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/geo`, geoRoutes);
app.use(`${API_PREFIX}/groups`, groupRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/franchise`, franchiseRoutes);
app.use(`${API_PREFIX}/footer`, footerRoutes);
app.use(`${API_PREFIX}/home`, homeRoutes);
app.use(`${API_PREFIX}/member`, memberRoutes);
app.use(`${API_PREFIX}/header-ads`, headerAdsRoutes);
app.use(`${API_PREFIX}/header-ads-pricing`, headerAdsPricingRoutes);
app.use(`${API_PREFIX}/company-ads`, companyAdsRoutes);
app.use(`${API_PREFIX}/applications`, applicationsRoutes);
app.use(`${API_PREFIX}/franchise-terms`, franchiseTermsRoutes);
app.use(`${API_PREFIX}/franchise-offer-ads`, franchiseOfferAdsRoutes);
app.use(`${API_PREFIX}/user-terms`, userTermsRoutes);
app.use(`${API_PREFIX}/tnc-details`, tncDetailsRoutes);
app.use(`${API_PREFIX}`, testimonialRoutes);
app.use(`${API_PREFIX}/partner`, mediaChannelRoutes);
app.use(`${API_PREFIX}/media-document`, mediaDocumentRoutes);
app.use(`${API_PREFIX}/media-dashboard`, mediaDashboardRoutes);
app.use(`${API_PREFIX}/mymedia`, mymediaRoutes);
app.use(`${API_PREFIX}/apps`, appsRoutes);
app.use(`${API_PREFIX}/advertisement`, advertisementRoutes);
app.use(`${API_PREFIX}/support`, supportRoutes);
app.use(`${API_PREFIX}/wallet`, walletRoutes);

// Member login route (direct access)
import { memberLogin } from './controllers/memberController.js';
app.post(`${API_PREFIX}/login`, memberLogin);

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../public/static');

  // Serve static files from the React build
  app.use(express.static(frontendPath));

  // Handle React routing - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path === '/health' || req.path === '/ready') {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// 404 handler (for API routes that don't exist)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler (normalize multer errors to 400)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const isMulter = err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_UNEXPECTED_FILE' || err.name === 'MulterError';
  const status = err.status || (isMulter ? 400 : 500);
  const message = isMulter && err.code === 'LIMIT_FILE_SIZE'
    ? 'File too large. Maximum size is 5MB.'
    : (err.message || 'Internal server error');
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server (listen immediately so HTTP health checks succeed even if DB is down)
const startServer = async () => {
  try {
    // Start listening immediately
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ========================================');
      console.log(`🚀 Multi-Tenant Backend API Server`);
      console.log('🚀 ========================================');
      console.log(`🚀 Environment: ${process.env.NODE_ENV}`);
      console.log(`🚀 Server running on: http://0.0.0.0:${PORT}`);
      console.log(`🚀 API Base URL: http://0.0.0.0:${PORT}${API_PREFIX}`);
      console.log(`🚀 Health Check: http://0.0.0.0:${PORT}/health`);
      console.log('🚀 ========================================');
      console.log('');
    });

    // Test database connection in background; do not exit the process on failure
    (async () => {
      try {
        const dbConnected = await testConnection();
        if (!dbConnected) {
          console.error('❌ Failed to connect to database. Please check your configuration.');
        } else {
          console.log('✅ Database connected');
        }
      } catch (err) {
        console.error('❌ Error while testing DB connection:', err.message || err);
      }
    })();
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Readiness endpoint checks DB connectivity (returns 200 when DB reachable)
app.get('/ready', async (req, res) => {
  try {
    const ok = await testConnection();
    if (ok) return res.status(200).json({ success: true, db: true });
    return res.status(503).json({ success: false, db: false });
  } catch (err) {
    return res.status(503).json({ success: false, db: false, error: err.message });
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

/**
 * Start token cleanup scheduler
 * Runs daily to mark inactive users and clean up expired tokens
 */
const startTokenCleanupScheduler = () => {
  const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

  // Run cleanup immediately on startup (after a short delay to ensure DB is connected)
  setTimeout(async () => {
    console.log('🔄 Starting initial token cleanup...');
    await cleanupExpiredTokens();
    await markInactiveUsers();
  }, 10000); // Wait 10 seconds after server start

  // Schedule daily cleanup
  setInterval(async () => {
    console.log('🔄 Running scheduled token cleanup...');
    await cleanupExpiredTokens();
    await markInactiveUsers();
  }, CLEANUP_INTERVAL_MS);

  console.log('✅ Token cleanup scheduler started (runs daily)');
};

// Start the server
startServer();

// Start token cleanup scheduler after server starts
setTimeout(() => {
  startTokenCleanupScheduler();
}, 5000); // Wait 5 seconds after server starts