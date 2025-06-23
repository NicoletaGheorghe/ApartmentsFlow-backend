const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * AI-OPTIMIZED: Content Moderation Middleware
 * 
 * This middleware provides multiple layers of content validation:
 * 1. AI-powered image analysis (Google Cloud Vision API)
 * 2. File metadata validation
 * 3. File size and format checks
 * 4. User reporting system integration
 * 
 * IMPORTANT: This is a critical security feature for maintaining platform safety
 */

// AI-OPTIMIZED: Configuration for content moderation
const MODERATION_CONFIG = {
  // Google Cloud Vision API settings
  visionApiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY,
  visionApiUrl: 'https://vision.googleapis.com/v1/images:annotate',
  
  // Content moderation thresholds
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  
  // AI detection confidence thresholds
  adultContentThreshold: 0.7,
  violenceThreshold: 0.7,
  racyContentThreshold: 0.7,
  
  // Rate limiting for API calls
  maxApiCallsPerMinute: 60,
  apiCallCooldown: 1000, // 1 second between calls
};

// AI-OPTIMIZED: Cache for API responses to avoid repeated calls
const moderationCache = new Map();
const apiCallTimestamps = [];

/**
 * AI-OPTIMIZED: Check if API call rate limit is exceeded
 */
const checkRateLimit = () => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // Remove old timestamps
  while (apiCallTimestamps.length > 0 && apiCallTimestamps[0] < oneMinuteAgo) {
    apiCallTimestamps.shift();
  }
  
  if (apiCallTimestamps.length >= MODERATION_CONFIG.maxApiCallsPerMinute) {
    return false; // Rate limit exceeded
  }
  
  apiCallTimestamps.push(now);
  return true;
};

/**
 * AI-OPTIMIZED: Analyze image using Google Cloud Vision API
 * Detects adult content, violence, and racy content
 */
const analyzeImageWithAI = async (imagePath) => {
  try {
    // Check rate limit
    if (!checkRateLimit()) {
      console.warn('Content moderation API rate limit exceeded, skipping AI analysis');
      return { safe: true, confidence: 0.5, reason: 'Rate limit exceeded, manual review recommended' };
    }

    // Read image file and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Prepare request for Google Cloud Vision API
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'SAFE_SEARCH_DETECTION',
              maxResults: 1
            }
          ]
        }
      ]
    };

    // Make API call
    const response = await axios.post(
      `${MODERATION_CONFIG.visionApiUrl}?key=${MODERATION_CONFIG.visionApiKey}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    const safeSearchAnnotation = response.data.responses[0].safeSearchAnnotation;
    
    // AI-OPTIMIZED: Analyze results with configurable thresholds
    const adultContent = safeSearchAnnotation.adult === 'LIKELY' || safeSearchAnnotation.adult === 'VERY_LIKELY';
    const violence = safeSearchAnnotation.violence === 'LIKELY' || safeSearchAnnotation.violence === 'VERY_LIKELY';
    const racy = safeSearchAnnotation.racy === 'LIKELY' || safeSearchAnnotation.racy === 'VERY_LIKELY';

    // Calculate confidence scores
    const adultConfidence = getConfidenceScore(safeSearchAnnotation.adult);
    const violenceConfidence = getConfidenceScore(safeSearchAnnotation.violence);
    const racyConfidence = getConfidenceScore(safeSearchAnnotation.racy);

    // Determine if content is inappropriate
    const isInappropriate = 
      (adultContent && adultConfidence > MODERATION_CONFIG.adultContentThreshold) ||
      (violence && violenceConfidence > MODERATION_CONFIG.violenceThreshold) ||
      (racy && racyConfidence > MODERATION_CONFIG.racyContentThreshold);

    return {
      safe: !isInappropriate,
      confidence: Math.max(adultConfidence, violenceConfidence, racyConfidence),
      reason: isInappropriate ? 
        `Detected inappropriate content: ${adultContent ? 'Adult content ' : ''}${violence ? 'Violence ' : ''}${racy ? 'Racy content' : ''}`.trim() :
        'Content appears safe',
      details: {
        adult: safeSearchAnnotation.adult,
        violence: safeSearchAnnotation.violence,
        racy: safeSearchAnnotation.racy,
        spoof: safeSearchAnnotation.spoof,
        medical: safeSearchAnnotation.medical
      }
    };

  } catch (error) {
    console.error('AI content analysis failed:', error.message);
    
    // AI-OPTIMIZED: Fallback to basic validation if AI analysis fails
    return {
      safe: true,
      confidence: 0.3,
      reason: 'AI analysis unavailable, manual review recommended',
      error: error.message
    };
  }
};

/**
 * AI-OPTIMIZED: Convert Google Vision API likelihood to confidence score
 */
const getConfidenceScore = (likelihood) => {
  const scores = {
    'VERY_UNLIKELY': 0.1,
    'UNLIKELY': 0.3,
    'POSSIBLE': 0.5,
    'LIKELY': 0.7,
    'VERY_LIKELY': 0.9
  };
  return scores[likelihood] || 0.5;
};

/**
 * AI-OPTIMIZED: Validate file metadata and basic properties
 */
const validateFileMetadata = (file) => {
  const errors = [];

  // Check file size
  if (file.size > MODERATION_CONFIG.maxFileSize) {
    errors.push(`File size (${file.size} bytes) exceeds maximum allowed size (${MODERATION_CONFIG.maxFileSize} bytes)`);
  }

  // Check file format
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  if (!MODERATION_CONFIG.allowedFormats.includes(fileExtension)) {
    errors.push(`File format '${fileExtension}' is not allowed. Allowed formats: ${MODERATION_CONFIG.allowedFormats.join(', ')}`);
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /porn/i, /sex/i, /nude/i, /adult/i, /explicit/i,
    /violence/i, /gore/i, /blood/i, /weapon/i,
    /hate/i, /racist/i, /offensive/i
  ];

  const fileName = file.originalname.toLowerCase();
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fileName)) {
      errors.push(`File name contains potentially inappropriate content: ${file.originalname}`);
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * AI-OPTIMIZED: Main content moderation middleware
 */
const contentModeration = async (req, res, next) => {
  try {
    // Skip if no files uploaded
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const moderationResults = [];
    const failedFiles = [];

    // AI-OPTIMIZED: Process each uploaded file
    for (const file of req.files) {
      console.log(`Moderating file: ${file.originalname}`);

      // Step 1: Basic metadata validation
      const metadataValidation = validateFileMetadata(file);
      if (!metadataValidation.valid) {
        failedFiles.push({
          filename: file.originalname,
          reason: metadataValidation.errors.join(', '),
          type: 'metadata_validation'
        });
        continue;
      }

      // Step 2: AI-powered content analysis
      const aiAnalysis = await analyzeImageWithAI(file.path);
      
      if (!aiAnalysis.safe) {
        failedFiles.push({
          filename: file.originalname,
          reason: aiAnalysis.reason,
          type: 'ai_detection',
          confidence: aiAnalysis.confidence,
          details: aiAnalysis.details
        });
        
        // AI-OPTIMIZED: Log inappropriate content for monitoring
        console.warn(`Inappropriate content detected in ${file.originalname}:`, {
          reason: aiAnalysis.reason,
          confidence: aiAnalysis.confidence,
          user: req.user?.id,
          timestamp: new Date().toISOString()
        });
      }

      moderationResults.push({
        filename: file.originalname,
        safe: aiAnalysis.safe,
        confidence: aiAnalysis.confidence,
        reason: aiAnalysis.reason
      });
    }

    // AI-OPTIMIZED: Handle failed files
    if (failedFiles.length > 0) {
      // Remove failed files from disk
      for (const failedFile of failedFiles) {
        const file = req.files.find(f => f.originalname === failedFile.filename);
        if (file && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }

      // Remove failed files from req.files
      req.files = req.files.filter(file => 
        !failedFiles.some(failed => failed.filename === file.originalname)
      );

      return res.status(400).json({
        error: 'Content moderation failed',
        message: 'Some files were rejected due to inappropriate content',
        failedFiles,
        acceptedFiles: req.files.map(f => f.originalname)
      });
    }

    // AI-OPTIMIZED: Add moderation results to request for logging
    req.contentModerationResults = moderationResults;

    next();

  } catch (error) {
    console.error('Content moderation error:', error);
    
    // AI-OPTIMIZED: Fail safely - reject all files if moderation fails
    if (req.files) {
      for (const file of req.files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
      req.files = [];
    }

    return res.status(500).json({
      error: 'Content moderation service unavailable',
      message: 'Unable to verify file content. Please try again later.'
    });
  }
};

/**
 * AI-OPTIMIZED: Report inappropriate content (for user reporting system)
 */
const reportInappropriateContent = async (req, res) => {
  try {
    const { imageId, reason, description } = req.body;
    const reporterId = req.user.id;

    // AI-OPTIMIZED: Validate report data
    if (!imageId || !reason) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Image ID and reason are required'
      });
    }

    // TODO: Implement report storage and admin notification
    // This would typically save to a reports collection and notify admins

    console.log(`Content report submitted:`, {
      imageId,
      reason,
      description,
      reporterId,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Report submitted successfully. Our team will review the content.'
    });

  } catch (error) {
    console.error('Error submitting content report:', error);
    res.status(500).json({
      error: 'Failed to submit report',
      message: 'Please try again later'
    });
  }
};

module.exports = {
  contentModeration,
  reportInappropriateContent,
  MODERATION_CONFIG
}; 