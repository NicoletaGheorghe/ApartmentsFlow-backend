const request = require('supertest');
const app = require('../app');
const User = require('../models/user.model');
const Apartment = require('../models/apartment.model');

let testUser;

beforeAll(async () => {
  // Create a test user
  testUser = await User.create({
    email: 'testuser@example.com',
    password: 'password123',
    name: 'Test User',
  });
}, 20000);

beforeEach(async () => {
  // Clear apartments before each test
  await Apartment.deleteMany();
});

afterAll(async () => {
  // Clean up test data
  await User.deleteMany();
  await Apartment.deleteMany();
});

describe('App', () => {
  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown-route').expect(404);

    expect(response.body).toEqual({
      error: "Sorry, can't find that",
    });
  });

  it('should return 200 and a list of apartments for /api/apartments', async () => {
    // Create a test apartment
    await Apartment.create({
      title: 'Test Apartment',
      description: 'A nice place',
      price: 1000,
      location: {
        type: 'Point',
        coordinates: [0, 0],
        address: {
          street: '123 Main St',
          city: 'Testville',
          state: 'TS',
          zipCode: '12345',
          country: 'Testland',
        },
      },
      bedrooms: 2,
      bathrooms: 1,
      area: 50,
      amenities: ['WiFi'],
      images: [],
      owner: testUser._id,
      status: 'available',
    });

    const response = await request(app).get('/api/apartments').expect(200);
    expect(response.body).toHaveProperty('apartments');
    expect(Array.isArray(response.body.apartments)).toBe(true);
    expect(response.body.apartments.length).toBeGreaterThan(0);
  }, 10000);
});
