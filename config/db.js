const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const localUri = 'mongodb://127.0.0.1:27017/lab_tracking_system';

  if (primaryUri) {
    try {
      console.log(`[Database] Attempting connection to primary MongoDB Atlas...`);
      const conn = await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 3000
      });
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.warn(`[Database Warning] Could not connect to primary MongoDB Atlas (${err.message}).`);
      console.warn(`[Database Warning] Disconnecting & falling back to local MongoDB...`);
      try {
        await mongoose.disconnect();
      } catch (e) {}
    }
  }

  try {
    const conn = await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[Database] Local MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[Database Error] Could not connect to local MongoDB: ${err.message}`);
    console.error(`[Database Error] Please ensure MongoDB service is running locally.`);
    process.exit(1);
  }
};

module.exports = connectDB;


