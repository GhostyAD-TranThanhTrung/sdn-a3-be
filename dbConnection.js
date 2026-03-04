const mongoose = require("mongoose");
require('dotenv').config();

// Track connection state
let isConnecting = false;
let isConnected = false;

const connectDB = async () => {
  try {
    // If already connected or connecting, skip
    if (isConnected || isConnecting) {
      return mongoose.connection;
    }
    
    // Check if already connected via mongoose
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return mongoose.connection;
    }
    
    isConnecting = true;
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // MongoDB Atlas connection options optimized for serverless
      maxPoolSize: 1, // Smaller pool for serverless
      serverSelectionTimeoutMS: 3000, // Shorter timeout for serverless
      socketTimeoutMS: 30000, // Shorter socket timeout
      family: 4, // Use IPv4
      // Serverless-friendly options
      connectTimeoutMS: 3000,
      maxIdleTimeMS: 30000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });
    
    isConnected = true;
    isConnecting = false;
    
    console.log(`✅ MongoDB Atlas connected successfully to: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Add connection event listeners for monitoring
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB Atlas');
      isConnected = true;
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
      isConnected = false;
      isConnecting = false;
      // Don't exit in serverless environment
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose disconnected from MongoDB Atlas');
      isConnected = false;
    });
    
    // Handle reconnection
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Mongoose reconnected to MongoDB Atlas');
      isConnected = true;
    });
    
    return conn;
    
  } catch (error) {
    isConnecting = false;
    isConnected = false;
    
    console.error("❌ MongoDB Atlas connection failed:", error.message);
    console.error("🔍 Connection string provided:", process.env.MONGO_URI ? "Yes" : "No");
    
    // Enhanced error logging for Atlas
    if (error.message.includes('authentication')) {
      console.error("🔐 Authentication failed - check username/password");
    } else if (error.message.includes('network')) {
      console.error("🌐 Network error - check internet connection or firewall");
    } else if (error.message.includes('timeout')) {
      console.error("⏱️ Connection timeout - check Atlas cluster status");
    }
    
    // In serverless, don't exit - let the function continue and show error in health check
    console.log("⚠️ Serverless function will continue without database connection");
    
    // Return a mock connection object to prevent crashes
    return {
      connection: {
        readyState: 0,
        host: 'disconnected',
        name: 'unavailable'
      }
    };
  }
};

// Graceful shutdown helper
const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('🔌 MongoDB connection closed');
  }
};

module.exports = { connectDB, disconnectDB };
