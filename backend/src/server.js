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
import companyAdsRoutes from './routes/companyAds.routes.js';
import applicationsRoutes from './routes/applications.routes.js';
import franchiseTermsRoutes from './routes/franchiseTerms.routes.js';
import tncDetailsRoutes from './routes/tncDetails.routes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import mediaChannelRoutes from './routes/mediaChannel.routes.js';
import mediaDocumentRoutes from './routes/mediaDocument.routes.js';
import mediaDashboardRoutes from './routes/mediaDashboard.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
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
app.use(`${API_PREFIX}/company-ads`, companyAdsRoutes);
app.use(`${API_PREFIX}/applications`, applicationsRoutes);
app.use(`${API_PREFIX}/franchise-terms`, franchiseTermsRoutes);
app.use(`${API_PREFIX}/tnc-details`, tncDetailsRoutes);
app.use(`${API_PREFIX}`, testimonialRoutes);
app.use(`${API_PREFIX}/partner`, mediaChannelRoutes);
app.use(`${API_PREFIX}/media-document`, mediaDocumentRoutes);
app.use(`${API_PREFIX}/media-dashboard`, mediaDashboardRoutes);

// Member login route (direct access)
import { memberLogin } from './controllers/memberController.js';
app.post(`${API_PREFIX}/login`, memberLogin);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Please check your configuration.');
      process.exit(1);
    }

    // Analyze database schema
    // if (process.env.NODE_ENV === 'development') {
    //   await analyzeSchema();
    // }

    // Sync database (only in development)
    // if (process.env.NODE_ENV === 'development') {
    //   await sequelize.sync({ alter: false });
    //   console.log('✅ Database synchronized');
    // }

    // Start listening
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ========================================');
      console.log(`🚀 Multi-Tenant Backend API Server`);
      console.log('🚀 ========================================');
      console.log(`🚀 Environment: ${process.env.NODE_ENV}`);
      console.log(`🚀 Server running on: http://localhost:${PORT}`);
      console.log(`🚀 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
      console.log(`🚀 Health Check: http://localhost:${PORT}/health`);
      console.log('🚀 ========================================');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();