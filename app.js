const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const dbConnect = require('./src/config/dbConnect');
dbConnect();

const app = express();

// Allow frontend CORS
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
];

// CORS setup
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
const userRoutes = require('./src/routes/userRoutes'); // optional
app.use('/authentication', userRoutes); // optional

const emailRoutes = require('./src/routes/emailRoutes');
app.use('/contact', emailRoutes);

const bookingRoutes = require('./src/routes/bookingRoutes');
app.use('/bookings', bookingRoutes);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
