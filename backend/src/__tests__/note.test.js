const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { Apartment, Note } = require('../models');
require('./setup');

// Helper function to register and login a user via the API
const registerAndLoginUser = async (email) => {
  // Use a unique email if not provided
  if (!email) {
    email = `testuser+${Date.now()}+${Math.floor(Math.random()*10000)}@example.com`;
  }
  try {
    // Register
    const registerResponse = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email,
      password: 'password123',
    });
    
    if (registerResponse.status !== 201) {
      throw new Error(`Registration failed: ${registerResponse.status} - ${JSON.stringify(registerResponse.body)}`);
    }
    
    // Login
    const loginResponse = await request(app).post('/api/auth/login').send({
      email,
      password: 'password123',
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.status} - ${JSON.stringify(loginResponse.body)}`);
    }
    
    return {
      userId: loginResponse.body.user._id,
      token: loginResponse.body.token,
    };
  } catch (error) {
    throw new Error(`User setup failed: ${error.message}`);
  }
};

// Helper function to create a test apartment
const createTestApartment = async (userId) => {
  const apartment = await Apartment.create({
    title: 'Test Apartment',
    description: 'A test apartment',
    price: 1000,
    location: {
      type: 'Point',
      coordinates: [-0.1276, 51.5074],
      address: {
        street: '123 Test Street',
        city: 'London',
        state: 'England',
        zipCode: 'SW1A 1AA',
        country: 'UK',
      },
    },
    bedrooms: 2,
    bathrooms: 1,
    area: 800,
    owner: userId,
    isPublic: true,
  });
  return apartment;
};

describe('Notes API', () => {
  let testUser, testApartment, authToken;

  beforeEach(async () => {
    // Register and login test user
    try {
      const { userId, token } = await registerAndLoginUser();
      
      if (!userId) {
        throw new Error('User registration failed - userId is undefined');
      }
      
      testUser = { _id: userId };
      authToken = token;
      // Create test apartment for this user
      testApartment = await createTestApartment(userId);
    } catch (error) {
      throw new Error(`Error in beforeEach setup: ${error.message}`);
    }
  });

  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const noteData = {
        apartmentId: testApartment._id,
        title: 'Great location!',
        content: 'This apartment is in a perfect location near campus.',
        category: 'pros',
        priority: 'high',
        tags: ['campus', 'location'],
      };

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(noteData.title);
      expect(response.body.data.content).toBe(noteData.content);
      expect(response.body.data.category).toBe(noteData.category);
      expect(response.body.data.priority).toBe(noteData.priority);
      expect(response.body.data.tags).toEqual(noteData.tags);
      expect(response.body.data.user).toBe(testUser._id.toString());
      expect(response.body.data.apartment._id || response.body.data.apartment).toBe(
        testApartment._id.toString()
      );
    });

    it('should validate required fields', async () => {
      // Create a valid apartment for the test
      const validApartment = await createTestApartment(testUser._id);
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ apartmentId: validApartment._id });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Note title is required');
      expect(response.body.errors).toContain('Note content is required');
    });

    it('should validate field lengths', async () => {
      // Create a valid apartment for the test
      const validApartment = await createTestApartment(testUser._id);
      const noteData = {
        apartmentId: validApartment._id,
        title: 'a'.repeat(101), // Too long
        content: 'b'.repeat(2001), // Too long
      };

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('Note title cannot exceed 100 characters');
      expect(response.body.errors).toContain('Note content cannot exceed 2000 characters');
    });
  });

  describe('GET /api/notes', () => {
    beforeEach(async () => {
      // Create test notes with a fresh apartment for this test
      // Create a fresh apartment for this test
      const apartment = await createTestApartment(testUser._id);
      // Create notes with apartment
      await Note.create([
        {
          user: testUser._id,
          apartment: apartment._id,
          title: 'Note 1',
          content: 'Content 1',
          category: 'pros',
          priority: 'high',
          isPublic: true,
          tags: [],
        },
        {
          user: testUser._id,
          apartment: apartment._id,
          title: 'Note 2',
          content: 'Content 2',
          category: 'cons',
          priority: 'medium',
          isPublic: true,
          tags: [],
        },
      ]);
    });

    it('should get all notes for user', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/notes?category=pros')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('pros');
    });

    it('should filter by priority', async () => {
      const response = await request(app)
        .get('/api/notes?priority=high')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].priority).toBe('high');
    });

    it('should search notes', async () => {
      // Create a note with a unique title for this specific test
      const uniqueNote = await Note.create({
        user: testUser._id,
        apartment: testApartment._id,
        title: 'Unique Search Test Note',
        content: 'This is a unique note for search testing',
        category: 'general',
        priority: 'medium',
        isPublic: false,
        tags: [],
      });

      const response = await request(app)
        .get('/api/notes?search=Unique Search Test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Unique Search Test Note');
    });
  });

  describe('GET /api/notes/:id', () => {
    let testNote;

    beforeEach(async () => {
      // Create a fresh apartment for this test
      const apartment = await createTestApartment(testUser._id);
      testNote = await Note.create({
        user: testUser._id,
        apartment: apartment._id,
        title: 'Test Note',
        content: 'Test content',
        category: 'general',
        priority: 'medium',
        isPublic: false,
        tags: [],
      });
    });

    it('should get a single note', async () => {
      const response = await request(app)
        .get(`/api/notes/${testNote._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Note');
    });

    it('should return 404 for non-existent note', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/notes/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/notes/:id', () => {
    let testNote;

    beforeEach(async () => {
      // Create a fresh apartment for this test
      const apartment = await createTestApartment(testUser._id);
      testNote = await Note.create({
        user: testUser._id,
        apartment: apartment._id,
        title: 'Original Title',
        content: 'Original content',
        category: 'general',
        priority: 'medium',
        isPublic: false,
        tags: [],
      });
    });

    it('should update a note', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        category: 'cons',
        priority: 'low',
        apartmentId: testNote.apartment,
      };

      const response = await request(app)
        .put(`/api/notes/${testNote._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.content).toBe(updateData.content);
      expect(response.body.data.category).toBe(updateData.category);
      expect(response.body.data.priority).toBe(updateData.priority);
    });

    it("should not allow updating another user's note", async () => {
      const otherUser = await registerAndLoginUser('other@example.com');
      const otherApartment = await createTestApartment(otherUser.userId);
      const otherNote = await Note.create({
        user: otherUser.userId,
        apartment: otherApartment._id,
        title: 'Other Note',
        content: 'Other content',
        category: 'general',
        priority: 'medium',
        isPublic: false,
        tags: [],
      });

      const validUpdate = {
        title: 'Hacked',
        content: 'Hacked content',
        category: 'general',
        priority: 'medium',
        apartmentId: otherApartment._id,
      };

      const response = await request(app)
        .put(`/api/notes/${otherNote._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validUpdate);

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    let testNote;

    beforeEach(async () => {
      // Create a fresh apartment for this test
      const apartment = await createTestApartment(testUser._id);
      testNote = await Note.create({
        user: testUser._id,
        apartment: apartment._id,
        title: 'To Delete',
        content: 'Will be deleted',
        category: 'general',
        priority: 'medium',
        isPublic: false,
        tags: [],
      });
    });

    it('should delete a note', async () => {
      const response = await request(app)
        .delete(`/api/notes/${testNote._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Note deleted successfully');

      // Verify note is deleted
      const deletedNote = await Note.findById(testNote._id);
      expect(deletedNote).toBeNull();
    });

    it("should not allow deleting another user's note", async () => {
      const otherUser = await registerAndLoginUser('other@example.com');
      const otherApartment = await createTestApartment(otherUser.userId);
      const otherNote = await Note.create({
        user: otherUser.userId,
        apartment: otherApartment._id,
        title: 'Other Note',
        content: 'Other content',
        category: 'general',
        priority: 'medium',
        isPublic: false,
        tags: [],
      });

      const response = await request(app)
        .delete(`/api/notes/${otherNote._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/notes/apartment/:apartmentId', () => {
    let otherUser, otherNote, testApartmentForNotes;

    beforeEach(async () => {
      // Create a fresh apartment for the test user
      testApartmentForNotes = await createTestApartment(testUser._id);

      otherUser = await registerAndLoginUser('other@example.com');
      const otherApartment = await createTestApartment(otherUser.userId);

      // Create public note by other user
      otherNote = await Note.create({
        user: otherUser.userId,
        apartment: otherApartment._id,
        title: 'Public Note',
        content: 'This is public',
        isPublic: true,
        category: 'general',
        priority: 'medium',
        tags: [],
      });

      // Create private note by test user
      await Note.create({
        user: testUser._id,
        apartment: testApartmentForNotes._id,
        title: 'Private Note',
        content: 'This is private',
        isPublic: false,
        category: 'general',
        priority: 'medium',
        tags: [],
      });
    });

    it("should get notes for apartment (user's own + public)", async () => {
      const response = await request(app)
        .get(`/api/notes/apartment/${testApartmentForNotes._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1); // Only the private note for this apartment
    });
  });

  describe('GET /api/notes/stats', () => {
    beforeEach(async () => {
      // Create a fresh apartment for this test
      const apartment = await createTestApartment(testUser._id);
      await Note.create([
        {
          user: testUser._id,
          apartment: apartment._id,
          title: 'Note 1',
          content: 'Content 1',
          category: 'pros',
          priority: 'high',
          isPublic: false,
          tags: [],
        },
        {
          user: testUser._id,
          apartment: apartment._id,
          title: 'Note 2',
          content: 'Content 2',
          category: 'cons',
          priority: 'medium',
          isPublic: false,
          tags: [],
        },
        {
          user: testUser._id,
          apartment: apartment._id,
          title: 'Note 3',
          content: 'Content 3',
          category: 'pros',
          priority: 'low',
          isPublic: false,
          tags: [],
        },
      ]);
    });

    it('should get note statistics', async () => {
      const response = await request(app)
        .get('/api/notes/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalNotes).toBe(3);
      expect(response.body.data.byCategory.pros).toBe(2);
      expect(response.body.data.byCategory.cons).toBe(1);
      expect(response.body.data.byPriority.high).toBe(1);
      expect(response.body.data.byPriority.medium).toBe(1);
      expect(response.body.data.byPriority.low).toBe(1);
    });
  });
});

// [TROUBLESHOOTING] See BACKEND_TROUBLESHOOTING.md for schema mismatch and test data setup issues.
