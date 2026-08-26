const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log(`[db] MongoDB connected -> ${mongoose.connection.host}`);
  } catch (err) {
    console.error('[db] Connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
