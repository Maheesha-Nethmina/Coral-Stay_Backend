const Booking = require('../models/Booking');
const PriceSetting = require('../models/priceSettingModel');
const nodemailer = require('nodemailer');

// Price matrix same as before
const packagePrices = {
  'Deluxe Room': {
    'Full Board Package': 20000,
    'Half Board Package': 15000,
    'Room Only Package': 10000,
  },
  'Premier Room': {
    'Full Board Package': 30000,
    'Half Board Package': 25000,
    'Room Only Package': 20000,
  },
  'Royal Suite Suite': {
    'Full Board Package': 35000,
    'Half Board Package': 32000,
    'Room Only Package': 30000,
  },
  'Premier Ocean Room': {
    'Full Board Package': 40000,
    'Half Board Package': 35000,
    'Room Only Package': 30000,
  },
  'Presidential Suite': {
    'Full Board Package': 55000,
    'Half Board Package': 50000,
    'Room Only Package': 45000,
  },
};

const TOTAL_ROOMS_PER_ROOMTYPE = 5;

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
      contactNumber,
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

    const overlappingBookings = await Booking.find({
      roomId,
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
    });

    const bookedQuantity = overlappingBookings.reduce((sum, booking) => sum + (booking.quantity || 0), 0);
    const availableRooms = TOTAL_ROOMS_PER_ROOMTYPE - bookedQuantity;

    if (availableRooms < quantity) {
      return res.status(400).json({ error: `Only ${availableRooms} rooms available for the selected dates.` });
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
      totalAmount,
    });

    await booking.save();
    console.log('✅ Booking saved.');

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

      // --- Email HTML ---
      const emailHTML = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;">
          <div style="background:#023545;padding:24px 0 12px 0;text-align:center;">
            <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="Coral Stay" style="width:60px;margin-bottom:8px;" />
            <h2 style="color:#fff;margin:0;">Thank you for your booking, <span style="color:#ffd700;">${guestName}</span>!</h2>
          </div>
          <div style="background:#f7fafc;padding:24px 32px 16px 32px;">
            <p style="font-size:17px;color:#023545;">
              We are delighted to confirm your reservation at <b>Coral Stay Beach Resort</b>.<br>
              Below are your booking details:
            </p>
            <hr style="margin:18px 0;">
            <!-- Booking Details -->
            <h3 style="color:#023545;margin-bottom:8px;">Booking Details</h3>
            <div style="font-size:15px;color:#222;">
              <p><b>Guest Name:</b> ${guestName}</p>
              <p><b>NIC:</b> ${nicNumber}</p>
              <p><b>Contact:</b> ${contactNumber}</p>
              <p><b>Email:</b> ${guestEmail}</p>
              <p><b>Room:</b> ${roomTitle}</p>
              <p><b>Package:</b> ${packageType}</p>
              <p><b>Rooms Booked:</b> ${quantity}</p>
              <p><b>Check-in:</b> ${checkIn.toDateString()}</p>
              <p><b>Check-out:</b> ${checkOut.toDateString()}</p>
            </div>
            <hr style="margin:18px 0;">
            <!-- Invoice -->
            <h3 style="color:#023545;margin-bottom:8px;">Invoice</h3>
            <div style="font-size:15px;">
              <p>Price per Room: <b>${formatRs(basePrice)}</b></p>
              <p>Subtotal: <b>${formatRs(subtotal)}</b></p>
              <p>Service Fee: <b>${formatRs(serviceFee)}</b></p>
              <p>Discount: <b>-${formatRs(discount)}</b></p>
              <h4 style="margin:10px 0 0 0;">Total Amount: <span style="color:#008060;">${formatRs(totalAmount)}</span></h4>
            </div>
            <hr style="margin:18px 0;">
            <p style="font-size:16px;color:#023545;font-weight:bold;margin-bottom:0;">
              We look forward to welcoming you!
            </p>
          </div>
          <div style="background:#fff;padding:24px 32px 16px 32px;">
            <h3 style="color:#023545;margin-bottom:8px;">Contact Us</h3>
            <div style="font-size:15px;color:#222;line-height:1.7;">
              <div style="display:flex;align-items:center;gap:8px;">
                <img src="https://cdn-icons-png.flaticon.com/512/854/854878.png" alt="Resort" style="width:20px;vertical-align:middle;" />
                <span>Coral Stay Beach Resort</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Map" style="width:20px;vertical-align:middle;" />
                <span>Map No 123/A Hikkaduwa</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <img src="https://cdn-icons-png.flaticon.com/512/732/732200.png" alt="Email" style="width:20px;vertical-align:middle;" />
                <a href="mailto:coralstayhikkaduwa@gmail.com" style="color:#023545;text-decoration:underline;">coralstayhikkaduwa@gmail.com</a>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <img src="https://cdn-icons-png.flaticon.com/512/597/597177.png" alt="Phone" style="width:20px;vertical-align:middle;" />
                <a href="tel:+9472917345" style="color:#023545;text-decoration:underline;">072917345</a>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" alt="WhatsApp" style="width:20px;vertical-align:middle;" />
                <a href="https://wa.me/9472918348" style="color:#25D366;text-decoration:underline;">072918348</a>
              </div>
              <div style="margin-top:12px;">
                <a href="https://www.facebook.com/CoralStayHikkaduwa" target="_blank" style="margin-right:8px;">
                  <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" style="width:22px;vertical-align:middle;" />
                </a>
                <a href="https://twitter.com/CoralStayResort" target="_blank" style="margin-right:8px;">
                  <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" style="width:22px;vertical-align:middle;" />
                </a>
                <a href="https://www.instagram.com/CoralStayHikkaduwa" target="_blank" style="margin-right:8px;">
                  <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" style="width:22px;vertical-align:middle;" />
                </a>
                <a href="https://www.linkedin.com/company/coralstayhikkaduwa" target="_blank">
                  <img src="https://cdn-icons-png.flaticon.com/512/733/733561.png" alt="LinkedIn" style="width:22px;vertical-align:middle;" />
                </a>
              </div>
            </div>
            <div style="margin-top:16px;font-size:13px;color:#888;">
              If you have any questions or need to make changes to your booking, please contact us using the details above.
            </div>
          </div>
        </div>
      `;
      // --- End Email HTML ---

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
        return res.status(201).json({
          message: 'Booking successful, but failed to send confirmation email.',
          emailError: emailError.message,
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
      details: error.message,
    });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut } = req.body;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const overlappingBookings = await Booking.find({
      roomId,
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });

    const bookedQuantity = overlappingBookings.reduce((sum, booking) => sum + (booking.quantity || 0), 0);
    const availableRooms = Math.max(0, TOTAL_ROOMS_PER_ROOMTYPE - bookedQuantity);

    res.status(200).json({ availableRooms });
  } catch (error) {
    console.error('❌ Error checking availability:', error);
    res.status(500).json({ error: 'Error checking room availability.' });
  }
};


// backend: checkRoomTypeAvailability

exports.checkRoomTypeAvailability = async (req, res) => {
  try {
    const { roomTitle, checkIn, quantity } = req.body;

    const checkInDate = new Date(checkIn);

    if (!roomTitle || !checkIn || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Normalize roomTitle to handle case-insensitivity and unexpected spaces
    const normalizedRoomTitle = roomTitle.trim().toLowerCase();

    // Define valid room types
    const TOTAL_ROOMS_PER_TYPE = {
      'deluxe room': 5,
      'premier room': 5,
      'royal suite': 5,
      'premier ocean room': 5,
      'presidential suite': 5,
    };

    // Check if room type exists in the available list
    const foundRoomType = Object.keys(TOTAL_ROOMS_PER_TYPE).find(
      (key) => key.toLowerCase() === normalizedRoomTitle
    );

    if (!foundRoomType) {
      console.error('Invalid room type received:', roomTitle);
      return res.status(400).json({ error: 'Invalid room type' });
    }

    const totalRooms = TOTAL_ROOMS_PER_TYPE[foundRoomType];

    // Find all bookings with the same roomTitle and checkIn date
    const bookings = await Booking.find({
      roomTitle: foundRoomType,
      checkIn: checkInDate,
    });

    const bookedQuantity = bookings.reduce((sum, b) => sum + (b.quantity || 0), 0);
    const availableRooms = Math.max(0, totalRooms - bookedQuantity);
    const isAvailable = availableRooms >= quantity;

    res.status(200).json({
      available: isAvailable,
      availableRooms,
      totalRooms,
      requested: quantity,
    });
  } catch (error) {
    console.error('Error checking room type availability:', error);
    res.status(500).json({ error: 'Server error while checking room availability.' });
  }
};
