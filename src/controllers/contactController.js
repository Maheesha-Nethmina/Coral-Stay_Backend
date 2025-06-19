const nodemailer = require('nodemailer');
require('dotenv').config();

const contactFormHandler = async (req, res) => {
  const { firstName, lastName, email, message } = req.body;

  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

//rdgj qzou ijks xdfy

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter connection before sending
    await transporter.verify();

    const mailOptions = {
      from: `"CoralStay Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'New Contact Form Submission - CoralStay',
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong while sending the message.',
      error: error.message, // Include this for debugging only. Remove in production.
    });
  }
};

module.exports = { contactFormHandler };
