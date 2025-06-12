const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

describe('User Profile Management', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create a test user
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      profileImage: 'default-avatar.jpg',
    });

    // Generate auth token
    authToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
  });

  afterEach(async () => {
    // Clean up test user
    await User.deleteMany({});
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile when authenticated', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('name', 'Test User');
      expect(response.body).toHaveProperty('profileImage', 'default-avatar.jpg');
    });

    it('should not get user profile without authentication', async () => {
      const response = await request(app).get('/api/users/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile when authenticated', async () => {
      const updateData = {
        name: 'Updated Name',
        profileImage: 'new-avatar.jpg',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated Name');
      expect(response.body).toHaveProperty('profileImage', 'new-avatar.jpg');
    });

    it('should not update user profile without authentication', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ name: 'Should Not Update' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/users/profile', () => {
    it('should delete user profile when authenticated', async () => {
      const response = await request(app)
        .delete('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify user is deleted
      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();
    });

    it('should not delete user profile without authentication', async () => {
      const response = await request(app).delete('/api/users/profile');

      expect(response.status).toBe(401);
    });
  });
});
