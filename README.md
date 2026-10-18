
# UserBase — User Management API

A full-stack user management application built as part of a Full-Stack Developer Practical Assessment. It provides REST APIs for creating, retrieving, replacing, partially updating, and listing users, along with a React frontend.

## Tech Stack

- Frontend: React, Vite, CSS
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Validation: Zod (if used in the implementation)
- Password hashing: bcryptjs
- Testing: Vitest, Supertest, mongodb-memory-server

## Features

- Create users with name, email, and password
- Retrieve a user by ID
- Replace editable user fields using PUT
- Partially update user fields using PATCH
- List users with pagination
- Validate request bodies and query parameters
- Enforce unique email addresses through a MongoDB unique index
- Hash passwords before storage
- Never expose password hashes in API responses
- Centralized error handling
- Responsive React interface

## Project Structure

```text
user-management-api/
├── Frontend/
│   ├── src/
│   ├── package.json
│   └── .env.example
├── Backend/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── .env.example
└── README.md
```

## Prerequisites

- Node.js and npm
- MongoDB Atlas account or a local MongoDB instance

## Environment Variables

Create `Backend/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Use the actual variable names expected by your application. Never commit `.env` files containing real credentials.

## Installation and Setup

### Backend

```bash
cd Backend
npm install
npm run dev
```

### Frontend

Open another terminal:

```bash
cd Frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

### Run Tests

From the backend directory:

```bash
npm test
```

The automated tests use an in-memory MongoDB database so they can run without modifying application data.

## API Endpoints

Base URL: `http://localhost:5000`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/users` | Create a user |
| GET | `/users/:id` | Retrieve a user |
| PUT | `/users/:id` | Replace editable user fields |
| PATCH | `/users/:id` | Update supplied fields only |
| GET | `/users?page=1&limit=10` | List users with pagination |

### Create a User

```http
POST /users
Content-Type: application/json
```

```json
{
  "name": "Alex Morgan",
  "email": "alex@example.com",
  "password": "StrongPass123"
}
```

Expected status: `201 Created`.

### Retrieve a User

```http
GET /users/USER_ID
```

Returns `200 OK` when found and `404 Not Found` when the user doesn't exist.

### Replace a User

```http
PUT /users/USER_ID
Content-Type: application/json
```

```json
{
  "name": "Alex Morgan",
  "email": "alex.updated@example.com",
  "password": "NewStrongPass123"
}
```

All editable fields are required for PUT. Omitted editable fields are not retained as part of the replacement operation.

### Partially Update a User

```http
PATCH /users/USER_ID
Content-Type: application/json
```

```json
{
  "name": "Alex Updated"
}
```

Only supplied fields change; all other fields remain unchanged.

### List Users

```http
GET /users?page=1&limit=10
```

The response includes the current page, page size, total number of users, and total pages. Passwords and password hashes are excluded.

## POST, PUT, PATCH, and Idempotency

### POST

POST creates a new user. Repeating the same request can create another resource or return a duplicate-email error. It is not inherently idempotent.

### PUT

PUT replaces the editable fields of an existing user. Repeating the same request with the same values results in the same resource state, so it is idempotent in terms of the intended state change.

### PATCH

PATCH updates only the fields included in the request. A PATCH that sets a field to a fixed value is generally idempotent when repeated with the same payload. Other PATCH operations, such as incrementing a value, may not be idempotent.

### Preventing Duplicate Payments or Jobs

For operations such as payments, clients should send a unique idempotency key with each logical operation.

The server stores the key, request fingerprint, processing status, and final result. A database uniqueness constraint prevents two requests from claiming the same key concurrently. If the same key and same request arrive again, the server returns the existing result instead of performing the operation again. Reusing the key with a different request should be rejected.

For background jobs, use a durable job record with a unique business-operation identifier, atomic claiming, retry tracking, and idempotent processing. Where external systems are involved, use provider idempotency keys and reconciliation for uncertain outcomes. Retries should use bounded backoff, and a timeout alone must not be treated as proof that an operation failed.

## Database Choice

MongoDB was selected because the user resource is a small document with a straightforward schema, and Mongoose provides schema validation, indexes, and convenient model operations.

The email field uses a unique database index to prevent duplicate registrations, including concurrent requests.

## Error Handling and Security

- Validate input before database operations.
- Hash passwords using bcryptjs.
- Never return plaintext passwords or password hashes.
- Enforce unique email addresses at the database level.
- Use appropriate HTTP status codes and a consistent JSON response structure.
- Keep secrets in environment variables.
- Avoid exposing stack traces or sensitive information in production error responses.

## Trade-offs and Future Improvements

- Add authentication, authorization, and rate limiting if the API is exposed to users.
- Add structured logging, monitoring, and request correlation IDs.
- Improve integration testing for all HTTP methods and failure scenarios.
- Add database migrations or explicit index-management scripts where needed.
- Add Docker and a repeatable deployment pipeline.
- Use an idempotency-key store and durable job queue for operations with external side effects.
- Add stronger operational controls for backups, secret rotation, and database access.

## Author

Developed as a full-stack practical assessment project.
