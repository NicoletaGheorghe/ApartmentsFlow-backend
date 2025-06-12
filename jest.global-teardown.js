const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  // Try to stop all running MongoMemoryServer instances
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  } else {
    // Fallback: try to read the config and stop a new instance
    const configPath = path.join(__dirname, 'jest-mongodb-config.json');
    if (fs.existsSync(configPath)) {
      // No need to use instanceId, just stop all
      await MongoMemoryServer.cleanup();
      fs.unlinkSync(configPath);
    }
  }
};
