const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log('In-memory MongoDB URI:', uri);
  // Save the URI to a file for test usage
  fs.writeFileSync(path.join(__dirname, 'jest-mongodb-config.json'), JSON.stringify({ uri }));
  // Store the instance globally for teardown
  global.__MONGOD__ = mongod;
  process.env.MONGODB_URI = uri;
};
