const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const quiz = require('./router/quizRouter');
const user = require('./router/userRouter');
const { connectDB, getConnectionStatus, testConnection } = require('./dbConnection');
const { testMongoDBConnection } = require('./mongoTest');
const jwt = require('jsonwebtoken');

require('dotenv').config();

// Store startup test results
let startupTestResults = {
  timestamp: new Date().toISOString(),
  mongooseTest: { status: 'pending', message: 'Test not completed', error: null, duration: null },
  nativeTest: { status: 'pending', message: 'Test not completed', error: null, duration: null }
};

// Run automated database tests on startup
(async () => {
  console.log('🚀 Starting server...');
  console.log('🔗 Environment variables loaded');
  console.log('📍 MONGO_URI exists:', !!process.env.MONGO_URI);
  
  // Run Mongoose test
  console.log('🧪 Running Mongoose connection test...');
  const mongooseStart = Date.now();
  try {
    const mongooseResult = await testConnection();
    const mongooseDuration = Date.now() - mongooseStart;
    
    if (mongooseResult) {
      startupTestResults.mongooseTest = {
        status: 'success',
        message: 'Mongoose connection successful',
        error: null,
        duration: mongooseDuration
      };
      console.log('✅ Mongoose test passed in', mongooseDuration, 'ms');
    } else {
      startupTestResults.mongooseTest = {
        status: 'failed',
        message: 'Mongoose connection failed',
        error: 'Connection returned false',
        duration: mongooseDuration
      };
      console.log('❌ Mongoose test failed in', mongooseDuration, 'ms');
    }
  } catch (error) {
    const mongooseDuration = Date.now() - mongooseStart;
    startupTestResults.mongooseTest = {
      status: 'error',
      message: 'Mongoose connection error',
      error: error.message,
      duration: mongooseDuration
    };
    console.log('❌ Mongoose test error:', error.message);
  }
  
  // Run native MongoDB test
  console.log('🧪 Running native MongoDB driver test...');
  const nativeStart = Date.now();
  try {
    const nativeResult = await testMongoDBConnection();
    const nativeDuration = Date.now() - nativeStart;
    
    if (nativeResult.success) {
      startupTestResults.nativeTest = {
        status: 'success',
        message: 'Native MongoDB driver connection successful',
        error: null,
        duration: nativeDuration,
        details: nativeResult
      };
      console.log('✅ Native MongoDB test passed in', nativeDuration, 'ms');
    } else {
      startupTestResults.nativeTest = {
        status: 'failed',
        message: 'Native MongoDB driver connection failed',
        error: nativeResult.error || 'Connection failed',
        duration: nativeDuration,
        details: nativeResult
      };
      console.log('❌ Native MongoDB test failed in', nativeDuration, 'ms');
    }
  } catch (error) {
    const nativeDuration = Date.now() - nativeStart;
    startupTestResults.nativeTest = {
      status: 'error',
      message: 'Native MongoDB driver test error',
      error: error.message,
      duration: nativeDuration
    };
    console.log('❌ Native MongoDB test error:', error.message);
  }
  
  // Summary
  const mongooseOk = startupTestResults.mongooseTest.status === 'success';
  const nativeOk = startupTestResults.nativeTest.status === 'success';
  
  if (mongooseOk && nativeOk) {
    console.log('🎉 All database tests passed! Both Mongoose and native driver are working.');
  } else if (nativeOk && !mongooseOk) {
    console.log('⚠️  Native driver works but Mongoose has issues. Check Mongoose configuration.');
  } else if (mongooseOk && !nativeOk) {
    console.log('⚠️  Mongoose works but native driver has issues. Unusual but server will continue.');
  } else {
    console.log('❌ Both database tests failed. Check MongoDB Atlas connectivity and credentials.');
  }
  
  console.log('🏃 Server startup complete. Test results available on homepage.');
})();

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

// Database connection middleware
const dbMiddleware = async (req, res, next) => {
  try {
    console.log('🔌 Ensuring database connection...');
    await connectDB();
    console.log('✅ Database connection ready for request');
    next();
  } catch (error) {
    console.error('❌ Database middleware error:', error.message);
    // Return error response for database issues
    res.status(503).json({
      error: 'Database Unavailable',
      message: 'Cannot connect to database',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply database middleware to API routes
app.use('/quizzes', dbMiddleware, quiz);
app.use('/users', dbMiddleware, user);

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: 'OK',
    services: {
      database: {
        status: 'unknown',
        message: '',
        details: {}
      },
      server: {
        status: 'running',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      }
    }
  };

  try {
    // Get detailed connection status
    const dbStatus = getConnectionStatus();
    console.log('📊 Database status check:', dbStatus);
    
    // Try to ensure connection
    await connectDB();
    
    const readyState = mongoose.connection.readyState;
    healthCheck.services.database.details = {
      readyState,
      isConnected: dbStatus.isConnected,
      isConnecting: dbStatus.isConnecting,
      host: dbStatus.host || 'unknown',
      name: dbStatus.name || 'unknown',
      error: dbStatus.error?.message || null
    };
    
    if (readyState === 1) {
      healthCheck.services.database.status = 'connected';
      healthCheck.services.database.message = 'Database connection is healthy';
    } else if (readyState === 2) {
      healthCheck.services.database.status = 'connecting';
      healthCheck.services.database.message = 'Database is connecting';
      healthCheck.status = 'PARTIAL';
    } else {
      healthCheck.services.database.status = 'disconnected';
      healthCheck.services.database.message = 'Database is not connected';
      healthCheck.status = 'ERROR';
    }
  } catch (error) {
    console.error('❌ Health check database error:', error.message);
    healthCheck.services.database.status = 'error';
    healthCheck.services.database.message = error.message;
    healthCheck.services.database.details.error = error.message;
    healthCheck.status = 'ERROR';
  }

  const statusCode = healthCheck.status === 'OK' ? 200 : healthCheck.status === 'PARTIAL' ? 206 : 503;
  res.status(statusCode).json(healthCheck);
});

// Test database connection endpoint
app.get('/test-db', async (req, res) => {
  console.log('🧪 Database connection test requested');
  
  try {
    const result = await testConnection();
    const status = getConnectionStatus();
    
    res.json({
      success: result,
      message: result ? 'Database connection successful!' : 'Database connection failed',
      status: status,
      timestamp: new Date().toISOString(),
      mongooseState: {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      }
    });
  } catch (error) {
    console.error('🧪 Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Database test failed with error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test MongoDB native driver connection
app.get('/test-native', async (req, res) => {
  console.log('🧪 Native MongoDB driver test requested');
  
  try {
    const result = await testMongoDBConnection();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'MongoDB native driver connection successful!',
        data: result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'MongoDB native driver connection failed',
        data: result,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('🧪 Native MongoDB test error:', error);
    res.status(500).json({
      success: false,
      message: 'Native MongoDB test failed with error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint with enhanced database status
app.get('/', async (req, res) => {
  let dbStatus = 'Unknown';
  let dbMessage = '';
  let dbDetails = {};
  
  try {
    // Get current status without forcing connection
    const currentStatus = getConnectionStatus();
    dbDetails = currentStatus;
    
    // Try to connect if not connected
    if (!currentStatus.isConnected) {
      console.log('🔌 Attempting database connection...');
      await connectDB();
    }
    
    switch (mongoose.connection.readyState) {
      case 0:
        dbStatus = '❌ Disconnected';
        dbMessage = 'Database is disconnected';
        break;
      case 1:
        dbStatus = '✅ Connected';
        dbMessage = `Connected to ${mongoose.connection.host}/${mongoose.connection.name}`;
        break;
      case 2:
        dbStatus = '🔄 Connecting';
        dbMessage = 'Database connection in progress';
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
    dbDetails.error = error.message;
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
        <details style="margin-top: 10px;">
          <summary style="cursor: pointer;">🔍 Database Details</summary>
          <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px; font-size: 12px; overflow-x: auto;">${JSON.stringify(dbDetails, null, 2)}</pre>
        </details>
      </div>
      
      <div class="status connected">
        <h2>Server Status: ✅ Running</h2>
        <p>Server is running successfully</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds</p>
      </div>
      
      <div class="status info">
        <h2>🧪 Startup Database Tests</h2>
        <p><strong>Test Time:</strong> ${new Date(startupTestResults.timestamp).toLocaleString()}</p>
        
        <div style="margin: 15px 0; padding: 10px; border-radius: 5px; background: ${startupTestResults.mongooseTest.status === 'success' ? '#d4edda' : startupTestResults.mongooseTest.status === 'pending' ? '#fff3cd' : '#f8d7da'};">
          <strong>🍃 Mongoose Test:</strong> 
          ${startupTestResults.mongooseTest.status === 'success' ? '✅' : startupTestResults.mongooseTest.status === 'pending' ? '⏳' : '❌'} 
          ${startupTestResults.mongooseTest.message}
          ${startupTestResults.mongooseTest.duration ? ` (${startupTestResults.mongooseTest.duration}ms)` : ''}
          ${startupTestResults.mongooseTest.error ? `<br><small style="color: #721c24;">Error: ${startupTestResults.mongooseTest.error}</small>` : ''}
        </div>
        
        <div style="margin: 15px 0; padding: 10px; border-radius: 5px; background: ${startupTestResults.nativeTest.status === 'success' ? '#d4edda' : startupTestResults.nativeTest.status === 'pending' ? '#fff3cd' : '#f8d7da'};">
          <strong>🔗 Native MongoDB Test:</strong> 
          ${startupTestResults.nativeTest.status === 'success' ? '✅' : startupTestResults.nativeTest.status === 'pending' ? '⏳' : '❌'} 
          ${startupTestResults.nativeTest.message}
          ${startupTestResults.nativeTest.duration ? ` (${startupTestResults.nativeTest.duration}ms)` : ''}
          ${startupTestResults.nativeTest.error ? `<br><small style="color: #721c24;">Error: ${startupTestResults.nativeTest.error}</small>` : ''}
        </div>
        
        <details style="margin-top: 10px;">
          <summary style="cursor: pointer;">📊 Full Test Results</summary>
          <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px; font-size: 12px; overflow-x: auto;">${JSON.stringify(startupTestResults, null, 2)}</pre>
        </details>
      </div>
      
      <h2>📡 Available Endpoints:</h2>
      <div class="endpoint">GET /health - Health check with detailed status</div>
      <div class="endpoint">GET /test-db - Test database connection (Mongoose)</div>
      <div class="endpoint">GET /test-native - Test database connection (Native MongoDB driver)</div>
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