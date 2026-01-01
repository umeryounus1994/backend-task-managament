const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/database');
const redisClient = require('./config/redis');
const swaggerSetup = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
require('./models'); // Initialize models and associations

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

swaggerSetup(app);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Note Taking API is running',
    documentation: '/api-docs'
  });
});

app.get('/health', async (req, res) => {
  try {
    await connectDB();
    await redisClient.connect();
    res.json({
      success: true,
      message: 'All services are healthy',
      database: 'connected',
      redis: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service unhealthy',
      error: error.message
    });
  }
});

// API Routes
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const noteShareRoutes = require('./routes/noteShare');
const noteAttachmentRoutes = require('./routes/noteAttachment');
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/notes', noteShareRoutes);
app.use('/api/notes', noteAttachmentRoutes);

// Error handler must be last
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    await redisClient.connect();
    
    // Sync database in development (use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      const { sequelize } = require('./config/database');
      await sequelize.sync({ alter: false });
      console.log('✅ Database models synchronized');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;

