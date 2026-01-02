# Testing Documentation

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Running Tests](#running-tests)
4. [Test Suite Overview](#test-suite-overview)
5. [Manual Testing Guide](#manual-testing-guide)
6. [API Testing with cURL](#api-testing-with-curl)
7. [Testing with Postman](#testing-with-postman)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before running tests, ensure you have:

- **Node.js 18+** installed
- **Docker and Docker Compose** installed and running
- **MySQL 8.0** (via Docker or local installation)
- **Redis 7** (via Docker or local installation)
- **npm** package manager

### Verify Prerequisites

```bash
# Check Node.js version
node --version  # Should be 18.0.0 or higher

# Check npm version
npm --version

# Check Docker
docker --version
docker-compose --version

# Verify Docker is running
docker ps
```

---

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd "Task Mgmt"

# Install dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy from example (if exists)
cp .env.example .env

# Or create manually
touch .env
```

Add the following configuration to `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=note_taking_db
DB_USER=noteuser
DB_PASSWORD=notepassword
MYSQL_ROOT_PASSWORD=rootpassword

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
# Generate strong secrets using: openssl rand -hex 32
JWT_SECRET=your-secret-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production

# Server Configuration
PORT=3001
NODE_ENV=development
```

**Important**: For production, generate strong random secrets:
```bash
openssl rand -hex 32  # Use this for JWT_SECRET
openssl rand -hex 32  # Use this for JWT_REFRESH_SECRET
```

### 3. Start Docker Services

```bash
# Start MySQL and Redis containers
docker-compose up -d mysql redis

# Verify services are running
docker-compose ps

# Check service health
docker-compose logs mysql | tail -5
docker-compose logs redis | tail -5
```

### 4. Run Database Migrations

```bash
# Run all migrations
npm run migrate

# Verify tables were created
docker-compose exec mysql mysql -u noteuser -pnotepassword note_taking_db -e "SHOW TABLES;"
```

Expected tables:
- `users`
- `notes`
- `note_versions`
- `note_shares`
- `note_attachments`
- `refresh_tokens`

---

## Running Tests

### Automated Test Suite

The project includes a comprehensive automated test suite that covers all phases:

```bash
# Run comprehensive test suite (all phases)
npm test

# Or explicitly
npm run test:comprehensive
```

### Test Suite Phases

The test suite runs in the following order:

#### Phase 1: Infrastructure Tests
- Database connection test
- Redis connection test
- Redis read/write operations test

#### Phase 2: Models & Migrations Tests
- User model creation and password hashing
- Note model creation
- NoteVersion model creation
- Model associations (User ↔ Notes ↔ Versions)
- Soft delete functionality
- NoteShare model and associations

#### Phase 3: Authentication Tests (API)
- User registration
- User login
- Token refresh
- Invalid token handling

#### Phase 4: Core CRUD Tests (API)
- Create note
- Get all notes
- Get single note
- Update note
- Concurrency test (version conflict)
- Create second note

#### Phase 5: Advanced Features Tests (API)
- Get note versions
- Revert note to previous version
- Full-text search
- Cache functionality

#### Phase 6: Bonus Features Tests (API)
- Share note with another user
- Get shared notes
- Update share permission
- Get attachments
- Unshare note

#### Phase 7: Error Handling Tests (API)
- Invalid endpoint (404)
- Validation errors (400)
- Unauthorized access (403/404)
- Not found errors (404)

### Test Output

The test suite provides color-coded output:
- ✅ Green: Test passed
- ❌ Red: Test failed
- ℹ️ Blue: Information
- ⚠️ Yellow: Warning
- 🧪 Cyan: Test phase header

Example output:
```
🧪 === PHASE 1: INFRASTRUCTURE ===
ℹ️  Test 1: Database Connection
✅ Database connection established
ℹ️  Test 2: Redis Connection
✅ Redis connection established
✅ Phase 1: All infrastructure tests passed!
```

### Test Requirements

**Before running API tests (Phases 3-7):**
- The server must be running on `http://localhost:3001`
- Start the server in a separate terminal:
  ```bash
  npm run dev
  # Or
  docker-compose up app
  ```

---

## Test Suite Overview

### Test File Location
- **File**: `scripts/test-comprehensive.js`
- **Type**: Node.js script using axios for HTTP requests

### Test Coverage

| Phase | Tests | Type |
|-------|-------|------|
| Phase 1 | 3 tests | Infrastructure |
| Phase 2 | 7 tests | Models & Migrations |
| Phase 3 | 6 tests | Authentication API |
| Phase 4 | 6 tests | CRUD API |
| Phase 5 | 4 tests | Advanced Features |
| Phase 6 | 6 tests | Bonus Features |
| Phase 7 | 4 tests | Error Handling |
| **Total** | **36+ tests** | **Comprehensive** |

### Test Data Cleanup

The test suite automatically:
- Creates test users and notes
- Cleans up test data after completion
- Handles errors gracefully with cleanup

---

## Manual Testing Guide

### 1. Start the Application

**Option A: Using Docker Compose (Recommended)**
```bash
# Start all services (MySQL, Redis, App)
docker-compose up

# Or in detached mode
docker-compose up -d
```

**Option B: Local Development**
```bash
# Start MySQL and Redis via Docker
docker-compose up -d mysql redis

# Start the application locally
npm run dev
```

### 2. Verify Server is Running

```bash
# Health check
curl http://localhost:3001/health

# Expected response:
# {
#   "success": true,
#   "message": "All services are healthy",
#   "database": "connected",
#   "redis": "connected"
# }
```

### 3. Access API Documentation

Open in browser:
- **Swagger UI**: http://localhost:3001/api-docs
- **OpenAPI JSON**: http://localhost:3001/api-docs.json

### 4. Test Authentication Flow

#### Step 1: Register a User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully. Please login to get access token.",
  "data": {
    "user": {
      "id": 1,
      "email": "test@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Step 2: Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "test@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the `accessToken` for subsequent requests.**

#### Step 3: Refresh Token
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### 5. Test Note Operations

#### Create a Note
```bash
curl -X POST http://localhost:3001/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "My First Note",
    "content": "This is the content of my note"
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Note created successfully",
  "data": {
    "note": {
      "id": 1,
      "userId": 1,
      "title": "My First Note",
      "content": "This is the content of my note",
      "version": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Get All Notes (with Pagination)
```bash
# Get first page with default limit (10 items)
curl http://localhost:3001/api/notes \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get second page with 20 items per page
curl "http://localhost:3001/api/notes?page=2&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK) with Pagination:**
```json
{
  "success": true,
  "message": "Notes retrieved successfully",
  "data": {
    "notes": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "ownedCount": 20,
    "sharedCount": 5
  }
}
```

#### Get Single Note
```bash
curl http://localhost:3001/api/notes/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Update Note (with version)
```bash
curl -X PUT http://localhost:3001/api/notes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Updated Note Title",
    "content": "Updated content",
    "version": 1
  }'
```

**Important**: Always include the current `version` number to prevent conflicts.

#### Search Notes (with Pagination)
```bash
# Search with default pagination
curl "http://localhost:3001/api/notes/search?keywords=note" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Search with custom pagination
curl "http://localhost:3001/api/notes/search?keywords=test&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK) with Pagination:**
```json
{
  "success": true,
  "message": "Notes found",
  "data": {
    "notes": [...],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 12,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "keywords": "test"
  }
}
```

#### Get Note Versions (with Pagination)
```bash
# Get versions with default pagination
curl http://localhost:3001/api/notes/1/versions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get versions with custom pagination
curl "http://localhost:3001/api/notes/1/versions?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK) with Pagination:**
```json
{
  "success": true,
  "message": "Note versions retrieved successfully",
  "data": {
    "noteId": 1,
    "versions": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

#### Revert Note
```bash
curl -X POST http://localhost:3001/api/notes/1/revert/VERSION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Delete Note (Soft Delete)
```bash
curl -X DELETE http://localhost:3001/api/notes/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Test Note Sharing

#### Share Note with Another User
```bash
curl -X POST http://localhost:3001/api/notes/1/share \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "sharedWithUserId": 2,
    "permission": "read"
  }'
```

#### Get Shared Notes (with Pagination)
```bash
# Get shared notes with default pagination
curl http://localhost:3001/api/notes/shared \
  -H "Authorization: Bearer USER_2_ACCESS_TOKEN"

# Get shared notes with custom pagination
curl "http://localhost:3001/api/notes/shared?page=1&limit=15" \
  -H "Authorization: Bearer USER_2_ACCESS_TOKEN"
```

**Expected Response (200 OK) with Pagination:**
```json
{
  "success": true,
  "message": "Shared notes retrieved successfully",
  "data": {
    "notes": [...],
    "pagination": {
      "page": 1,
      "limit": 15,
      "total": 8,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

#### Update Share Permission
```bash
curl -X PUT http://localhost:3001/api/notes/1/share/SHARE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "permission": "edit"
  }'
```

### 7. Test File Attachments

#### Upload Attachment
```bash
curl -X POST http://localhost:3001/api/notes/1/attachments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/your/image.jpg"
```

#### List Attachments (with Pagination)
```bash
# Get attachments with default pagination
curl http://localhost:3001/api/notes/1/attachments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get attachments with custom pagination
curl "http://localhost:3001/api/notes/1/attachments?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (200 OK) with Pagination:**
```json
{
  "success": true,
  "message": "Attachments retrieved successfully",
  "data": {
    "noteId": 1,
    "attachments": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 8,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

#### Delete Attachment
```bash
curl -X DELETE http://localhost:3001/api/notes/1/attachments/ATTACHMENT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Testing with Postman

### Import Collection

1. Open Postman
2. Click **Import**
3. Use the OpenAPI JSON from: `http://localhost:3001/api-docs.json`
4. Postman will automatically create a collection with all endpoints

### Set Up Environment Variables

Create a Postman environment with:
- `base_url`: `http://localhost:3001`
- `access_token`: (will be set after login)
- `refresh_token`: (will be set after login)
- `user_id`: (will be set after registration)
- `note_id`: (will be set after creating note)

### Test Collection Flow

1. **Register** → Save `user_id` from response
2. **Login** → Save `access_token` and `refresh_token`
3. **Create Note** → Save `note_id`
4. **Get All Notes** → Verify note appears
5. **Get Single Note** → Verify note details
6. **Update Note** → Verify version increments
7. **Search Notes** → Verify search works
8. **Share Note** → Test sharing functionality
9. **Get Shared Notes** → Verify shared note appears
10. **Upload Attachment** → Test file upload
11. **Delete Note** → Verify soft delete

---

## Testing Scenarios

### Scenario 1: Concurrency Test

Test optimistic locking by simulating concurrent updates:

**Terminal 1:**
```bash
# Get note (version 1)
curl http://localhost:3001/api/notes/1 \
  -H "Authorization: Bearer TOKEN" | jq '.data.note.version'

# Update with version 1
curl -X PUT http://localhost:3001/api/notes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Update 1","version":1}'
```

**Terminal 2 (simultaneously):**
```bash
# Try to update with same version (should fail)
curl -X PUT http://localhost:3001/api/notes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Update 2","version":1}'
```

**Expected**: Second request should return `409 Conflict` with message about version mismatch.

### Scenario 2: Cache Test

Test Redis caching:

```bash
# First request (cache miss - slower)
time curl -s http://localhost:3001/api/notes \
  -H "Authorization: Bearer TOKEN" > /dev/null

# Second request (cache hit - faster, shows "cached" in message)
time curl -s http://localhost:3001/api/notes \
  -H "Authorization: Bearer TOKEN" | jq '.message'
```

**Expected**: Second request should be faster and message should indicate it's cached.

### Scenario 3: Permission Test

Test note sharing permissions:

1. **User 1** shares note with **User 2** (read permission)
2. **User 2** tries to update note
3. **Expected**: `403 Forbidden` - "This note is view-only"

```bash
# As User 2, try to update shared note
curl -X PUT http://localhost:3001/api/notes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_2_TOKEN" \
  -d '{"title":"Trying to edit","version":1}'
```

### Scenario 4: Pagination Test

Test pagination functionality:

```bash
# Test default pagination (page=1, limit=10)
curl "http://localhost:3001/api/notes?page=1" \
  -H "Authorization: Bearer TOKEN" | jq '.data.pagination'

# Test custom pagination
curl "http://localhost:3001/api/notes?page=2&limit=5" \
  -H "Authorization: Bearer TOKEN" | jq '.data.pagination'

# Test invalid pagination (should return 400)
curl "http://localhost:3001/api/notes?page=0" \
  -H "Authorization: Bearer TOKEN"

curl "http://localhost:3001/api/notes?limit=200" \
  -H "Authorization: Bearer TOKEN"
```

**Expected Results:**
- Default pagination returns page 1 with limit 10
- Custom pagination respects page and limit parameters
- Invalid page (< 1) returns `400 Bad Request`
- Invalid limit (> 100) returns `400 Bad Request`
- Pagination metadata includes `total`, `totalPages`, `hasNextPage`, `hasPreviousPage`

### Scenario 5: Search Test

Test full-text search with various keywords:

```bash
# Short keyword (uses LIKE)
curl "http://localhost:3001/api/notes/search?keywords=up" \
  -H "Authorization: Bearer TOKEN"

# Longer keyword (uses MATCH AGAINST)
curl "http://localhost:3001/api/notes/search?keywords=javascript tutorial" \
  -H "Authorization: Bearer TOKEN"

# Case-insensitive test
curl "http://localhost:3001/api/notes/search?keywords=NOTE" \
  -H "Authorization: Bearer TOKEN"
```

---

## Troubleshooting

### Test Suite Fails at Phase 1

**Problem**: Database or Redis connection fails

**Solutions**:
```bash
# Check if services are running
docker-compose ps

# Check service logs
docker-compose logs mysql
docker-compose logs redis

# Restart services
docker-compose restart mysql redis

# Verify connections
docker-compose exec mysql mysql -u noteuser -pnotepassword -e "SELECT 1;"
docker-compose exec redis redis-cli ping
```

### Test Suite Fails at Phase 3+

**Problem**: Server not running

**Solution**:
```bash
# Start server in separate terminal
npm run dev

# Or with Docker
docker-compose up app
```

### Port Already in Use

**Problem**: Port 3001 is already in use

**Solution**:
```bash
# Find process using port
lsof -ti:3001

# Kill process
lsof -ti:3001 | xargs kill -9

# Or change PORT in .env file
```

### Migration Errors

**Problem**: Tables already exist or migration fails

**Solution**:
```bash
# Drop and recreate database (WARNING: deletes all data)
docker-compose exec mysql mysql -u noteuser -pnotepassword -e \
  "DROP DATABASE IF EXISTS note_taking_db; CREATE DATABASE note_taking_db;"

# Run migrations again
npm run migrate
```

### Cache Not Working

**Problem**: Redis connection issues

**Solution**:
```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHDB
```

### Authentication Errors

**Problem**: Invalid token or token expired

**Solution**:
```bash
# Re-login to get new token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Or refresh token
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

### File Upload Fails

**Problem**: File too large or invalid type

**Solution**:
- Check file size (max 10MB default)
- Verify file type is allowed (images, videos, PDFs)
- Check `uploads/` directory exists and is writable
- Review server logs for specific error

---

## Performance Testing

### Load Testing (Optional)

For basic load testing, you can use tools like:

**Apache Bench (ab):**
```bash
# Install ab (if not available)
# macOS: brew install httpd
# Linux: apt-get install apache2-utils

# Test GET endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/notes
```

**cURL with timing:**
```bash
# Measure response time
time curl -s http://localhost:3001/api/notes \
  -H "Authorization: Bearer YOUR_TOKEN" > /dev/null
```

---

## Test Checklist

Use this checklist to verify all functionality:

### Authentication
- [ ] User registration works
- [ ] User login returns tokens
- [ ] Refresh token works
- [ ] Invalid token is rejected
- [ ] Expired token is rejected

### Notes CRUD
- [ ] Create note works
- [ ] Get all notes returns owned + shared (with pagination)
- [ ] Get single note works
- [ ] Update note increments version
- [ ] Delete note (soft delete) works
- [ ] Deleted notes don't appear in list
- [ ] Pagination works correctly (page, limit, total, totalPages)
- [ ] Pagination edge cases handled (invalid page/limit)

### Versioning
- [ ] Version history is created on create/update
- [ ] Get versions returns all versions (with pagination)
- [ ] Revert to version works
- [ ] Revert creates new version
- [ ] Pagination works for version history

### Concurrency
- [ ] Concurrent update returns 409 Conflict
- [ ] Version mismatch is detected
- [ ] Atomic update prevents race conditions

### Search
- [ ] Search finds notes by title
- [ ] Search finds notes by content
- [ ] Search is case-insensitive
- [ ] Short keywords work (LIKE fallback)
- [ ] Long keywords work (FULLTEXT)

### Caching
- [ ] First request is slower (cache miss)
- [ ] Second request is faster (cache hit)
- [ ] Cache invalidates on create
- [ ] Cache invalidates on update
- [ ] Cache invalidates on delete

### Sharing
- [ ] Share note with read permission
- [ ] Share note with edit permission
- [ ] Get shared notes (with pagination)
- [ ] Update share permission
- [ ] Unshare note
- [ ] Verify pagination in shared notes list
- [ ] Share note with user works
- [ ] Shared note appears in recipient's list
- [ ] Read-only permission prevents editing
- [ ] Edit permission allows editing
- [ ] Update permission works
- [ ] Unshare works

### Attachments
- [ ] Upload image attachment
- [ ] Upload video attachment
- [ ] Upload PDF attachment
- [ ] List attachments (with pagination)
- [ ] Delete attachment
- [ ] Verify pagination in attachments list
- [ ] Upload file works
- [ ] List attachments works
- [ ] Delete attachment works
- [ ] File validation works

### Error Handling
- [ ] 400 for validation errors
- [ ] 401 for unauthorized
- [ ] 403 for forbidden
- [ ] 404 for not found
- [ ] 409 for conflicts
- [ ] 500 for server errors

---

## Conclusion

This testing documentation provides comprehensive guidance for testing the Note Taking API. The automated test suite covers all major functionality, while manual testing allows for deeper exploration and edge case testing.

For questions or issues, refer to:
- **API Documentation**: http://localhost:3001/api-docs
- **README.md**: Setup and configuration guide
- **Technical Analysis**: Architecture and design decisions

