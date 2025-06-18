const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Apartment = require('../models/apartment.model');
const User = require('../models/user.model');
const cloudinary = require('../config/cloudinary');

let mongoServer;
let testUser;
let testToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create a test user
  testUser = await User.create({
    name: 'Test Agent',
    email: 'test@example.com',
    password: 'password123',
    role: 'agent',
  });

  // Get auth token
  const loginResponse = await request(app).post('/api/auth/login').send({
    email: 'test@example.com',
    password: 'password123',
  });

  testToken = loginResponse.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Apartment Features', () => {
  let testApartment;

  // Test 1: Manual Creation
  test('should create a new apartment manually', async () => {
    const response = await request(app)
      .post('/api/apartments')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: 'Test Apartment',
        description: 'A test apartment',
        price: 1000,
        location: 'Test Location',
        bedrooms: 2,
        bathrooms: 1,
        area: 100,
        amenities: ['Parking', 'Gym'],
        isPublic: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Test Apartment');
    testApartment = response.body;
  });

  // Test 2: Autofill from External Site
  test('should autofill apartment details from URL', async () => {
    const response = await request(app)
      .post('/api/apartments/autofill')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        url: 'https://www.rightmove.co.uk/properties/147047995#/?channel=RES_LET',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('title');
    expect(response.body).toHaveProperty('sourceUrl');
    expect(response.body).toHaveProperty('sourceType', 'rightmove');
  });

  // Test 3: Image Upload
  test('should upload images to Cloudinary', async () => {
    const response = await request(app)
      .post('/api/apartments/upload-images')
      .set('Authorization', `Bearer ${testToken}`)
      .attach('images', 'test/fixtures/test-image.jpg')
      .attach('images', 'test/fixtures/test-image-2.jpg');

    expect(response.status).toBe(200);
    expect(response.body.images).toHaveLength(2);
    expect(response.body.images[0]).toHaveProperty('url');
    expect(response.body.images[0]).toHaveProperty('publicId');
  });

  // Test 4: Update Apartment
  test('should update apartment details', async () => {
    const response = await request(app)
      .put(`/api/apartments/${testApartment._id}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: 'Updated Test Apartment',
        price: 1200,
        isPublic: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Updated Test Apartment');
    expect(response.body.price).toBe(1200);
    expect(response.body.isPublic).toBe(false);
  });

  // Test 5: External Source Tracking
  test('should track external source information', async () => {
    const response = await request(app)
      .post('/api/apartments')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: 'External Source Apartment',
        description: 'From external source',
        price: 1500,
        location: 'External Location',
        bedrooms: 3,
        bathrooms: 2,
        area: 150,
        sourceUrl: 'https://www.rightmove.co.uk/properties/123456',
        sourceType: 'rightmove',
        externalId: '123456',
      });

    expect(response.status).toBe(201);
    expect(response.body.sourceUrl).toBe('https://www.rightmove.co.uk/properties/123456');
    expect(response.body.sourceType).toBe('rightmove');
    expect(response.body.externalId).toBe('123456');
    expect(response.body).toHaveProperty('lastUpdated');
  });

  // Test 6: Image Management
  test('should manage apartment images', async () => {
    // First upload images
    const uploadResponse = await request(app)
      .post('/api/apartments/upload-images')
      .set('Authorization', `Bearer ${testToken}`)
      .attach('images', 'test/fixtures/test-image.jpg');

    const images = uploadResponse.body.images;

    // Then update apartment with images
    const response = await request(app)
      .put(`/api/apartments/${testApartment._id}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        images: images.map((img, index) => ({
          ...img,
          isMain: index === 0,
        })),
      });

    expect(response.status).toBe(200);
    expect(response.body.images).toHaveLength(images.length);
    expect(response.body.images[0].isMain).toBe(true);
  });
});
