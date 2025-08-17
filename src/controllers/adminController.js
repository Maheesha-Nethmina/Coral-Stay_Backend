const User = require('../models/userModel');
const CancellationRequest = require('../models/cancellationRequestModel');
const sheetBooking = require('../models/sheetBookingModel');
const booking = require('../models/Booking');
const nodemailer = require('nodemailer');
const packageBooking = require('../models/PackageBooking');
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


// Request cancellation for bookings

// Request cancellation for bookings
const requestCancellation = async (req, res) => {
  try {
    const { userId, bookingId, reason, refundAmount, type } = req.body;

    let currentBooking;
    let bookingDate;
    let amount;
    let extraFields = {};
    let normalizedType;

    switch (type) {
      case 'reefTour':
        currentBooking = await sheetBooking.findById(bookingId);
        if (!currentBooking) return res.status(404).json({ message: 'Reef tour booking not found' });

        bookingDate = currentBooking.date;
        amount = currentBooking.totalAmount;
        extraFields = {
          timeSlot: currentBooking.timeSlot || '',
          seats: currentBooking.seats || []
        };
        normalizedType = 'reefTour';
        break;

      case 'hotel':
        currentBooking = await booking.findById(bookingId);
        if (!currentBooking) return res.status(404).json({ message: 'Hotel booking not found' });

        bookingDate = currentBooking.checkIn;
        amount = currentBooking.totalAmount;
        extraFields = {
          checkOut: currentBooking.checkOut,
          roomTitle: currentBooking.roomTitle
        };
        normalizedType = 'hotelRoom';
        break;

      case 'package':
        currentBooking = await packageBooking.findById(bookingId);
        if (!currentBooking) return res.status(404).json({ message: 'Package booking not found' });

        // ✅ map correctly to schema fields
        bookingDate = currentBooking.bookedDate;
        amount = currentBooking.totalAmount;
        extraFields = {
          packageName: currentBooking.packageDetails?.name || ''
        };
        normalizedType = 'specialPackage';
        break;

      default:
        return res.status(400).json({ message: 'Invalid booking type' });
    }

    // Validate required fields before saving
    if (!bookingDate || !amount) {
      return res.status(400).json({ message: 'Invalid booking data (missing date or amount)' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newCancellation = new CancellationRequest({
      userId,
      bookingId,
      type: normalizedType,
      reason,
      refundAmount,
      amount,
      date: bookingDate,
      ...extraFields,
    });

    await newCancellation.save();

    // --- Prepare Email ---
    let subject, html;
    if (normalizedType === 'reefTour') {
      subject = 'Your Reef Tour Cancellation Request is Received';
      html = `
        <h2>Hello ${user.name},</h2>
        <p>Your cancellation request has been received for the reef tour:</p>
        <ul>
          <li><strong>Date:</strong> ${currentBooking.date}</li>
          <li><strong>Time Slot:</strong> ${currentBooking.timeSlot}</li>
          <li><strong>Refund Amount:</strong> Rs. ${refundAmount}</li>
        </ul>
        <p>Reason: ${reason}</p>
      `;
    } else if (normalizedType === 'hotelRoom') {
      subject = 'Your Hotel Booking Cancellation Request is Received';
      html = `
        <h2>Hello ${user.name},</h2>
        <p>Your cancellation request has been received for your hotel booking:</p>
        <ul>
          <li><strong>Room:</strong> ${currentBooking.roomTitle}</li>
          <li><strong>Check-In:</strong> ${currentBooking.checkIn}</li>
          <li><strong>Check-Out:</strong> ${currentBooking.checkOut}</li>
          <li><strong>Refund Amount:</strong> Rs. ${refundAmount}</li>
        </ul>
        <p>Reason: ${reason}</p>
      `;
    } else if (normalizedType === 'specialPackage') {
      subject = 'Your Package Booking Cancellation Request is Received';
      html = `
        <h2>Hello ${user.name},</h2>
        <p>Your cancellation request has been received for your package:</p>
        <ul>
          <li><strong>Package:</strong> ${currentBooking.packageDetails?.name}</li>
          <li><strong>Booked Date:</strong> ${currentBooking.bookedDate}</li>
          <li><strong>Refund Amount:</strong> Rs. ${refundAmount}</li>
        </ul>
        <p>Reason: ${reason}</p>
      `;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject,
      html,
    });

    res.status(201).json({ message: `${type} cancellation request submitted and email sent` });
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

//Accept cancellation request and send HTML email
const acceptCancellationRequest = async (req, res) => {
  try {
    const cancellation = await CancellationRequest.findById(req.params.id);
    if (!cancellation) {
      return res.status(404).json({ message: 'Cancellation request not found' });
    }

    // Get user info from cancellation.userId
    const user = await User.findById(cancellation.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found for this cancellation' });
    }

    let booking = null;
    if (cancellation.type === 'reefTour') {
      booking = await sheetBooking.findByIdAndDelete(cancellation.bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found for reefTour' });
      }
    }

    await CancellationRequest.findByIdAndDelete(req.params.id);

    // Email Logic
    const refundAmount = cancellation.refundAmount || 0;
    const reason = cancellation.reason || 'N/A';
    const date = booking?.date || 'N/A';
    const timeSlot = booking?.timeSlot || 'N/A';
    const userName = user.name || 'Customer';

    const mailOptions = {
      from: `CoralStay <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Your cancellation request has been accepted by CoralStay.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 10px;">
          <h2>Hello ${userName},</h2>
          <p>Your cancellation request has been accepted and your booking has been successfully cancelled.</p>
          <h4>Booking Details:</h4>
          <ul>
            <li><strong>Date:</strong> ${date}</li>
            <li><strong>Time Slot:</strong> ${timeSlot}</li>
            <li><strong>Refund Amount:</strong> Rs. ${refundAmount}</li>
          </ul>
          <p><strong>Reason Provided:</strong> ${reason}</p>
          <p>If you have any questions or need further assistance, feel free to contact us.</p>
          <br />
          <p>Thank you,<br/>CoralStay Team</p>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
    } catch (emailErr) {
      console.error('Error sending email:', emailErr);
    }

    res.status(200).json({ message: 'Cancellation accepted, booking deleted, and email sent.' });
  } catch (err) {
    console.error('Error accepting cancellation:', err);
    res.status(500).json({ message: 'Server error while accepting cancellation' });
  }
};

// Get all room bookings
const getAllRoomBookings = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const bookings = await booking
      .find({ checkIn: { $gte: today } })
      .sort({ checkIn: 1 });

    res.status(200).json(bookings);
  } catch (err) {
    console.error('Error fetching room bookings:', err);
    res.status(500).json({ message: 'Server error while fetching room bookings' });
  }
};



// Delete booking and send cancellation email
const deleteBooking = async (req, res) => {
  try {
    const requestId = req.params.id;

    // Find cancellation request
    const request = await cancellationRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Cancellation request not found' });
    }

    let deletedBooking = null;

    // Delete from correct collection
    if (request.type === 'hotelRoom') {
      deletedBooking = await booking.findByIdAndDelete(request.bookingId);
    } else {
      deletedBooking = await packageBooking.findByIdAndDelete(request.bookingId);
    }

    // Delete the cancellation request itself
    await cancellationRequest.findByIdAndDelete(requestId);

    if (!deletedBooking) {
      return res.status(404).json({ message: 'Booking not found in related table' });
    }

    // Set up email transport
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    //Compose email (supports both models)
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: deletedBooking.user?.email || deletedBooking.guestEmail,
      subject: 'Booking Cancellation Notice - CoralStay',
      text: `
Dear ${deletedBooking.user?.fullName || deletedBooking.guestName},

We regret to inform you that your booking with CoralStay has been cancelled.

Here are your booking details:

📦 Package/Room: ${deletedBooking.packageType || deletedBooking.roomTitle}
📅 Check-in Date: ${deletedBooking.checkIn || deletedBooking.bookedDate}
📅 Check-out Date: ${deletedBooking.checkOut || deletedBooking.checkOutDate}

We sincerely apologize for any inconvenience this may cause. 
If you have any questions or need assistance, contact us at coralstayhelp@gmail.com.

Warm regards,  
The CoralStay Team
      `.trim(),
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Booking deleted, cancellation request removed, and email sent' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Failed to delete booking and send email' });
  }
};







module.exports = {
  getAllUsers,
  updateUserRole,
  updateUserDetails,
  sendEmailToUser,
  requestCancellation,
  getAllCancellationRequests,
  acceptCancellationRequest,
  getAllRoomBookings,
  deleteBooking
};
