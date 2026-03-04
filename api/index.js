// Serverless function wrapper for Vercel
const app = require('../index.js');

// Export as serverless function with error handling
module.exports = async (req, res) => {
  try {
    // Handle the request with the Express app
    app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    
    // Return a proper error response
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Serverless function encountered an error',
        timestamp: new Date().toISOString()
      });
    }
  }
};