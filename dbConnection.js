const mongoose = require("mongoose");
require('dotenv').config();

// Track connection state
let isConnecting = false;
let isConnected = false;
let connectionError = null;

const connectDB = async () => {
  try {
    // If already connected, return existing connection
    if (mongoose.connection.readyState === 1) {
      console.log('📍 Using existing MongoDB connection');
      isConnected = true;
      return mongoose.connection;
    }
    
    // If already connecting, wait for it
    if (isConnecting) {
      console.log('⏳ Connection in progress, waiting...');
      while (isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return mongoose.connection;
    }
    
    console.log('🔗 Initiating MongoDB Atlas connection...');
    console.log('📍 Connection string provided:', process.env.MONGO_URI ? 'Yes' : 'No');
    
    isConnecting = true;
    connectionError = null;
    
    // Clear any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // MongoDB Atlas connection options optimized for serverless
      maxPoolSize: 1, // Smaller pool for serverless
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      family: 4, // Use IPv4
      retryWrites: true,
      w: 'majority'
    });
    
    isConnected = true;
    isConnecting = false;
    
    console.log(`✅ MongoDB Atlas connected successfully!`);
    console.log(`📊 Host: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
    console.log(`🔢 ReadyState: ${conn.connection.readyState}`);
    
    return conn.connection;
    
  } catch (error) {
    isConnecting = false;
    isConnected = false;
    connectionError = error;
    
    console.error("❌ MongoDB Atlas connection failed:");
    console.error("📝 Error message:", error.message);
    console.error("🔍 Error code:", error.code);
    console.error("📋 Full error:", error);
    
    // Check specific error types
    if (error.message.includes('authentication')) {
      console.error("🔐 Authentication failed - check username/password in connection string");
    } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
      console.error("🌐 Network error - check internet connection");
    } else if (error.message.includes('timeout')) {
      console.error("⏱️ Connection timeout - check Atlas cluster status");
    } else if (error.code === 8000) {
      console.error("🔒 Authentication failed - wrong credentials");
    }
    
    // Return connection state info for debugging
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

// Add connection event listeners (only once)
if (!mongoose.connection._events) {
  mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connected event fired');
    isConnected = true;
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error event:', err.message);
    isConnected = false;
    connectionError = err;
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Mongoose disconnected event fired');
    isConnected = false;
  });
  
  mongoose.connection.on('reconnected', () => {
    console.log('🔄 Mongoose reconnected event fired');
    isConnected = true;
    connectionError = null;
  });
}

// Get connection status
const getConnectionStatus = () => {
  return {
    isConnected,
    isConnecting,
    readyState: mongoose.connection.readyState,
    error: connectionError,
    host: mongoose.connection.host,
    name: mongoose.connection.name
  };
};

// Test connection function
const testConnection = async () => {
  try {
    console.log('🧪 Testing database connection...');
    const conn = await connectDB();
    console.log('✅ Connection test successful!');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
};

module.exports = { connectDB, getConnectionStatus, testConnection };
