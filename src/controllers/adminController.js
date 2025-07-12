const User = require('../models/userModel');
const CancellationRequest = require('../models/cancellationRequestModel');
const sheetBooking = require('../models/sheetBookingModel'); 
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

//Cancellation request handler



// Set up Nodemailer (example with Gmail - use app password!)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,  
  },
});

const requestCancellation = async (req, res) => {
  try {
    const { userId, bookingId, reason, refundAmount, type } = req.body;

    const booking = await sheetBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newCancellation = new CancellationRequest({
      userId,
      bookingId,
      type,
      date: booking.date,
      timeSlot: booking.timeSlot || '',
      reason,
      amount: booking.totalAmount,
      refundAmount,
    });

    await newCancellation.save();

    // Send cancellation confirmation email
    const mailOptions = {
      from: 'yourappemail@gmail.com',
      to: user.email,
      subject: 'Your Reef Tour Cancellation Request is Received',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 10px;">
          <h2>Hello ${user.name},</h2>
          <p>Your cancellation request has been received for the following booking:</p>
          <ul>
            <li><strong>Date:</strong> ${booking.date}</li>
            <li><strong>Time Slot:</strong> ${booking.timeSlot}</li>
            <li><strong>Refund Amount:</strong> Rs. ${refundAmount}</li>
          </ul>
          <p><strong>Reason Provided:</strong> ${reason}</p>
          <p>We are currently processing your request. You will receive another email once it's completed.</p>
          <p>Thank you,<br/>CoralStay Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Cancellation request submitted and email sent' });

  } catch (err) {
    console.error('Cancellation request error:', err);
    res.status(500).json({ message: 'Server error while processing cancellation' });
  }
};

// Get all cancellation requests
const getAllCancellationRequests = async (req, res) => {
  try {
    const requests = await CancellationRequest.find()
      .populate('userId', '-password')
      .populate('bookingId')
      .sort({ date: 1 });

    res.status(200).json(requests);
  } catch (err) {
    console.error('Error fetching cancellation requests:', err);
    res.status(500).json({ message: 'Server error while fetching cancellation requests' });
  }
};

// Accept cancellation request and delete booking
const acceptCancellationRequest = async (req, res) => {
  try {
    const cancellation = await CancellationRequest.findById(req.params.id);

    if (!cancellation) {
      return res.status(404).json({ message: 'Cancellation request not found' });
    }

    if (cancellation.type === 'reefTour') {
      const deleted = await SheetBooking.findByIdAndDelete(cancellation.bookingId);

      if (!deleted) {
        return res.status(404).json({ message: 'Booking not found for reefTour' });
      }
    }
    //add other types when it implements

    // Optional: delete the cancellation request OR update status
    await CancellationRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Cancellation request accepted and booking deleted' });
  } catch (err) {
    console.error('Error accepting cancellation:', err);
    res.status(500).json({ message: 'Server error while accepting cancellation' });
  }
};

module.exports = { acceptCancellationRequest };




module.exports = {
  getAllUsers,
  updateUserRole,
  updateUserDetails,
  sendEmailToUser,
  requestCancellation,
  getAllCancellationRequests,
  acceptCancellationRequest
};
