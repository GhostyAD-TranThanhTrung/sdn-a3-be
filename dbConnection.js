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
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
      // Don't exit on errors in production
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose disconnected from MongoDB Atlas');
    });
    
    // Handle reconnection
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Mongoose reconnected to MongoDB Atlas');
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose disconnected from MongoDB');
    });
    
    // Graceful close on app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("🔍 Connection string:", process.env.MONGO_URI ? "Provided" : "Missing");
    
    // In development, exit on connection failure
    // In production, let the app continue and show error in health check
    if (process.env.NODE_ENV !== 'production') {
      console.log("💡 Make sure your MongoDB Atlas cluster is running and IP is whitelisted");
      process.exit(1);
    }
  }
};

module.exports = connectDB;
