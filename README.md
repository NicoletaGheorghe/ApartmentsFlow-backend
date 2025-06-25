# Apartment Search Organiser

A Node.js/Express backend for searching and organizing apartment listings, including neighborhood information, commute times, and favorite listings management.

## Features
- RESTful API for apartment listings
- User authentication with JWT
- Favorite listings management
- Neighborhood and commute info endpoints
- Comprehensive test suite with Jest
- Linting and formatting with ESLint and Prettier

---

## Backend Setup

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
This project is licensed under the Apache License 2.0. See [LICENSE](./LICENSE) for details.

---

## Frontend Setup (Next.js)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

**Save the README file after editing.**

**Check git status** in your terminal to see if the conflict is resolved:

```bash
git status
```

---

## Security Note

This repository has been cleaned to remove any previously committed secrets. All sensitive information has been removed from the git history. Please ensure you use your own environment variables and never commit secrets to version control.
