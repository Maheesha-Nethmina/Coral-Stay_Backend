const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware to protect routes (only for authenticated and active users)
exports.protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized. Token missing.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    // ✅ New: Check if user is deactivated
    if (user.role === 'deactivated') {
      return res.status(403).json({ message: 'Account deactivated. Please contact support.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Middleware to check role-based access (for admin/user-specific routes)
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied.' });
    }
    next();
  };
};
