const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

module.exports = async () => {
  // Disconnect from MongoDB
  await mongoose.disconnect();

  // Try to stop all running MongoMemoryServer instances
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
    delete global.__MONGOD__;
  }

  // Remove the config file
  const configPath = path.join(__dirname, 'jest-mongodb-config.json');
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
};
