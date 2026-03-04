const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const quiz = require('./router/quizRouter');
const user = require('./router/userRouter');
const { connectDB } = require('./dbConnection');
const jwt = require('jsonwebtoken');

require('dotenv').config();

// Initialize database connection lazily
let dbConnectionPromise = null;

// Lazy database connection for serverless
const ensureDBConnection = async () => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB();
  }
  return dbConnectionPromise;
};

// Configure CORS to allow requests from frontend
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'http://localhost:3000', // Alternative local port
  process.env.FRONTEND_URL, // Production frontend URL from Vercel env var
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Middleware to ensure database connection for protected routes
const dbMiddleware = async (req, res, next) => {
  try {
    await ensureDBConnection();
    next();
  } catch (error) {
    console.error('Database middleware error:', error);
    // Continue anyway - let individual routes handle DB errors
    next();
  }
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply database middleware to API routes
app.use('/quizzes', dbMiddleware, quiz);
app.use('/users', dbMiddleware, user);

// Health check endpoint for database status
app.get('/health', async (req, res) => {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: 'OK',
    services: {
      database: {
        status: 'unknown',
        message: ''
      },
      server: {
        status: 'running',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      }
    }
  };

  try {
    // Try to ensure DB connection
    await ensureDBConnection();
    
    if (mongoose.connection.readyState === 1) {
      healthCheck.services.database.status = 'connected';
      healthCheck.services.database.message = 'Database connection is healthy';
    } else if (mongoose.connection.readyState === 2) {
      healthCheck.services.database.status = 'connecting';
      healthCheck.services.database.message = 'Database is connecting';
    } else {
      healthCheck.services.database.status = 'disconnected';
      healthCheck.services.database.message = 'Database is not connected';
      healthCheck.status = 'PARTIAL';
    }
  } catch (error) {
    healthCheck.services.database.status = 'error';
    healthCheck.services.database.message = error.message;
    healthCheck.status = 'PARTIAL';
  }

  const statusCode = healthCheck.status === 'OK' ? 200 : 206;
  res.status(statusCode).json(healthCheck);
});

// Root endpoint with database status
app.get('/', async (req, res) => {
  let dbStatus = 'Unknown';
  let dbMessage = '';
  
  try {
    // Try to connect to database
    await ensureDBConnection();
    
    switch (mongoose.connection.readyState) {
      case 0:
        dbStatus = '❌ Disconnected';
        dbMessage = 'Database is disconnected';
        break;
      case 1:
        dbStatus = '✅ Connected';
        dbMessage = 'Database connection is healthy';
        break;
      case 2:
        dbStatus = '🔄 Connecting';
        dbMessage = 'Database is connecting';
        break;
      case 3:
        dbStatus = '⚠️ Disconnecting';
        dbMessage = 'Database is disconnecting';
        break;
      default:
        dbStatus = '❓ Unknown';
        dbMessage = 'Database status unknown';
    }
  } catch (error) {
    dbStatus = '❌ Error';
    dbMessage = `Connection error: ${error.message}`;
  }

  const response = `
    <html>
    <head>
      <title>SDN Backend API</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
        .connected { background-color: #d4edda; border: 1px solid #c3e6cb; }
        .error { background-color: #f8d7da; border: 1px solid #f5c2c7; }
        .warning { background-color: #fff3cd; border: 1px solid #ffecb3; }
        .info { background-color: #d1ecf1; border: 1px solid #bee5eb; }
        .endpoint { background-color: #f8f9fa; padding: 10px; border-radius: 3px; margin: 5px 0; font-family: monospace; }
        h1 { color: #333; }
        h2 { color: #666; }
      </style>
    </head>
    <body>
      <h1>🚀 SDN Backend API Server</h1>
      
      <div class="status ${dbStatus.includes('✅') ? 'connected' : dbStatus.includes('❌') ? 'error' : dbStatus.includes('🔄') ? 'warning' : 'info'}">
        <h2>Database Status: ${dbStatus}</h2>
        <p>${dbMessage}</p>
      </div>
      
      <div class="status connected">
        <h2>Server Status: ✅ Running</h2>
        <p>Server is running successfully</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds</p>
      </div>
      
      <h2>📡 Available Endpoints:</h2>
      <div class="endpoint">GET /health - Health check with detailed status</div>
      <div class="endpoint">POST /users/register - User registration</div>
      <div class="endpoint">POST /users/login - User login</div>
      <div class="endpoint">GET /quizzes - Get all quizzes</div>
      <div class="endpoint">POST /quizzes - Create quiz (authenticated)</div>
      <div class="endpoint">GET /quizzes/:id - Get quiz by ID</div>
      <div class="endpoint">PUT /quizzes/:id - Update quiz (authenticated)</div>
      <div class="endpoint">DELETE /quizzes/:id - Delete quiz (authenticated)</div>
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        Last checked: ${new Date().toLocaleString()}
      </p>
    </body>
    </html>
  `;
  
  res.send(response);
});

// Export the app for Vercel
module.exports = app;

// Only listen if not in serverless environment
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}