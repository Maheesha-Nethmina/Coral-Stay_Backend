const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config(); 

const dbConnect = require('./src/config/dbConnect');
dbConnect();

const app = express();

// Allowable frontend URLs for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  process.env.FRONTEND_URL,
];

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
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
const contactRoutes = require('./src/routes/contactRoutes'); // ✅ only once!

app.use('/authentication', userRoutes);
app.use('/api/contact', contactRoutes);

app.get('/', (req, res) => {
  res.send('CoralStay backend is running');
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
