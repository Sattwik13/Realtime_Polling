import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Import routes
import userRoutes from './src/routes/userRoutes.js';
import pollRoutes from './src/routes/pollRoutes.js';
import voteRoutes from './src/routes/voteRoutes.js';

// Import WebSocket handlers
import { authenticateSocket, handleConnection } from './src/websocket/socketHandlers.js';

// Import database connection
import prisma from './src/config/database.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Make io available to routes
app.set('io', io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Real-Time Polling API'
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/votes', voteRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Real-Time Polling API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      polls: '/api/polls',
      votes: '/api/votes',
      health: '/health'
    },
    websocket: 'Socket.IO enabled for real-time updates'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'The requested endpoint does not exist'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// WebSocket connection handling
io.use(authenticateSocket);
io.on('connection', handleConnection);

const PORT = process.env.PORT || 3000;

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\nShutting down gracefully...');
  
  // Close Socket.IO server
  io.close();
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  // Disconnect from database
  await prisma.$disconnect();
  console.log('Database connection closed');
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
server.listen(PORT, () => {
  console.log(`
🚀 Real-Time Polling API Server running on port ${PORT}
📡 Environment: ${process.env.NODE_ENV || 'development'}
🔗 WebSocket: Enabled with Socket.IO
🗄️  Database: PostgreSQL with Prisma ORM
📋 API Endpoints:
   - GET    /                     - Welcome message
   - GET    /health               - Health check
   - POST   /api/users/register   - User registration
   - POST   /api/users/login      - User login
   - GET    /api/users/profile    - User profile
   - GET    /api/polls            - Get published polls
   - POST   /api/polls            - Create poll
   - GET    /api/polls/:id        - Get poll by ID
   - POST   /api/votes            - Submit vote
   - GET    /api/votes/results/:pollId - Get poll results

💡 Make sure to:
   1. Set up PostgreSQL database
   2. Configure DATABASE_URL in .env
   3. Run: npm run db:push
   4. Run: npm run db:seed (optional)
  `);
});

export default app;