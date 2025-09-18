# Real-Time Polling Application API

A robust backend service for a real-time polling application built with Node.js, Express.js, PostgreSQL, Prisma ORM, and WebSocket support using Socket.IO.

## 🏗️ Architecture Overview

This application implements a comprehensive polling system with the following key features:

- **RESTful API** for CRUD operations on users, polls, and votes
- **Real-time WebSocket communication** for live poll updates
- **PostgreSQL database** with well-designed relational schema
- **Prisma ORM** for type-safe database operations
- **JWT authentication** for secure user sessions
- **Comprehensive error handling** and validation

## 🗄️ Database Schema

### Core Models & Relationships

#### User Model
- `id` (String, CUID)
- `name` (String)
- `email` (String, unique)
- `passwordHash` (String)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

#### Poll Model
- `id` (String, CUID)
- `question` (String)
- `isPublished` (Boolean)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- `userId` (String, Foreign Key)

#### PollOption Model
- `id` (String, CUID)
- `text` (String)
- `pollId` (String, Foreign Key)

#### Vote Model (Join Table)
- `id` (String, CUID)
- `userId` (String, Foreign Key)
- `pollOptionId` (String, Foreign Key)
- `createdAt` (DateTime)

### Relationships
- **One-to-Many**: User → Polls, Poll → PollOptions
- **Many-to-Many**: User ↔ PollOptions (via Vote join table)
- **Unique Constraint**: One user can vote only once per poll

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Installation

1. **Clone and setup the project**:
   ```bash
   git clone https://github.com/Sattwik13/Realtime_Polling.git
   cd realtime-polling-api
   npm install
   ```

2. **Database Setup**:
   ```bash
   # Create a PostgreSQL database
   createdb polling_db
   
   # Or use PostgreSQL command line:
   psql -c "CREATE DATABASE polling_db;"
   ```

3. **Environment Configuration**:
   ```bash
   # Copy and configure environment variables
   cp .env.example .env
   
   # Edit .env file with your database connection:
   # DATABASE_URL="postgresql://username:password@localhost:5432/polling_db"
   # JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   # PORT=3000
   ```

4. **Database Migration**:
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # (Optional) Seed with demo data
   npm run db:seed
   ```

5. **Start the Server**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will be running on `http://localhost:3000`

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | User registration |
| POST | `/api/users/login` | User login |
| GET | `/api/users/profile` | Get user profile (auth) |

### Polls
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/polls` | Get all published polls |
| POST | `/api/polls` | Create new poll (auth) |
| GET | `/api/polls/:id` | Get poll by ID (auth) |
| GET | `/api/polls/user/my-polls` | Get user's polls (auth) |
| PUT | `/api/polls/:id` | Update poll (auth) |
| DELETE | `/api/polls/:id` | Delete poll (auth) |

### Votes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/votes` | Submit vote (auth) |
| GET | `/api/votes/results/:pollId` | Get poll results (auth) |
| GET | `/api/votes/user/my-votes` | Get user's votes (auth) |

### Utility
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/` | API information |

## 🔌 WebSocket Events

### Client → Server Events
- `joinPoll(pollId)` - Join poll room for real-time updates
- `leavePoll(pollId)` - Leave poll room

### Server → Client Events
- `connected` - Welcome message with user info
- `pollUpdate` - Real-time poll results update

### WebSocket Authentication
Include JWT token in socket handshake:
```javascript
const socket = io(serverUrl, {
  auth: {
    token: 'your-jwt-token'
  }
});
```

## 📋 Usage Examples

### 1. User Registration
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword"
  }'
```

### 2. User Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword"
  }'
```

### 3. Create Poll
```bash
curl -X POST http://localhost:3000/api/polls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "question": "What is your favorite color?",
    "options": ["Red", "Blue", "Green", "Yellow"],
    "isPublished": true
  }'
```

### 4. Submit Vote
```bash
curl -X POST http://localhost:3000/api/votes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "pollOptionId": "POLL_OPTION_ID"
  }'
```

### 5. Get Poll Results
```bash
curl -X GET http://localhost:3000/api/votes/results/POLL_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔐 Security Features

- **JWT Authentication** with secure token validation
- **Password Hashing** using bcrypt with salt rounds
- **Input Validation** and sanitization
- **CORS Protection** with configurable origins
- **Helmet.js** for security headers
- **Rate Limiting** considerations (ready for implementation)

## 🧪 Testing the Application

### Manual Testing with Demo Data

1. **Seed the database**:
   ```bash
   npm run db:seed
   ```

2. **Login with demo users**:
   - Email: `alice@example.com`, Password: `password123`
   - Email: `bob@example.com`, Password: `password123`
   - Email: `carol@example.com`, Password: `password123`

3. **Test Real-time Features**:
   - Open multiple browser tabs/windows
   - Connect to WebSocket with different users
   - Vote on polls and observe real-time updates

### WebSocket Testing with Browser Console

```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

// Join a poll room
socket.emit('joinPoll', 'POLL_ID');

// Listen for updates
socket.on('pollUpdate', (data) => {
  console.log('Poll updated:', data);
});
```

## 🛠️ Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:reset` - Reset database
- `npm run db:seed` - Seed database with demo data

## 📁 Project Structure

```
realtime-polling-api/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.js             # Demo data seeder
├── src/
│   ├── config/
│   │   └── database.js     # Prisma client configuration
│   ├── controllers/        # Request handlers
│   │   ├── userController.js
│   │   ├── pollController.js
│   │   └── voteController.js
│   ├── middleware/         # Express middleware
│   │   └── auth.js        # JWT authentication
│   ├── routes/            # API routes
│   │   ├── userRoutes.js
│   │   ├── pollRoutes.js
│   │   └── voteRoutes.js
│   └── websocket/         # WebSocket handlers
│       └── socketHandlers.js
├── server.js              # Main server file
├── package.json
├── .env                   # Environment variables
└── README.md
```

## 🌟 Key Features Demonstrated

### 1. **Database Design Excellence**
- Proper relational schema with foreign keys
- Many-to-many relationships via join tables
- Cascade deletions for data integrity
- Unique constraints for business rules

### 2. **Real-time Communication**
- WebSocket rooms for poll-specific updates
- Authenticated WebSocket connections
- Efficient broadcasting to relevant clients
- Real-time vote count updates

### 3. **API Design Best Practices**
- RESTful endpoint structure
- Consistent error handling
- Input validation and sanitization
- Comprehensive response formats

### 4. **Security Implementation**
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes and resources
- CORS and security headers

### 5. **Code Quality**
- Clean, modular architecture
- Separation of concerns
- Comprehensive error handling
- Well-documented codebase

## 🚧 Production Considerations

### Environment Variables
For production deployment, ensure these environment variables are properly set:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong, random JWT signing key
- `NODE_ENV=production`
- `PORT` - Server port (default: 3000)

### Database Migrations
```bash
# For production, use migrations instead of push
npm run db:migrate
```

### Performance Optimizations
- Database indexing on frequently queried fields
- Connection pooling for database connections
- Rate limiting for API endpoints
- Caching strategies for poll results

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🎯 Future Enhancements

- [ ] Rate limiting implementation
- [ ] Redis for session management
- [ ] Poll expiration dates
- [ ] Anonymous voting options
- [ ] Poll categories and tags
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Admin dashboard
- [ ] Poll templates
- [ ] Image/media support for polls

---

## Built with `©Sattwik `