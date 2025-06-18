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
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    // Wait for the connection to be established
    await mongoose.connection.asPromise();
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await mongoose.disconnect();
    await mongoServer.stop();
  } catch (error) {
    console.error('Error cleaning up test database:', error);
    throw error;
  }
});

describe('Database Setup', () => {
  it('should connect to the database', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });
});
