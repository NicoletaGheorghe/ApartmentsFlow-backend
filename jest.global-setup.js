const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env file from the correct location
const envPath = path.resolve('C:', 'Projects', 'ApartmentSearch', 'backend', '.env');
console.log('Looking for .env file at:', envPath);
dotenv.config({ path: envPath });

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  // Save the URI to a file for test usage
  fs.writeFileSync(path.join(__dirname, 'jest-mongodb-config.json'), JSON.stringify({ uri }));
  // Store the instance globally for teardown
  global.__MONGOD__ = mongod;
  process.env.MONGODB_URI = uri;
  // Set up JWT secret for tests
  process.env.JWT_SECRET = 'test-secret-key';
  
  // Ensure Cloudinary URL is loaded from .env
  if (!process.env.CLOUDINARY_URL) {
    console.error('CLOUDINARY_URL not found in .env file');
    console.error('Current environment variables:', process.env);
    process.exit(1);
  }
};
