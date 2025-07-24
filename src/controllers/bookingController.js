// bookingController.js

const Booking = require('../models/Booking');
const PriceSetting = require('../models/priceSettingModel');
const nodemailer = require('nodemailer');

// Define price matrix
const packagePrices = {
  'Deluxe Room': {
    'Full Board Package': 20000,
    'Half Board Package': 15000,
    'Room Only Package': 10000
  },
  'Premier Room': {
    'Full Board Package': 30000,
    'Half Board Package': 25000,
    'Room Only Package': 20000
  },
  'Royal Suite Suite': {
    'Full Board Package': 35000,
    'Half Board Package': 32000,
    'Room Only Package': 30000
  },
  'Premier Ocean Room': {
    'Full Board Package': 40000,
    'Half Board Package': 35000,
    'Room Only Package': 30000
  },
  'Presidential Suite': {
    'Full Board Package': 55000,
    'Half Board Package': 50000,
    'Room Only Package': 45000
  }
};

exports.createBooking = async (req, res) => {
  try {
    req.body.checkIn = new Date(req.body.checkIn);
    req.body.checkOut = new Date(req.body.checkOut);

    const {
      roomId,
      roomTitle,
      packageType,
      quantity,
      checkIn,
      checkOut,
      guestEmail,
      guestName,
      nicNumber,
      contactNumber
    } = req.body;

    if (checkIn >= checkOut) {
      return res.status(400).json({ error: 'Check-in date must be before check-out date.' });
    }

    const roomPackages = packagePrices[roomTitle];
    if (!roomPackages) {
      return res.status(400).json({ error: `No price defined for room: ${roomTitle}` });
    }

    const basePrice = roomPackages[packageType];
    if (!basePrice) {
      return res.status(400).json({ error: `Invalid package type '${packageType}' for room '${roomTitle}'` });
    }

    const priceSettings = await PriceSetting.findOne().sort({ updatedAt: -1 });
    const serviceFee = priceSettings?.serviceFee ?? 300;
    const discount = priceSettings?.discount ?? 0;

    const subtotal = basePrice * quantity;
    const totalAmount = subtotal + serviceFee - discount;

    const booking = new Booking({
      roomId,
      roomTitle,
      packageType,
      quantity,
      checkIn,
      checkOut,
      guestEmail,
      guestName,
      nicNumber,
      contactNumber,
      totalAmount
    });
    await booking.save();
    console.log('✅ Booking saved.');

    // Only send emails if all credentials are present
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.ADMIN_EMAIL) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const formatRs = (amount) =>
        `Rs. ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

      const emailHTML = `
        <h2>Coral Stay Booking Confirmation</h2>
        <p><strong>Guest Name:</strong> ${guestName}</p>
        <p><strong>NIC:</strong> ${nicNumber}</p>
        <p><strong>Contact:</strong> ${contactNumber}</p>
        <p><strong>Email:</strong> ${guestEmail}</p>
        <hr />
        <p><strong>Room:</strong> ${roomTitle}</p>
        <p><strong>Package:</strong> ${packageType}</p>
        <p><strong>Rooms Booked:</strong> ${quantity}</p>
        <p><strong>Check-in:</strong> ${new Date(checkIn).toDateString()}</p>
        <p><strong>Check-out:</strong> ${new Date(checkOut).toDateString()}</p>
        <hr />
        <h3>Invoice:</h3>
        <p>Price per Room: ${formatRs(basePrice)}</p>
        <p>Subtotal: ${formatRs(subtotal)}</p>
        <p>Service Fee: ${formatRs(serviceFee)}</p>
        <p>Discount: -${formatRs(discount)}</p>
        <h4>Total Amount: ${formatRs(totalAmount)}</h4>
        <hr />
        <p>Thank you for choosing Coral Stay 🌊</p>
      `;

      try {
        await transporter.sendMail({
          from: `"Coral Stay" <${process.env.EMAIL_USER}>`,
          to: guestEmail,
          subject: 'Your Coral Stay Booking Confirmation',
          html: emailHTML,
        });

        await transporter.sendMail({
          from: `"Coral Stay" <${process.env.EMAIL_USER}>`,
          to: process.env.ADMIN_EMAIL,
          subject: 'New Coral Stay Booking Received',
          html: emailHTML,
        });
      } catch (emailError) {
        console.error('❌ Email sending error:', emailError);
        // Still return success, but notify about email failure
        return res.status(201).json({
          message: 'Booking successful, but failed to send confirmation email.',
          emailError: emailError.message
        });
      }
    } else {
      console.warn('⚠️ Email credentials missing, skipping email sending.');
    }

    res.status(201).json({ message: 'Booking successful.' });

  } catch (error) {
    console.error('❌ Booking error:', error);
    res.status(500).json({
      error: 'Failed to save booking.',
      details: error.message
    });
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

    const bookedQuantity = overlappingBookings.reduce((sum, booking) => sum + (booking.quantity || 0), 0);
    const totalRooms = 20;
    const availableRooms = Math.max(0, totalRooms - bookedQuantity);

    res.status(200).json({ availableRooms });
  } catch (error) {
    console.error('❌ Error checking availability:', error);
    res.status(500).json({ error: 'Error checking room availability.' });
  }
};