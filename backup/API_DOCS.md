# API Documentation

## Authentication

### Register User
```http
POST /api/auth/register
```
**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "success": true,
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  }
}
```

### Login User
```http
POST /api/auth/login
```
**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "success": true,
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  }
}
```

## Apartments

### Get All Apartments
```http
GET /api/apartments
```
**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 10)
- `sort`: string (default: "-createdAt")
- `search`: string
- `minPrice`: number
- `maxPrice`: number
- `bedrooms`: number
- `bathrooms`: number

**Response:**
```json
{
  "success": true,
  "count": number,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number
  },
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "price": number,
      "location": {
        "type": "Point",
        "coordinates": [number, number],
        "address": {
          "street": "string",
          "city": "string",
          "state": "string",
          "zipCode": "string",
          "country": "string"
        }
      },
      "bedrooms": number,
      "bathrooms": number,
      "area": number,
      "amenities": ["string"],
      "images": ["string"],
      "owner": {
        "id": "string",
        "name": "string"
      },
      "status": "string"
    }
  ]
}
```

### Get Single Apartment
```http
GET /api/apartments/:id
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "price": number,
    "location": {
      "type": "Point",
      "coordinates": [number, number],
      "address": {
        "street": "string",
        "city": "string",
        "state": "string",
        "zipCode": "string",
        "country": "string"
      }
    },
    "bedrooms": number,
    "bathrooms": number,
    "area": number,
    "amenities": ["string"],
    "images": ["string"],
    "owner": {
      "id": "string",
      "name": "string"
    },
    "status": "string"
  }
}
```

### Create Apartment
```http
POST /api/apartments
```
**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "price": number,
  "location": {
    "address": {
      "street": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string",
      "country": "string"
    }
  },
  "bedrooms": number,
  "bathrooms": number,
  "area": number,
  "amenities": ["string"],
  "images": ["string"]
}
```

### Update Apartment
```http
PUT /api/apartments/:id
```
**Request Body:** Same as Create Apartment

### Delete Apartment
```http
DELETE /api/apartments/:id
```

## Favorites

### Get User Favorites
```http
GET /api/favorites
```
**Response:**
```json
{
  "success": true,
  "count": number,
  "data": [
    {
      "id": "string",
      "apartment": {
        "id": "string",
        "title": "string",
        "price": number,
        "location": {
          "address": {
            "city": "string",
            "state": "string"
          }
        }
      },
      "notes": "string",
      "createdAt": "string"
    }
  ]
}
```

### Add to Favorites
```http
POST /api/favorites
```
**Request Body:**
```json
{
  "apartmentId": "string",
  "notes": "string"
}
```

### Remove from Favorites
```http
DELETE /api/favorites/:id
```

## Commute

### Get Commute Time
```http
POST /api/commute
```
**Request Body:**
```json
{
  "apartmentId": "string",
  "destination": "string",
  "mode": "string"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "duration": "string",
    "distance": "string",
    "mode": "string",
    "route": "string"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "string",
  "details": "string"
}
```

### 401 Unauthorized
```json
{
  "error": "Not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Server Error
```json
{
  "error": "Server error",
  "details": "string"
}
``` 