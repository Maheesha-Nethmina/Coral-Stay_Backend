const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const dbConnect = require('./src/config/dbConnect');
dbConnect();

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  process.env.FRONTEND_URL,
];

// CORS configuration with debug logging
app.use(cors({
  origin: function (origin, callback) {
    // console.log('Incoming origin:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
const userRoutes = require('./src/routes/userRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const packageRoutes=require('./src/routes/packageRoutes');
const reefTourRoutes = require('./src/routes/reeftourRoutes');

// Use routes
app.use('/authentication', userRoutes);
app.use('/events', eventRoutes);
app.use('/admin', adminRoutes);
app.use('/package',packageRoutes)
app.use('/reeftour', reefTourRoutes);

// 404 fallback route
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Server start
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
});
