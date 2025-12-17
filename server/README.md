# TicketBoss Backend

A high-performance event ticketing API built with Node.js, Express, and MongoDB. Handles concurrent seat reservations using atomic database operations to ensure data consistency under high load.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Technical Decisions](#technical-decisions)

## Features

- **Concurrent Seat Reservation**: Atomic MongoDB operations prevent overselling
- **Real-time Availability**: Track available seats across multiple concurrent requests
- **Reservation Management**: Create, cancel, and query reservations
- **Admin Controls**: Reset event data for testing
- **RESTful API**: Standard HTTP methods and status codes

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Concurrency Control**: Atomic `findOneAndUpdate` operations
- **ID Generation**: UUID v4 for reservations
- **Environment**: dotenv for configuration

## Project Structure

```
server/
├── package.json              # Dependencies and scripts
├── README.md                 # Project documentation
└── src/
    ├── index.js              # Application entry point
    ├── concurrencyTest.js    # Load testing script
    ├── config/
    │   └── db.js             # MongoDB connection setup
    ├── controllers/
    │   ├── reservationController.js  # Reservation business logic
    │   └── adminController.js        # Admin operations
    ├── models/
    │   ├── Event.js          # Event schema (stores seat availability)
    │   └── Reservation.js    # Reservation schema
    └── routes/
        ├── reservationRoutes.js  # Public API endpoints
        └── adminRoutes.js        # Admin API endpoints
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository and navigate to the server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the server root directory with the following variables:
   ```env
   # Server Configuration
   PORT=3000
   
   # MongoDB
   MONGO_URI=mongodb://localhost:27017/ticketboss
   
   # Event Configuration
    EVENT_ID="node-meetup-2025"
    TOTAL_SEATS=500
    AVAILABLE_SEATS=500
    VERSION=0
    EVENT_NAME="Node.js Meet-up"
    ADMIN_SECRET=123
   
   # Business Rules
   LIMIT_PER_RESERVATION=10
   MIN_SEATS=1
   
   # Admin Security
   ADMIN_SECRET=your_secret_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The server will start on `http://localhost:5000` (or your configured PORT).

5. **For production**
   ```bash
   npm start
   ```

### Initial Database Seed

The application automatically seeds the event data on startup based on your `.env` configuration. No manual database setup required.

## API Documentation

### Base URL
```
http://localhost:3000/api
```

---

### 1. Reserve Seats

Create a new seat reservation for a partner.

**Endpoint**: `POST /api/reservations`

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "partnerId": "partner_123",
  "seats": 5
}
```

**Parameters**:
- `partnerId` (string, required): Unique identifier for the partner
- `seats` (number, required): Number of seats to reserve (MIN_SEATS to LIMIT_PER_RESERVATION)

**Success Response** (201 Created):
```json
{
  "reservationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "seats": 5,
  "status": "confirmed"
}
```

**Error Responses**:

- **400 Bad Request** (Invalid input):
  ```json
  {
    "error": "Invalid seat request"
  }
  ```

- **409 Conflict** (Not enough seats):
  ```json
  {
    "error": "Not enough seats left"
  }
  ```

- **500 Internal Server Error**:
  ```json
  {
    "error": "Internal server error"
  }
  ```

---

### 2. Cancel Reservation

Cancel an existing reservation and return seats to available pool.

**Endpoint**: `DELETE /api/reservations/:id`

**Parameters**:
- `id` (string, URL parameter): The reservationId to cancel

**Success Response** (204 No Content):
```
(Empty body)
```

**Error Responses**:

- **404 Not Found** (Reservation not found or already cancelled):
  ```json
  {
    "error": "Reservation not found"
  }
  ```

- **500 Internal Server Error**:
  ```json
  {
    "error": "Internal server error"
  }
  ```

**Example**:
```bash
DELETE /api/reservations/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### 3. Get Event Summary

Retrieve current event status including seat availability.

**Endpoint**: `GET /api/reservations`

**Success Response** (200 OK):
```json
{
  "eventId": "evt_001",
  "name": "Concert Night 2025",
  "totalSeats": 100,
  "availableSeats": 45,
  "reservationCount": 12,
  "version": 15
}
```

**Response Fields**:
- `eventId`: Unique event identifier
- `name`: Event name
- `totalSeats`: Total capacity
- `availableSeats`: Currently available seats
- `reservationCount`: Number of active (confirmed) reservations
- `version`: Event version number (increments with each change)

---

### 4. Get All Reservations

Retrieve all reservations with optional status filtering.

**Endpoint**: `GET /api/reservations/all`

**Query Parameters**:
- `status` (string, optional): Filter by status (`confirmed` or `cancelled`)

**Success Response** (200 OK):
```json
{
  "count": 2,
  "reservations": [
    {
      "reservationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "partnerId": "partner_123",
      "seats": 5,
      "status": "confirmed",
      "createdAt": "2025-12-17T10:30:00.000Z"
    },
    {
      "reservationId": "b2c3d4e5-f6g7-8901-bcde-fg2345678901",
      "partnerId": "partner_456",
      "seats": 3,
      "status": "confirmed",
      "createdAt": "2025-12-17T09:15:00.000Z"
    }
  ]
}
```

**Examples**:
```bash
# Get all reservations
GET /api/reservations/all

# Get only confirmed reservations
GET /api/reservations/all?status=confirmed

# Get only cancelled reservations
GET /api/reservations/all?status=cancelled
```

---

### 5. Reset Event Data (Admin)

Reset event to initial state by clearing all reservations and restoring seat availability.

**Endpoint**: `POST /api/admin/reset`

**Request Headers**:
```
x-admin-secret: your_secret_key_here
```

**Success Response** (200 OK):
```json
{
  "message": "Event and reservations reset successfully",
  "totalSeats": 100,
  "availableSeats": 100,
  "version": 0
}
```

**Error Responses**:

- **403 Forbidden** (Invalid or missing admin secret):
  ```json
  {
    "error": "Unauthorized reset attempt"
  }
  ```

- **404 Not Found** (Event not found):
  ```json
  {
    "error": "Event not found"
  }
  ```

---

## Technical Decisions

### Architecture Choices

**1. MVC Pattern**
- **Models**: Data schemas and database interaction (Event, Reservation)
- **Controllers**: Business logic and request handling
- **Routes**: API endpoint definitions and routing

This separation ensures maintainability and follows Node.js best practices.

**2. ES Modules**
- Using modern `import/export` syntax instead of CommonJS
- Cleaner code and better tree-shaking support
- Specified with `"type": "module"` in package.json

**3. Environment-Based Configuration**
- All configuration values in `.env` file
- Easy deployment across environments
- Sensitive data kept out of source control

### Storage Method: MongoDB

**Why MongoDB?**
- **Atomic Operations**: Native support for `findOneAndUpdate` with conditions
- **Flexible Schema**: Easy to add new event properties in the future
- **Scalability**: Horizontal scaling for high-traffic scenarios
- **Document Model**: Natural fit for event and reservation data

**Schema Design**:
- **Event Collection**: Single document per event (seat availability, version)
- **Reservation Collection**: One document per reservation with timestamps

### Concurrency Control

**Atomic Seat-Based Updates**
```javascript
Event.findOneAndUpdate(
  { 
    eventId: EVENT_ID, 
    availableSeats: { $gte: seats } // Condition check
  },
  { 
    $inc: { availableSeats: -seats, version: 1 } // Atomic decrement
  },
  { new: true }
)
```

**Why This Approach?**
- **Thread-Safe**: MongoDB guarantees atomicity of the operation
- **No Race Conditions**: Update succeeds only if seats are available
- **Version Tracking**: Increment version on each change for audit trail
- **Performance**: Single database roundtrip per reservation

**Alternative Considered**: Optimistic locking with version field comparison was considered but seat-based atomic updates are simpler and more direct.

### Key Assumptions

1. **Single Event Model**: System designed for one active event at a time (easily extendable to multi-event)
2. **Partner Trust**: No authentication/authorization implemented (assumes trusted partners)
3. **Reservation Finality**: Confirmed reservations remain in database even when cancelled (status change only)
4. **Seat Pooling**: No specific seat assignments, just quantity tracking
5. **Synchronous Processing**: All operations complete before responding (no queuing)
6. **Admin Access**: Admin endpoints protected by simple secret header (production would use proper auth)

### Error Handling Strategy

- **Validation Errors**: 400 Bad Request
- **Resource Conflicts**: 409 Conflict (not enough seats)
- **Not Found**: 404 for missing reservations
- **Server Errors**: 500 with generic message (details logged server-side)

### Performance Considerations

- **Database Indexing**: Unique indexes on `eventId` and `reservationId`
- **Query Optimization**: Atomic updates minimize lock time
- **Lean Queries**: Only select necessary fields for list operations
- **Version Field**: Tracks modifications without additional queries

### Testing

The project includes `concurrencyTest.js` to simulate high-concurrency scenarios and verify that the atomic operations prevent overselling under load.

---

## Contributing

This is a demonstration project. For production use, I will consider adding:
- Authentication & authorization
- Rate limiting
- Request validation middleware
- Comprehensive error logging
- API documentation with Swagger/OpenAPI
- Unit and integration tests
- Database migrations
- Health check endpoints