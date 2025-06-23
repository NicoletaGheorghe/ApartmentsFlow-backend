jest.setTimeout(30000);
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Apartment = require('../models/apartment.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');

// Mock Cloudinary
jest.mock('../config/cloudinary', () => ({
  uploader: {
    upload: jest.fn().mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image/upload/mock-image.jpg',
      public_id: 'test/mock-image',
      bytes: 1024,
      format: 'jpg',
      width: 800,
      height: 600,
    }),
  },
}));

let mongoServer;
let adminToken;
let agentToken;
let userToken;
let adminUser;
let agentUser;
let regularUser;
let cache;

// Helper function to create test apartment data
const createTestApartment = (isPublic = true, ownerId = null) => ({
  title: `${isPublic ? 'Public' : 'Private'} Apartment`,
  description: `A ${isPublic ? 'public' : 'private'} listing`,
  price: isPublic ? 1000 : 2000,
  location: isPublic
    ? {
        type: 'Point',
        coordinates: [12.34, 56.78],
        address: {
          country: 'Testland',
          state: 'Test State',
          city: 'Test City',
          street: '123 Main St',
          zipCode: '12345'
        }
      }
    : {
        type: 'Point',
        coordinates: [98.76, 54.32],
        address: {
          country: 'Testland',
          state: 'Test State',
          city: 'Test City',
          street: '456 Main St',
          zipCode: '54321'
        }
      },
  bedrooms: isPublic ? 2 : 3,
  bathrooms: isPublic ? 1 : 2,
  area: isPublic ? 1000 : 1500,
  status: 'available',
  isPublic,
  externalUrl: `https://example.com/${isPublic ? 'public' : 'private'}`,
  owner: ownerId,
  amenities: ['Parking', 'Gym', 'WiFi'],
});

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  cache = new NodeCache();

  // Create test users
  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
  });

  agentUser = await User.create({
    name: 'Agent User',
    email: 'agent@test.com',
    password: 'password123',
    role: 'agent',
  });

  regularUser = await User.create({
    name: 'Regular User',
    email: 'user@test.com',
    password: 'password123',
    role: 'user',
  });

  // Generate tokens
  adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET);
  agentToken = jwt.sign({ id: agentUser._id }, process.env.JWT_SECRET);
  userToken = jwt.sign({ id: regularUser._id }, process.env.JWT_SECRET);
});

afterAll(async () => {
  // Clean up all test data
  await User.deleteMany({});
  await Apartment.deleteMany({});

  // Close cache
  if (cache) {
    cache.close();
    cache = null;
  }

  // Disconnect from MongoDB
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Stop MongoDB memory server
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
});

beforeEach(async () => {
  // Clear the cache before each test
  if (cache) {
    cache.flushAll();
  }
  // Clear apartments before each test
  await Apartment.deleteMany({});
});

describe('Apartment Access Control', () => {
  test('should create public and private listings', async () => {
    const publicListing = createTestApartment(true, adminUser._id);
    const privateListing = createTestApartment(false, adminUser._id);

    // Create listings as admin
    const [publicResponse, privateResponse] = await Promise.all([
      request(app)
        .post('/api/apartments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(publicListing),
      request(app)
        .post('/api/apartments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(privateListing),
    ]);

    expect(publicResponse.status).toBe(201);
    expect(privateResponse.status).toBe(201);
    expect(publicResponse.body.isPublic).toBe(true);
    expect(privateResponse.body.isPublic).toBe(false);
  });

  test('should only show public listings to regular users', async () => {
    const publicListing = createTestApartment(true, adminUser._id);
    const privateListing = createTestApartment(false, adminUser._id);

    // Create listings as admin
    await Promise.all([
      request(app)
        .post('/api/apartments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(publicListing),
      request(app)
        .post('/api/apartments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(privateListing),
    ]);

    // Regular user should only see public listing
    const response = await request(app)
      .get('/api/apartments')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.apartments).toHaveLength(1);
    expect(response.body.apartments[0].isPublic).toBe(true);
  });

  test('should show all listings to admin and their own private listings to agents', async () => {
    const publicListing = createTestApartment(true, adminUser._id);
    const privateListing = createTestApartment(false, adminUser._id);
    const agentPrivateListing = {
      ...createTestApartment(false, agentUser._id),
      title: 'Agent Private Apartment',
      description: 'A private listing by agent',
      price: 3000,
    };

    // Create listings as admin
    await Promise.all([
      request(app)
        .post('/api/apartments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(publicListing),
      request(app)
        .post('/api/apartments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(privateListing),
      request(app)
        .post('/api/apartments')
        .set('Authorization', `Bearer ${agentToken}`)
        .send(agentPrivateListing),
    ]);

    // Admin should see all listings
    const adminResponse = await request(app)
      .get('/api/apartments')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.apartments).toHaveLength(3);

    // Agent should see public listings and their own private listing
    const agentResponse = await request(app)
      .get('/api/apartments')
      .set('Authorization', `Bearer ${agentToken}`);

    expect(agentResponse.status).toBe(200);
    expect(agentResponse.body.apartments).toHaveLength(2);
    expect(agentResponse.body.apartments.some(apt => apt.isPublic)).toBe(true);
    expect(agentResponse.body.apartments.some(apt => !apt.isPublic && apt.owner._id === agentUser._id.toString())).toBe(true);
  });

  test('should only allow admins to change isPublic status', async () => {
    const apartment = createTestApartment(true, agentUser._id);

    // Create apartment as agent
    const createResponse = await request(app)
      .post('/api/apartments')
      .set('Authorization', `Bearer ${agentToken}`)
      .send(apartment);

    expect(createResponse.status).toBe(201);
    const apartmentId = createResponse.body._id;

    // Agent should not be able to change isPublic status
    const agentResponse = await request(app)
      .put(`/api/apartments/${apartmentId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        isPublic: false,
      });

    expect(agentResponse.status).toBe(403);
    expect(agentResponse.body.error).toBe('Only admins can change the public status of listings');

    // Admin should be able to change isPublic status
    const adminResponse = await request(app)
      .put(`/api/apartments/${apartmentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        isPublic: false,
      });

    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.isPublic).toBe(false);
  });
});

describe('Image Upload', () => {
  test('should reject image upload from regular users', async () => {
    const response = await request(app)
      .post('/api/apartments/upload-images')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('images', Buffer.from('fake image data'), 'test.jpg');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('User role user is not authorized to access this route');
  });

  test('should reject upload without images', async () => {
    const response = await request(app)
      .post('/api/apartments/upload-images')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('No images uploaded');
  });

  test('should reject upload with too many images', async () => {
    const response = await request(app)
      .post('/api/apartments/upload-images')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('images', Buffer.from('fake image data'), 'test1.jpg')
      .attach('images', Buffer.from('fake image data'), 'test2.jpg')
      .attach('images', Buffer.from('fake image data'), 'test3.jpg')
      .attach('images', Buffer.from('fake image data'), 'test4.jpg')
      .attach('images', Buffer.from('fake image data'), 'test5.jpg')
      .attach('images', Buffer.from('fake image data'), 'test6.jpg')
      .attach('images', Buffer.from('fake image data'), 'test7.jpg')
      .attach('images', Buffer.from('fake image data'), 'test8.jpg')
      .attach('images', Buffer.from('fake image data'), 'test9.jpg');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Unexpected file field');
  });

  test('should allow admin to upload images', async () => {
    const response = await request(app)
      .post('/api/apartments/upload-images')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('images', Buffer.from('fake image data'), 'test.jpg');

    // Now expecting success with mocked Cloudinary
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.images).toHaveLength(1);
    expect(response.body.images[0]).toHaveProperty('url');
    expect(response.body.images[0]).toHaveProperty('publicId');
  });
});