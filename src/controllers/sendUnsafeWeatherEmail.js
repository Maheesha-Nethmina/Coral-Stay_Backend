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

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const htmlContent = `
      <p>Dear <strong>${fullName}</strong>,</p>

      <p>We regret to inform you that the weather conditions on <strong>${date}</strong> during your scheduled tour at <strong>${timeSlot}</strong> are marked as <span style="color:red;"><strong>unsafe</strong></span> for boat rides.</p>

      <p>We highly recommend rescheduling your booking to ensure your safety and comfort.</p>

      <p>If you have any questions or would like to reschedule, feel free to contact us using the information below.</p>

      <br/>

      <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />

      <p style="font-size: 16px; font-weight: bold;">Contact Us</p>
      <p><strong>Coral Stay Beach Resort</strong></p>
      <p>Map No 123/A Hikkaduwa</p>
      <p><strong>Email:</strong> <a href="mailto:coralstayhikkaduwa@gmail.com">coralstayhikkaduwa@gmail.com</a></p>
      <p><strong>Phone:</strong> <a href="tel:+94766210979">0766210979</a></p>
      <p><strong>WhatsApp:</strong> <a href="https://wa.me/94766210979">0766210979</a></p>

      <p style="margin-top: 10px;">
        <a href="https://facebook.com" style="margin-right: 10px;"><img src="https://cdn-icons-png.flaticon.com/24/145/145802.png" alt="Facebook" /></a>
        <a href="https://twitter.com" style="margin-right: 10px;"><img src="https://cdn-icons-png.flaticon.com/24/145/145812.png" alt="Twitter" /></a>
        <a href="https://instagram.com" style="margin-right: 10px;"><img src="https://cdn-icons-png.flaticon.com/24/2111/2111463.png" alt="Instagram" /></a>
        <a href="https://linkedin.com"><img src="https://cdn-icons-png.flaticon.com/24/145/145807.png" alt="LinkedIn" /></a>
      </p>

      <p style="margin-top: 20px;">Thank you,<br/>Coral Stay Beach Resort</p>
    `;

    const mailOptions = {
      from: `"Coral Stay Beach Resort" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Important Notice: Unsafe Weather Conditions for Your Boat Tour`,
      text: `Dear ${fullName},

The weather conditions on ${date} at ${timeSlot} are unsafe for boat rides. We recommend rescheduling your tour for safety.

Thank you,
Coral Stay Beach Resort`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Alert email sent successfully.' });
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500).json({ error: 'Failed to send alert email' });
  }
};

module.exports = { sendUnsafeWeatherEmail };
