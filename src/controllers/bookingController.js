// controllers/bookingController.js

const Booking = require('../models/Booking');
const nodemailer = require('nodemailer');

exports.createBooking = async (req, res) => {
  try {
    // Convert checkIn and checkOut strings to Date objects before saving
    req.body.checkIn = new Date(req.body.checkIn);
    req.body.checkOut = new Date(req.body.checkOut);

    const booking = new Booking(req.body);
    await booking.save();

    // Setup transporter for email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('Sending confirmation email to:', booking.guestEmail);

    await transporter.sendMail({
      from: `"Coral Stay" <${process.env.EMAIL_USER}>`,
      to: booking.guestEmail,
      subject: 'Your Coral Stay Booking Confirmation',
      html: `<h3>Thank you for your booking!</h3>
      <p>Room: ${booking.roomTitle}</p>
      <p>Quantity: ${booking.quantity}</p>
      <p>Package: ${booking.packageType}</p>
      <p>Check-in: ${booking.checkIn.toDateString()}</p>
      <p>Check-out: ${booking.checkOut.toDateString()}</p>`,
    });

    res.status(201).json({ message: 'Booking saved and email sent.' });
  } catch (error) {
    console.error('Booking or email error:', error);
    res.status(500).json({ error: 'Failed to save booking or send email.' });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, packageType } = req.body;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const overlappingBookings = await Booking.find({
      roomId,
      packageType,
      checkIn: { $lte: checkOutDate },
      checkOut: { $gte: checkInDate }
    });

    // Sum booked quantities
    const bookedQuantity = overlappingBookings.reduce((sum, booking) => sum + booking.quantity, 0);

    const totalRooms = 20;
    const availableRooms = Math.max(0, totalRooms - bookedQuantity);

    console.log('Overlapping bookings:', overlappingBookings);
    console.log('Booked quantity:', bookedQuantity);
    console.log('Available rooms:', availableRooms);

    res.status(200).json({ availableRooms });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Error checking room availability.' });
  }
};
