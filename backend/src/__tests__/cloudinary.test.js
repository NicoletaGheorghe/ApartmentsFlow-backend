const cloudinary = require('../config/cloudinary');

describe('Cloudinary Configuration', () => {
  beforeAll(() => {
    // Verify environment variables are loaded
    if (!process.env.CLOUDINARY_URL) {
      throw new Error('CLOUDINARY_URL environment variable is not set');
    }
  });

  test('should be properly configured', () => {
    // Check if cloudinary is configured
    expect(cloudinary.config().cloud_name).toBeDefined();
    expect(cloudinary.config().api_key).toBeDefined();
    expect(cloudinary.config().api_secret).toBeDefined();
  });

  test('should be able to upload a test image', async () => {
    // Create a simple test image (1x1 pixel transparent PNG)
    const testImage =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

    try {
      const result = await cloudinary.uploader.upload(testImage, {
        folder: 'test',
        resource_type: 'image',
      });

      expect(result).toHaveProperty('secure_url');
      expect(result).toHaveProperty('public_id');

      // Clean up - delete the test image
      await cloudinary.uploader.destroy(result.public_id);
    } catch (error) {
      console.error('Cloudinary test failed:', error);
      throw error;
    }
  });
});
