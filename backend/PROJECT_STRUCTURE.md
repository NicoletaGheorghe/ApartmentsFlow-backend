# Apartment Flow Project Structure

## Overview
This document outlines the structure and responsibilities of each sub-project within the Apartment Flow ecosystem. Each project is designed to be independent but can communicate through well-defined APIs.

## 1. Apartment Flow Core (`apartment-flow-core`)
**Primary Responsibility**: Core apartment and user management functionality

### Features
- Apartment CRUD operations
- User profile management
- Basic search and filtering
- Public/private listing management
- Image handling for apartments

### API Endpoints
- `/api/apartments/*`
- `/api/users/*`
- `/api/profiles/*`

### Dependencies
- Express
- Mongoose
- JWT (for basic auth)
- File upload handling

### Data Models
- Apartment
- User
- Profile

## 2. Apartment Flow Location (`apartment-flow-location`)
**Primary Responsibility**: Location-based services and commute calculations

### Features
- Commute time calculations
- Distance calculations
- Location search and geocoding
- Map integration
- Area statistics

### API Endpoints
- `/api/commute/*`
- `/api/location/*`
- `/api/maps/*`

### Dependencies
- Google Maps API
- Geocoding services
- Distance calculation libraries

### Data Models
- Commute
- Location
- Area

## 3. Apartment Flow Auth (`apartment-flow-auth`)
**Primary Responsibility**: Authentication and authorization

### Features
- User authentication
- Role-based access control
- Session management
- Security policies
- Rate limiting

### API Endpoints
- `/api/auth/*`
- `/api/roles/*`
- `/api/sessions/*`

### Dependencies
- JWT
- bcrypt
- OAuth (if needed)
- Rate limiting middleware

### Data Models
- Role
- Permission
- Session

## Communication Between Services
- Services communicate via REST APIs
- Each service maintains its own database
- Cross-service authentication handled via JWT
- Event-driven architecture for real-time updates

## Development Guidelines

### Code Organization
- Each service follows the same basic structure:
  ```
  service/
  ├── src/
  │   ├── controllers/
  │   ├── models/
  │   ├── routes/
  │   ├── services/
  │   ├── middleware/
  │   └── utils/
  ├── tests/
  ├── config/
  └── docs/
  ```

### Testing Strategy
- Unit tests for each service
- Integration tests for cross-service communication
- End-to-end tests for critical flows

### Deployment
- Each service can be deployed independently
- Containerized using Docker
- Separate CI/CD pipelines

## Task Assignment Guidelines

### Core Service Tasks
- [ ] Apartment listing management
- [ ] User profile management
- [ ] Basic search functionality
- [ ] Image handling
- [ ] Public/private listing controls

### Location Service Tasks
- [ ] Google Maps integration
- [ ] Commute calculation
- [ ] Location search
- [ ] Area statistics
- [ ] Distance calculations

### Auth Service Tasks
- [ ] User authentication
- [ ] Role management
- [ ] Session handling
- [ ] Security policies
- [ ] Rate limiting

## Cross-Project Considerations
1. **Data Consistency**
   - Each service maintains its own data
   - Use events for cross-service updates
   - Implement eventual consistency where needed

2. **Error Handling**
   - Consistent error response format
   - Proper error propagation between services
   - Comprehensive logging

3. **Performance**
   - Caching strategies
   - Database optimization
   - API response optimization

4. **Security**
   - Service-to-service authentication
   - Data encryption
   - Input validation

## Migration Strategy
1. **Phase 1: Core Service**
   - Extract apartment and user management
   - Set up basic API structure
   - Implement core features

2. **Phase 2: Location Service**
   - Extract location-based features
   - Implement Google Maps integration
   - Set up commute calculations

3. **Phase 3: Auth Service**
   - Extract authentication logic
   - Implement role management
   - Set up security policies

## Maintenance Guidelines
- Regular dependency updates
- Performance monitoring
- Security audits
- Documentation updates
- Code quality checks 