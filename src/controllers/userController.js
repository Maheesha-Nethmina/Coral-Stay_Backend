const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Google OAuth2 Client
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// Register User
const registerUser = async (req, res) => {
  const { name, email, password, retypePassword, role } = req.body;

  try {
    if (!name || !email || !password || !retypePassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== retypePassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters, include 1 uppercase letter and 1 special character"
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const newUser = new User({ name, email, password, role });
    await newUser.save();

    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Login User (normal login)
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      redirectTo: user.role === 'admin' ? '/admin' : '/',
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Google Sign-In
const googleSignIn = async (req, res) => {
  try {
    const { tokenId } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        googleId,
        password: crypto.randomBytes(16).toString("hex"),
      });
      await user.save();
    }

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Google Sign-In error:", err);
    return res.status(401).json({ message: "Google Sign-In failed" });
  }
};

// Logout User
const logoutUser = (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
      expires: new Date(0),
    });

    return res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error("Error during logout:", err);
    return res.status(500).json({ message: "Server error during logout" });
  }
};

//  Get current user
const getMe = async (req, res) => {
  try {
    return res.status(200).json({ user: req.user });
  } catch (err) {
    return res.status(500).json({ message: "Error retrieving user data" });
  }
};

//  Forgot Password
const forgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Coral Stay" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Link',
      html: `
        <p>You requested a password reset.</p>
        <p><a href="${resetLink}">Click here to reset your password</a></p>
        <p>This link expires in 15 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "Reset link sent to email" });
  } catch (err) {
    console.error('Error sending reset email:', err);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};

//  Reset Password
// const resetPassword = async (req, res) => {
//   const token = req.body.token || "";
//   const { newPassword } = req.body;

//   if (!token || !newPassword) {
//     return res.status(400).json({ message: "Token and new password required" });
//   }

//   try {
//     const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

//     const user = await User.findOne({
//       resetPasswordToken: hashedToken,
//       resetPasswordExpire: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid or expired token." });
//     }

//     user.password = await bcrypt.hash(newPassword, 10);
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpire = undefined;
//     await user.save();

//     return res.json({ message: "Password has been reset successfully." });
//   } catch (err) {
//     console.error("Reset password error:", err);
//     return res.status(500).json({ message: "Server error during password reset" });
//   }
// };

const resetPassword = async (req, res) => {
  const token = req.body.token || "";
  const { newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password required" });
  }

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    user.password = newPassword;  // Let schema handle bcrypt
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save(); // This will call your pre-save bcrypt hook

    return res.json({ message: "Password has been reset successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Server error during password reset" });
  }
};

// Check if user is registered
const isUserRegistered = async (req, res) => {
  const { userId, email, nicNumber, googleId } = req.body;

  if (!userId && !email && !nicNumber && !googleId) {
    return res.status(400).json({ message: "At least one identifier is required" });
  }

  try {
    const user = await User.findOne({
      $or: [
        userId ? { _id: userId } : null,
        email ? { email } : null,
        nicNumber ? { nicNumber } : null,
        googleId ? { googleId } : null
      ].filter(Boolean)
    });

    return res.status(200).json({ isRegistered: !!user });
  } catch (error) {
    console.error("isUserRegistered error:", error);
    return res.status(500).json({ message: "Server error", isRegistered: false });
  }
};

//user details to profile
const userDetailsToProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select("name email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error("Error fetching user details:", err);
    return res.status(500).json({ message: "Server error" });
  }
};



module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  forgetPassword,
  resetPassword,
  googleSignIn,
  isUserRegistered,
  userDetailsToProfile
};
