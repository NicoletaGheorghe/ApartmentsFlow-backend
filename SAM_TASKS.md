# Sam's Tasks (Backend Lead)

## Week 1 - Project Setup
✅ **Completed**
- Set up backend environment and API structure
- Create initial database schema
- Configure JWT authentication
- Expand "Listing" model with fields: isPublic, externalUrl, coordinates
- Stub Google Geocoding service for later integration

## Week 2 - Core Features Implementation
✅ **Completed**
- Finalize roles & permissions model (admin, agent, user)
- Implement JWT authentication & authorization middleware
- CRUD for Listings:
  - ✅ Enforce isPublic access rules
  - ✅ Accept & store externalUrl
  - Hook in Geocoding service on create/update

## Week 3 - Advanced Features & Optimization
✅ **Completed**
- Define Favorites model/schema
- Add Favorite endpoints: POST /favorites, GET /favorites/:userId, DELETE /favorites/:id
- Implement listing-filter API (price, bedrooms, geospatial radius)
- Write unit tests for Listing & Favorite services

## Week 4 - Final Features & Deployment
🔄 **In Progress**
- Publish API docs with Swagger/OpenAPI
- Add indexes on coordinates & filter fields for performance
- ✅ Enforce API rate limiting (express-rate-limit)

## Current Focus Areas

### Authentication & Authorization
✅ **Completed**
- JWT token generation and verification
- Role-based access control
- Password hashing and security
- Protected routes implementation

### Apartment Listings
✅ **Completed**
- CRUD operations
- Public/private access control
- External URL support
- Location data handling

### Testing
✅ **Completed**
- Jest configuration
- Test database setup
- API endpoint tests
- Authentication tests
- Access control tests

### Documentation
🔄 **In Progress**
- API documentation
- Setup instructions
- Deployment guide

### Performance & Security
🔄 **In Progress**
- Database query optimization
- API rate limiting
- Input validation
- Error handling

## Next Immediate Tasks

1. **Documentation**
   - Complete API documentation with Swagger/OpenAPI
   - Add request/response examples
   - Document error codes
   - Add setup instructions

2. **Performance**
   - Add database indexes for coordinates & filter fields
   - Implement caching for apartment listings
   - Optimize MongoDB queries
   - Add rate limiting middleware

3. **Security**
   - Add input validation
   - Implement rate limiting
   - Add security headers
   - Enhance error handling

4. **Testing**
   - Add more test cases
   - Increase test coverage
   - Add integration tests
   - Add performance tests

## Backend Integration Tasks (Frontend Needs)

- [ ] Add another endpoint to fetch address autocomplete suggestions (move to commute controller)
- [ ] Add endpoint to allow copy-paste of a listing link to autofill all relevant info about the listing, including 3-4 images
- [ ] Add endpoint to upload images directly from user's computer
- [ ] Integrate Cloudinary for image uploads and store image URLs
- [ ] Remove longitude/latitude value from listing model and related endpoints (no longer needed)

> Note: Google Maps Places Autocomplete is not available to new customers after March 1st, 2025. Consider alternative APIs or update implementation accordingly. 