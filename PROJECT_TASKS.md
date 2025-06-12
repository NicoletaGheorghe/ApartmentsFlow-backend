<<<<<<< HEAD
# Project Tasks

## 📅 Week 1 – Foundations & Planning (Completed + Updates)

### Sam (Backend Lead)
- ✅ Set up backend environment & API structure
- ✅ Created initial database schema
  - Expanded "Listing" model with fields: isPublic, externalUrl, coordinates
  - Stubbed Google Geocoding service for later integration

### Wahab (Backend Developer)
- ✅ Initialized Node.js/Express project
- ✅ Scaffolded core endpoints for Users, Listings, Favorites
- ✅ Added data-validation middleware stub (Joi/Zod)

### Ruweda (Frontend Developer)
- ✅ Bootstrapped React/Next.js project
- ✅ Built basic form components & navigation
- ✅ Created stub Profile page & responsive layout (mobile-first)

### Nicoleta (Frontend Lead)
- ✅ Set up GitHub repo & branching strategy
- ✅ Defined Tailwind theme & breakpoints for mobile-first design
- ✅ Wireframed Listing card variants (public vs private, favorite)

### Andrew (Full-Stack Developer)
- Configured VS Code workspace & Prettier/ESLint
- Drafted CI/CD plan (GitHub Actions)
- Implemented bundling & caching setup with webpack

## 📅 Week 2 – Core Features Implementation

### Sam (Backend Lead)
- ✅ Finalize roles & permissions model (admin, agent, user)
- ✅ Implement JWT authentication & authorization middleware
- CRUD for Listings:
  - Enforce isPublic access rules
  - Accept & store externalUrl
  - Hook in Geocoding service on create/update

### Wahab (Backend Developer)
- Build Listing endpoints: POST/GET/PUT/DELETE
- Integrate address-to-coordinates lookup via Google Geocoding API
- Enhance validation middleware for address, URL, public/private flag

### Ruweda (Frontend Developer)
- Listing Creation & Edit form: address autocomplete stub, public/private toggle, external URL field
- Profile Management UI (view & update name, email, password)

### Nicoleta (Frontend Lead)
- Display Listing cards: public badge or private icon, external link icon, favorite "heart" button
- Build Filter panel UI (price range, beds, location radius)

### Andrew (Full-Stack Developer)
- Add error boundaries around async components
- Implement global loading spinners & toast messages
- Wire up API calls to new endpoints with React Query

## 📅 Week 3 – Advanced Features & Optimization

### Sam (Backend Lead)
- ✅ Define Favorites model/schema
- Add Favorite endpoints: POST /favorites, GET /favorites/:userId, DELETE /favorites/:id
- Implement listing-filter API (price, bedrooms, geospatial radius)
- Write unit tests for Listing & Favorite services

### Wahab (Backend Developer)
- Finalize Google Geocoding API integration for address autocomplete & reverse lookup
- Add image-upload endpoint (S3 or Cloudinary)
- Implement commute-time calculation stub

### Ruweda (Frontend Developer)
- Build Favorites page (list saved apartments, remove button)
- Enhance Search Results page: filter panel + infinite scroll/pagination
- Integrate map component on Listing Detail (show pin at coords)

### Nicoleta (Frontend Lead)
- Implement pagination controls for listings
- Refine mobile navigation (hamburger menu, bottom nav)
- Polish map & card UI for different screen sizes

### Andrew (Full-Stack Developer)
- Lazy-load images & maps with react-lazyload
- Memoize heavy list renders (React.memo / useMemo)
- Set up Cypress for end-to-end testing

## 📅 Week 4 – Final Features, Testing & Deployment

### Sam (Backend Lead)
- Publish API docs with Swagger/OpenAPI
- Add indexes on coordinates & filter fields for performance
- ✅ Enforce API rate limiting (express-rate-limit)

### Wahab (Backend Developer)
- Run backend integration tests (Jest + Supertest)
- Optimize commute-time feature using real API (optional)
- Final refactoring & code cleanup

### Ruweda (Frontend Developer)
- Conduct user-experience walkthroughs & gather feedback
- Fix UI bugs & accessibility issues (keyboard nav, ARIA labels)
- Final mobile responsiveness sweep

### Nicoleta (Frontend Lead)
- Perform WCAG 2.1 compliance audit
- Ensure color contrast & focus states meet standards
- Polish brand styling & final responsive tweaks

### Andrew (Full-Stack Developer)
- Apply application-level performance optimizations (CDN caching, HTTP/2)
- Finalize CI/CD pipeline: staging & production deploys
- Launch to production & monitor logs/metrics (Sentry, NewRelic) 
=======
# Backend Tasks and Progress

## Week 1 - Project Setup
✅ **Completed**
- Set up backend environment and API structure
- Create initial database schema
- Configure JWT authentication

## Week 2 - Core Features Implementation
✅ **Completed**
- Set up user roles & permissions
- Implement authentication middleware
- Implement CRUD operations for listings

## Week 3 - Advanced Features & Optimization
✅ **Completed**
- Create favorites model/schema
- Implement favorites API endpoints
- Write unit tests for backend functionality

## Week 4 - Final Features & Deployment
🔄 **In Progress**
- Document API endpoints for frontend integration
- Optimize database queries for scalability
- Implement API rate limiting

## Current Status

### Authentication & User Management
✅ **Completed**
- User registration and login
- JWT token generation and verification
- Role-based authorization
- Password hashing and security

### Apartment Listings
✅ **Completed**
- CRUD operations for listings
- Image handling
- Location data with coordinates
- Search and filtering

### Favorites System
✅ **Completed**
- Add/remove favorites
- User-specific favorites
- Favorites listing
- Notes on favorites

### Testing
✅ **Completed**
- Jest configuration
- Test database setup
- API endpoint tests
- Authentication tests
- Pre-push test hooks

### Documentation
🔄 **In Progress**
- API documentation
- Setup instructions
- Deployment guide
- User guide

### Performance & Security
🔄 **In Progress**
- Database query optimization
- API rate limiting
- Input validation
- Error handling

## Next Steps

1. **Documentation**
   - Complete API documentation
   - Add request/response examples
   - Document error codes
   - Add setup instructions

2. **Performance**
   - Add database indexes
   - Implement caching
   - Optimize queries
   - Add rate limiting

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
>>>>>>> 3134ae6a374ef8643cdff3f6782bb849386a9dcf
