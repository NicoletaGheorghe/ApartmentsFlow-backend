const cloudinary = require('cloudinary').v2;
const path = require('path');
const dotenv = require('dotenv');

// Try to load .env from multiple possible locations
const possiblePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(process.cwd(), '..', '..', '.env'),
  'C:/Projects/ApartmentSearch/backend/.env',
];

let envLoaded = false;
for (const envPath of possiblePaths) {
  try {
    dotenv.config({ path: envPath });
    if (process.env.CLOUDINARY_URL) {
      envLoaded = true;
      console.log('Loaded .env from:', envPath);
      break;
    }
  } catch (error) {
    console.log('Failed to load .env from:', envPath);
  }
}

// Configure Cloudinary with fallback for development
if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL !== 'cloudinary://api_key:api_secret@cloud_name') {
  // Parse the CLOUDINARY_URL
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  const matches = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@([^/]+)/);

  if (matches) {
    const [, apiKey, apiSecret, cloudName] = matches;
    
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    
    console.log('Cloudinary configured successfully');
  } else {
    console.warn('Invalid CLOUDINARY_URL format, using fallback configuration');
    setupFallbackConfig();
  }
} else {
  console.warn('CLOUDINARY_URL not found or using placeholder, using fallback configuration');
  setupFallbackConfig();
}

function setupFallbackConfig() {
  // Fallback configuration for development
  cloudinary.config({
    cloud_name: 'development',
    api_key: 'placeholder',
    api_secret: 'placeholder',
  });
  
  // Override upload method to handle missing cloudinary in development
  cloudinary.uploader.upload = async function(file, options = {}) {
    console.warn('Cloudinary not properly configured, returning mock upload result');
    return {
      public_id: 'mock_public_id',
      secure_url: 'https://via.placeholder.com/400x300?text=Mock+Image',
      url: 'https://via.placeholder.com/400x300?text=Mock+Image',
      format: 'jpg',
      width: 400,
      height: 300
    };
  };
}

module.exports = cloudinary; 