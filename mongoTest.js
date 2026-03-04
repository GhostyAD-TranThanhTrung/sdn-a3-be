const { MongoClient, ServerApiVersion } = require('mongodb');

const testMongoDBConnection = async () => {
  const uri = process.env.MONGO_URI;
  
  // Create a MongoClient with a MongoClientOptions object to set the Stable API version
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    console.log('🔗 Testing MongoDB native driver connection...');
    console.log('📍 URI provided:', !!uri);
    
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    
    // Send a ping to confirm a successful connection
    const result = await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
    
    // Test database access
    const db = client.db("SDN_Assignment3");
    const collections = await db.listCollections().toArray();
    console.log("📂 Available collections:", collections.map(col => col.name));
    
    return {
      success: true,
      message: "MongoDB native driver connection successful!",
      ping: result,
      collections: collections.map(col => col.name),
      host: client.s.url
    };
    
  } catch (error) {
    console.error("❌ MongoDB native driver connection failed:", error.message);
    return {
      success: false,
      message: "MongoDB native driver connection failed",
      error: error.message,
      code: error.code
    };
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log("🔌 MongoDB client connection closed");
  }
};

module.exports = { testMongoDBConnection };