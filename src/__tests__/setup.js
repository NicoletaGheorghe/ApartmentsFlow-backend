const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    console.log('Test MongoDB URI:', uri);

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    // Wait for the connection to be established
    await mongoose.connection.asPromise();

    // Verify connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection not ready');
    }
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
});

afterEach(async () => {
  try {
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
  } catch (error) {
    console.error('Error in afterEach:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Close all connections
    await Promise.all([mongoose.disconnect(), mongoServer.stop()]);
  } catch (error) {
    console.error('Error cleaning up test database:', error);
    throw error;
  }
});

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.disconnect();
    await mongoServer.stop();
    process.exit(0);
  } catch (error) {
    console.error('Error during process termination:', error);
    process.exit(1);
  }
});

describe('Database Setup', () => {
  it('should connect to the database', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });
});
