# Apartment Search Organiser

A Node.js/Express backend for searching and organizing apartment listings, including neighborhood information, commute times, and favorite listings management.

## Features
- RESTful API for apartment listings
- User authentication with JWT
- Favorite listings management
- Neighborhood and commute info endpoints
- Comprehensive test suite with Jest
- Linting and formatting with ESLint and Prettier

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- MongoDB (local or cloud)

### Installation
```bash
# Clone the repository
https://github.com/colaone1/Backend-Environment-and-API-Structure.git
cd Backend-Environment-and-API-Structure

# Install dependencies
npm install
# or
yarn install
```

### Environment Setup
Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Running the Server
```bash
npm start
# or
yarn start
```

### Running Tests
```bash
npm test
# or
yarn test
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request.

## License
This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details. 