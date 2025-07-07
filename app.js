const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const dbConnect = require('./src/config/dbConnect');
dbConnect();

const app = express();

// Allow frontend CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  process.env.FRONTEND_URL,
];

app.use(cors({
  origin: function (origin, callback) {
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

// Route imports
const userRoutes = require('./src/routes/userRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const packageRoutes = require('./src/routes/packageRoutes');
const reefTourRoutes = require('./src/routes/reeftourRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const weatherRoute = require('./src/routes/weatherRoute');
const bookingRoutes = require('./src/routes/bookingRoutes'); 

// Use routes
app.use('/authentication', userRoutes);
app.use('/events', eventRoutes);
app.use('/admin', adminRoutes);
app.use('/package', packageRoutes);
app.use('/reeftour', reefTourRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/weather', weatherRoute);
app.use('/bookings', bookingRoutes);

// Root
app.get('/', (req, res) => {
  res.send('CoralStay backend is running');
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
