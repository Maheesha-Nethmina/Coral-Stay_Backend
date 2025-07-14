// File: controllers/sendUnsafeWeatherEmail.js

const SeatBooking = require('../models/sheetBookingModel');
const nodemailer = require('nodemailer');
require('dotenv').config();

const sendUnsafeWeatherEmail = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await SeatBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const { email, fullName } = booking.user;
    const { date, timeSlot } = booking;

    // Setup transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Important Notice: Unsafe Weather Conditions for Your Boat Tour`,
      text: `Hello ${fullName},

This is to inform you that the weather conditions on ${date} during your scheduled tour at ${timeSlot} are currently marked as unsafe for boat rides due to wind or storm forecasts.

We highly recommend rescheduling your booking to ensure your safety.

Please contact us at your earliest convenience.

Thank you,
Boat Tour Admin Team`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Alert email sent successfully.' });
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500).json({ error: 'Failed to send alert email' });
  }
};

module.exports = { sendUnsafeWeatherEmail };
