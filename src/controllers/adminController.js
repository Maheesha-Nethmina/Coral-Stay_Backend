const User = require('../models/userModel');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

// Update user role or status 
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    // If user is deactivated, send 403 to force logout
    if (role === 'deactivated') {
      return res.status(403).json({ message: 'User deactivated' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Server error while updating user' });
  }
};


//update user details
const updateUserDetails = async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Basic email validation
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Role validation
    const allowedRoles = ['user', 'admin', 'deactivated'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    let isUpdated = false;

    if (name && user.name !== name) {
      user.name = name;
      isUpdated = true;
    }
    if (email && user.email !== email) {
      user.email = email;
      isUpdated = true;
    }
    if (role && user.role !== role) {
      user.role = role;
      isUpdated = true;
    }

    if (!isUpdated) {
      return res.status(200).json({ message: 'No changes detected', user });
    }

    await user.save();

    res.status(200).json({ message: 'User details updated successfully', user });
  }
  catch (err) {
    console.error(`Error updating user details for ID ${id}:`, err.message);
    res.status(500).json({ message: 'Server error while updating user details' });
  }
};

module.exports = { updateUserDetails };

// Send an email to user
const sendEmailToUser = async (req, res) => {
  const { email, subject, message } = req.body;

  if (!email || !subject || !message) {
    return res.status(400).json({ message: 'Email, subject, and message are required.' });
  }

  try {
    // Configure the transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text: message,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Failed to send email', error });
      } else {
        console.log('Email sent:', info.response);
        return res.status(200).json({ message: 'Email sent successfully' });
      }
    });
  } catch (err) {
    console.error('Server error in sendEmailToUser:', err);
    res.status(500).json({ message: 'Server error while sending email' });
  }
};


module.exports = {
  getAllUsers,
  updateUserRole,
  updateUserDetails,
  sendEmailToUser
};
