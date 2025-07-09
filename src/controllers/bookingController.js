const Booking = require('../models/Booking');
const nodemailer = require('nodemailer');

exports.createBooking = async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();

    // Compose booking details
    const bookingDetails = `
      <div style="margin-bottom:16px;">
        <strong>Room 1:</strong><br/>
        <ul style="margin:0 0 0 16px;padding:0;">
          <li><b>Room Type:</b> ${booking.roomTitle}</li>
          <li><b>Package:</b> ${booking.packageType}</li>
          <li><b>Quantity:</b> ${booking.quantity || 1}</li>
          <li><b>Price:</b> ${booking.price ? booking.price : ''}</li>
          <li><b>Check-In:</b> ${booking.checkIn}</li>
          <li><b>Check-Out:</b> ${booking.checkOut}</li>
        </ul>
      </div>
    `;

    const contactDetails = `
      <hr style="margin:24px 0;">
      <div style="font-size:15px;">
        <strong>Contact Us</strong><br/>
        Coral Stay Beach Resort<br/>
        <span>
          <b>Map</b> No 123/A Hikkaduwa
        </span><br/>
        <span>
          <b>Email</b> <a href="mailto:coralstayhikkaduwa@gmail.com" style="color:#023545;text-decoration:underline;">coralstayhikkaduwa@gmail.com</a>
        </span><br/>
        <span>
          <b>Phone</b> <a href="tel:072917345" style="color:#023545;text-decoration:underline;">072917345</a>
        </span><br/>
        <span>
          <b>WhatsApp</b> <a href="https://wa.me/9472918348" target="_blank" style="color:#25D366;text-decoration:underline;">072918348</a>
        </span>
        <div style="margin-top:12px;">
          <a href="https://facebook.com" target="_blank" style="margin-right:8px;">
            <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" style="width:22px;vertical-align:middle;" />
          </a>
          <a href="https://twitter.com" target="_blank" style="margin-right:8px;">
            <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" style="width:22px;vertical-align:middle;" />
          </a>
          <a href="https://instagram.com" target="_blank" style="margin-right:8px;">
            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" style="width:22px;vertical-align:middle;" />
          </a>
          <a href="https://linkedin.com" target="_blank">
            <img src="https://cdn-icons-png.flaticon.com/512/733/733561.png" alt="LinkedIn" style="width:22px;vertical-align:middle;" />
          </a>
        </div>
      </div>
      <div style="margin-top:12px;">
        <span style="font-size:13px;color:#888;">If you have any questions or need to make changes to your booking, please contact us using the details above.</span>
      </div>
    `;

    const html = `
      <div style="font-family:sans-serif;">
        <h2 style="color:#023545;">Thank you for your booking, ${booking.guestName || ''}!</h2>
        <p>
          We are delighted to confirm your reservation at <b>Coral Stay Beach Resort</b>.
          Below are your booking details:
        </p>
        ${bookingDetails}
        <p>
          <b>We look forward to welcoming you!</b>
        </p>
        ${contactDetails}
      </div>
    `;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Coral Stay" <${process.env.EMAIL_USER}>`,
      to: booking.guestEmail,
      subject: 'Your Coral Stay Booking Confirmation',
      html
    });

    res.status(201).json({ message: 'Booking saved and email sent.' });
  } catch (error) {
    console.error('Booking or email error:', error);
    res.status(500).json({ error: 'Failed to save booking or send email.' });
  }
};

exports.checkAvailability = async (req, res) => {
  const { roomId, checkIn, checkOut } = req.query; // use query for GET

  try {
    const bookings = await Booking.find({
      roomId,
      $or: [
        { checkIn: { $lte: checkOut, $gte: checkIn } },
        { checkOut: { $lte: checkOut, $gte: checkIn } },
        {
          $and: [
            { checkIn: { $lte: checkIn } },
            { checkOut: { $gte: checkOut } },
          ],
        },
      ],
    });

    const isAvailable = bookings.length === 0;

    res.status(200).json({ available: isAvailable });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Error checking room availability.' });
  }
};
