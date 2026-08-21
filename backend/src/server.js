const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const setupSocket = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
});

setupSocket(io);

// Expose io in req object for controllers if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api/v1/auth', authRoutes);

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'ExamGuard Backend API',
    timestamp: new Date().toISOString(),
  });
});

// Fallback Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🛡️ ExamGuard API & Socket.IO server running on port ${PORT}`);
});
