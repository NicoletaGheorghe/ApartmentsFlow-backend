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

if (!envLoaded) {
  console.error(
    'Could not find .env file with CLOUDINARY_URL in any of these locations:',
    possiblePaths
  );
  process.exit(1);
}

// Parse the CLOUDINARY_URL
const cloudinaryUrl = process.env.CLOUDINARY_URL;
const matches = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@([^/]+)/);

if (!matches) {
  console.error('Invalid CLOUDINARY_URL format');
  process.exit(1);
}

const [, apiKey, apiSecret, cloudName] = matches;

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

module.exports = cloudinary;
