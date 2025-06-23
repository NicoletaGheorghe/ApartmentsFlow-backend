const request = require('supertest');
const app = require('../app');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('GET /api/commute/suggestions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should return address suggestions for a valid query', async () => {
    // Mock successful response from Nominatim
    axios.get.mockResolvedValueOnce({
      data: [
        {
          display_name: '1600 Amphitheatre Parkway, Mountain View, CA',
          place_id: '12345',
          lat: '37.4220',
          lon: '-122.0841',
        },
      ],
    });

    const res = await request(app)
      .get('/api/commute/suggestions')
      .query({ query: '1600 Amphitheatre Parkway' })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty('address');
    expect(res.body[0]).toHaveProperty('placeId');
    expect(res.body[0]).toHaveProperty('lat');
    expect(res.body[0]).toHaveProperty('lon');

    // Verify axios was called with correct parameters
    expect(axios.get).toHaveBeenCalledWith(
      'https://nominatim.openstreetmap.org/search',
      expect.objectContaining({
        params: expect.objectContaining({
          q: '1600 Amphitheatre Parkway',
          format: 'json',
        }),
      })
    );
  });

  it('should return 400 if query parameter is missing', async () => {
    const res = await request(app).get('/api/commute/suggestions').expect(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    axios.get.mockRejectedValueOnce(new Error('API Error'));

    const res = await request(app)
      .get('/api/commute/suggestions')
      .query({ query: 'test query' })
      .expect(500);

    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('details');
  });
});
