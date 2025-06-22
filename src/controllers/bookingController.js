const Booking = require('../models/Booking');
const nodemailer = require('nodemailer');

exports.createBooking = async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();

    // Send confirmation email to guest
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
      to: booking.guestEmail, // ONLY the guest's email
      subject: 'Your Coral Stay Booking Confirmation',
      html: `<h3>Thank you for your booking!</h3>
      <p>Room: ${booking.roomTitle}</p>
      <p>Package: ${booking.packageType}</p>
      <p>Check-in: ${booking.checkIn}</p>
      <p>Check-out: ${booking.checkOut}</p>
      `
    });

    res.status(201).json({ message: 'Booking saved and email sent.' });
  } catch (error) {
    console.error('Booking or email error:', error);
    res.status(500).json({ error: 'Failed to save booking or send email.' });
  }
};

exports.checkAvailability = async (req, res) => {
  const { roomId, checkIn, checkOut } = req.body;

  try {
    const bookings = await Booking.find({
      roomId,
      $or: [
        { checkIn: { $lte: checkOut, $gte: checkIn } },
        { checkOut: { $lte: checkOut, $gte: checkIn } },
        { $and: [ { checkIn: { $lte: checkIn } }, { checkOut: { $gte: checkOut } } ] }
      ]
    });

    const isAvailable = bookings.length === 0;

    res.status(200).json({ available: isAvailable });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Error checking room availability.' });
  }
};
