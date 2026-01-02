# Note Taking API

A comprehensive RESTful API for note-taking with advanced features including versioning, concurrency handling, full-text search, caching, note sharing, and multimedia attachments.

## Features

- ✅ **User Authentication** - JWT-based authentication with refresh tokens
- ✅ **Note Management** - Full CRUD operations for notes
- ✅ **Version Control** - Track and revert to previous note versions
- ✅ **Concurrency Handling** - Optimistic locking to prevent conflicts
- ✅ **Full-Text Search** - MySQL full-text search for notes
- ✅ **Redis Caching** - Performance optimization with cache invalidation
- ✅ **Note Sharing** - Share notes with other users (read/edit permissions)
- ✅ **Multimedia Attachments** - Upload images, videos, and PDFs
- ✅ **Comprehensive Documentation** - Swagger/OpenAPI documentation

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **ORM**: Sequelize
- **Cache**: Redis 7
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Validation**: express-validator
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Task Mgmt"
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (defaults work for Docker setup).

### 3. Start Services with Docker Compose

```bash
# Start all services (MySQL, Redis, Node.js app)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### 4. Run Database Migrations

```bash
# Inside the app container
docker-compose exec app npm run migrate

# Or if running locally
npm run migrate
```

### 5. Access the API

- **API Base URL**: `http://localhost:3001`
- **API Documentation**: `http://localhost:3001/api-docs`
- **Health Check**: `http://localhost:3001/health`

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start MySQL and Redis

Using Docker Compose (recommended):

```bash
# Start only MySQL and Redis
docker-compose up -d mysql redis
```

Or install and run MySQL and Redis locally.

### 3. Configure Environment

Create `.env` file with your local configuration (copy from `.env.example`):

```bash
cp .env.example .env
```

Then edit `.env` and update the values, especially:
- `JWT_SECRET` - Generate a strong random secret (use `openssl rand -hex 32`)
- `JWT_REFRESH_SECRET` - Generate a strong random secret
- `DB_PASSWORD` - Use a strong password for production
- `MYSQL_ROOT_PASSWORD` - Use a strong password for production

Example `.env` file:
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

# JWT Configuration (IMPORTANT: Generate strong secrets for production)
JWT_SECRET=your-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 4. Run Migrations

```bash
npm run migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## Docker Commands

### Start Services

```bash
# Start all services in detached mode
docker-compose up -d

# Start with logs visible
docker-compose up

# Start specific services
docker-compose up mysql redis
```

### Stop Services

```bash
# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop, remove containers and volumes
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f mysql
docker-compose logs -f redis
```

### Execute Commands in Container

```bash
# Run migrations
docker-compose exec app npm run migrate

# Access MySQL
docker-compose exec mysql mysql -u noteuser -pnotepassword note_taking_db

# Access Redis CLI
docker-compose exec redis redis-cli

# Access app shell
docker-compose exec app sh
```

### Rebuild Containers

```bash
# Rebuild and restart
docker-compose up -d --build

# Rebuild without cache
docker-compose build --no-cache
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token

### Notes

- `GET /api/notes` - Get all user notes (paginated)
- `POST /api/notes` - Create a new note
- `GET /api/notes/:id` - Get a single note
- `PUT /api/notes/:id` - Update a note (with optimistic locking)
- `DELETE /api/notes/:id` - Soft delete a note
- `GET /api/notes/search?keywords=...` - Full-text search (paginated)
- `GET /api/notes/:id/versions` - Get note versions (paginated)
- `POST /api/notes/:id/revert/:versionId` - Revert to a version

### Note Sharing

- `GET /api/notes/shared` - Get notes shared with you (paginated)
- `POST /api/notes/:id/share` - Share a note
- `PUT /api/notes/:id/share/:shareId` - Update share permission
- `DELETE /api/notes/:id/share/:shareId` - Unshare a note

### Attachments

- `POST /api/notes/:id/attachments` - Upload attachment
- `GET /api/notes/:id/attachments` - List attachments (paginated)
- `DELETE /api/notes/:id/attachments/:attachmentId` - Delete attachment

## Pagination

All list endpoints support pagination to efficiently handle large datasets. Pagination is implemented using query parameters.

### Pagination Parameters

- `page` (optional, default: 1) - Page number (must be >= 1)
- `limit` (optional, default: 10) - Number of items per page (must be between 1 and 100)

### Pagination Response Format

Paginated endpoints return a response with the following structure:

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
    }
  }
}
```

### Pagination Metadata

- `page` - Current page number
- `limit` - Number of items per page
- `total` - Total number of items across all pages
- `totalPages` - Total number of pages
- `hasNextPage` - Boolean indicating if there's a next page
- `hasPreviousPage` - Boolean indicating if there's a previous page

### Paginated Endpoints

The following endpoints support pagination:

1. **GET /api/notes** - Get all user notes (includes owned and shared notes)
2. **GET /api/notes/search** - Search notes
3. **GET /api/notes/:id/versions** - Get note versions
4. **GET /api/notes/shared** - Get shared notes
5. **GET /api/notes/:id/attachments** - Get note attachments

### Pagination Examples

```bash
# Get first page with default limit (10 items)
GET /api/notes?page=1

# Get second page with 20 items per page
GET /api/notes?page=2&limit=20

# Search with pagination
GET /api/notes/search?keywords=test&page=1&limit=5

# Get note versions with pagination
GET /api/notes/1/versions?page=1&limit=10

# Get shared notes with pagination
GET /api/notes/shared?page=1&limit=15

# Get attachments with pagination
GET /api/notes/1/attachments?page=1&limit=10
```

### Error Handling

Invalid pagination parameters will return a `400 Bad Request` error:

```json
{
  "success": false,
  "message": "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100."
}
```

## Testing

### Run Test Scripts

```bash

# Run comprehensive test suite
npm run test:comprehensive
# Or
node scripts/test-comprehensive.js
```

## Project Structure

```
.
├── config/           # Configuration files
│   ├── database.js   # Sequelize database config
│   ├── redis.js      # Redis client (Singleton)
│   └── swagger.js    # Swagger/OpenAPI config
├── controllers/      # Request handlers
│   ├── authController.js
│   ├── notesController.js
│   ├── noteShareController.js
│   └── noteAttachmentController.js
├── middleware/       # Express middleware
│   ├── auth.js       # JWT authentication
│   ├── errorHandler.js # Error handling
│   └── upload.js     # File upload (Multer)
├── migrations/       # Database migrations
├── models/          # Sequelize models
├── routes/          # API routes
├── scripts/         # Utility scripts
├── utils/           # Utility functions
│   ├── cache.js     # Redis cache helpers
│   ├── errors.js    # Custom error classes
│   └── jwt.js       # JWT utilities
├── uploads/         # File uploads directory
├── docker-compose.yml
├── Dockerfile
├── server.js        # Application entry point
└── package.json
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | localhost |
| `DB_PORT` | MySQL port | 3306 |
| `DB_NAME` | Database name | note_taking_db |
| `DB_USER` | Database user | noteuser |
| `DB_PASSWORD` | Database password | notepassword |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `JWT_SECRET` | JWT secret key | (required) |
| `JWT_REFRESH_SECRET` | JWT refresh secret | (required) |
| `JWT_EXPIRES_IN` | Access token expiry | 24h |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | 7d |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `UPLOAD_DIR` | Upload directory | ./uploads |
| `MAX_FILE_SIZE` | Max file size (bytes) | 10485760 (10MB) |

## Design Patterns

- **Singleton Pattern**: Redis client connection
- **Repository Pattern**: Model-based data access
- **Middleware Pattern**: Request/response processing
- **Error Handling Pattern**: Centralized error handler

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Refresh token rotation
- Input validation and sanitization
- File upload validation
- SQL injection prevention (Sequelize ORM)
- CORS enabled

## Performance Optimizations

- Redis caching for frequently accessed data
- Database indexes for optimized queries
- Full-text search index
- Connection pooling
- Cache invalidation strategies

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:3001/api-docs`
- **OpenAPI JSON**: `http://localhost:3001/api-docs.json`

## Troubleshooting

### MySQL Connection Error

```bash
# Check if MySQL is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

### Redis Connection Error

```bash
# Check if Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

### Migration Errors

```bash
# Drop and recreate database (WARNING: deletes all data)
docker-compose exec mysql mysql -u noteuser -pnotepassword -e "DROP DATABASE IF EXISTS note_taking_db; CREATE DATABASE note_taking_db;"

# Run migrations again
npm run migrate
```

### Port Already in Use

```bash
# Change PORT in .env file or stop the service using the port
# For port 3001:
lsof -ti:3001 | xargs kill -9
```

## License

ISC

## Author

Note Taking API - Backend Developer Assessment
