const mongoose = require("mongoose");
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // MongoDB Atlas connection options
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    });
    
    console.log(`✅ MongoDB Atlas connected successfully to: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Add connection event listeners for monitoring
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB Atlas');
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
    
    // Graceful close on app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
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
    
    // In development, exit on connection failure
    // In production, let the app continue and show error in health check
    if (process.env.NODE_ENV !== 'production') {
      console.log("💡 Make sure your MongoDB Atlas cluster is running and IP is whitelisted");
      process.exit(1);
    }
  }
};

module.exports = connectDB;
