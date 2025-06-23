const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/user.model');

// Mock Cloudinary with different scenarios
const mockCloudinary = {
  uploader: {
    upload: jest.fn(),
  },
};

// Mock multer to prevent file system operations
jest.mock('multer', () => {
  const mockMulter = jest.fn(() => {
    return {
      array: jest.fn(() => {
        return (req, res, next) => {
          const fileCount = parseInt(req.headers['x-file-count'] || '1', 10);
          req.files = [];
          if (fileCount > 0) {
            for (let i = 0; i < fileCount; i++) {
              req.files.push({
                fieldname: 'images',
                originalname: `test${i + 1}.jpg`,
                encoding: '7bit',
                mimetype: 'image/jpeg',
                buffer: Buffer.from(`fake image data ${i + 1}`),
                size: 1024 + i * 100,
              });
            }
          }
          next();
        };
      }),
    };
  });

  // Add static methods
  mockMulter.diskStorage = jest.fn(() => ({}));
  mockMulter.memoryStorage = jest.fn(() => ({}));

  return mockMulter;
});

jest.mock('../config/cloudinary', () => mockCloudinary);

let mongoServer;
let adminUser, agentUser, regularUser;
let adminToken, agentToken, regularToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

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

  // Get auth tokens
  const adminLoginResponse = await request(app).post('/api/auth/login').send({
    email: 'admin@test.com',
    password: 'password123',
  });
  adminToken = adminLoginResponse.body.token;

  const agentLoginResponse = await request(app).post('/api/auth/login').send({
    email: 'agent@test.com',
    password: 'password123',
  });
  agentToken = agentLoginResponse.body.token;

  const regularLoginResponse = await request(app).post('/api/auth/login').send({
    email: 'user@test.com',
    password: 'password123',
  });
  regularToken = regularLoginResponse.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(() => {
  // Reset mock before each test
  mockCloudinary.uploader.upload.mockReset();
});

describe('Cloudinary Image Upload', () => {
  test('should successfully upload single image', async () => {
    // Mock successful upload
    mockCloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image/upload/success.jpg',
      public_id: 'test/success',
      bytes: 1024,
      format: 'jpg',
      width: 800,
      height: 600,
    });

    const response = await request(app)
      .post('/api/apartments/upload-images')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-file-count', '1');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.images).toHaveLength(1);
    expect(response.body.images[0].url).toBe(
      'https://res.cloudinary.com/test/image/upload/success.jpg'
    );
    expect(response.body.images[0].publicId).toBe('test/success');
  });

  test('should successfully upload multiple images', async () => {
    // Mock successful uploads
    mockCloudinary.uploader.upload
      .mockResolvedValueOnce({
        secure_url: 'https://res.cloudinary.com/test/image/upload/image1.jpg',
        public_id: 'test/image1',
        bytes: 1024,
        format: 'jpg',
        width: 800,
        height: 600,
      })
      .mockResolvedValueOnce({
        secure_url: 'https://res.cloudinary.com/test/image/upload/image2.jpg',
        public_id: 'test/image2',
        bytes: 2048,
        format: 'jpg',
        width: 1200,
        height: 800,
      });

    const response = await request(app)
      .post('/api/apartments/upload-images')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-file-count', '2');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.images).toHaveLength(2);
    expect(response.body.uploadedCount).toBe(2);
    expect(response.body.failedCount).toBe(0);
  });

  test('should handle partial upload failures', async () => {
    // Mock one success, one failure
    mockCloudinary.uploader.upload
      .mockResolvedValueOnce({
        secure_url: 'https://res.cloudinary.com/test/image/upload/success.jpg',
        public_id: 'test/success',
        bytes: 1024,
        format: 'jpg',
        width: 800,
        height: 600,
      })
      .mockRejectedValueOnce(new Error('Upload failed'));

    const response = await request(app)
      .post('/api/apartments/upload-images')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-file-count', '2');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.images).toHaveLength(2);
    expect(response.body.uploadedCount).toBe(1);
    expect(response.body.failedCount).toBe(1);
    expect(response.body.images[1]).toHaveProperty('error');
  });

  test('should handle complete upload failure', async () => {
    // Mock complete failure
    mockCloudinary.uploader.upload.mockRejectedValue(new Error('Cloudinary service unavailable'));

    const response = await request(app)
      .post('/api/apartments/upload-images')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-file-count', '1');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to upload any images');
    expect(response.body.details).toEqual(
      expect.arrayContaining([expect.stringContaining('Cloudinary service unavailable')])
    );
  });

  test('should allow agents to upload images', async () => {
    // Mock successful upload
    mockCloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image/upload/agent-upload.jpg',
      public_id: 'test/agent-upload',
      bytes: 1024,
      format: 'jpg',
      width: 800,
      height: 600,
    });

    const response = await request(app)
      .post('/api/apartments/upload-images')
      .set('Authorization', `Bearer ${agentToken}`)
      .set('x-file-count', '1');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.images).toHaveLength(1);
  });

  test('should reject uploads from regular users', async () => {
    const response = await request(app)
      .post('/api/apartments/upload-images')
      .set('Authorization', `Bearer ${regularToken}`)
      .set('x-file-count', '1');
    expect(response.status).toBe(403);
  });

  test('should handle empty file upload', async () => {
    const response = await request(app)
      .post('/api/apartments/upload-images')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-file-count', '0');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('No images uploaded');
  });
});
