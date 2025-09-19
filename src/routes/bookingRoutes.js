const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const stripe = require("stripe")(process.env.STRIPE_SECRET);

// Book a room
router.post('/roombookings', bookingController.createBooking);

// Fix method: should be POST for availability check
router.post('/availability', bookingController.checkAvailability);
router.post('/checkRoomTypeAvailability', bookingController.checkRoomTypeAvailability);
// router.get('/getHotelBookingsByUser/:userId', bookingController.getHotelBookingsByUser);
router.get('/getHotelBookingsByUser/:name', bookingController.getHotelBookingsByUser);

// Stripe payment - define on router, not app!
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { roomTitle, packageType, amount, customerEmail } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "lkr", // or "usd" if testing in dollars
            product_data: {
              name: `${roomTitle} - ${packageType}`,
            },
            unit_amount: amount * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:5173/profile",
      cancel_url: "http://localhost:5173/roomBookingForm",
      
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});




router.post("/create-checkoutpackage-session", async (req, res) => {
  try {
    const { packageTitle, packageType, roomType, amount, customerEmail } = req.body;

    // Compose product name for Stripe
    const productName = roomType
      ? `${packageTitle} - ${packageType} (${roomType})`
      : `${packageTitle} - ${packageType}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "lkr", // Use "usd" for testing if needed
            product_data: {
              name: productName,
            },
            unit_amount: amount * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:5173/profile",
      cancel_url: "http://localhost:5173/roomBookingForm",
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.post("/create-checkout-seat-session", async (req, res) => {
  try {
    const {
      seats,
      date,
      timeSlot,
      customerName,
      customerEmail,
      contactNumber,
      nicNumber,
      amount
    } = req.body;

    // Compose product name for Stripe
    const productName = `Reef Ride Seat Booking (${seats} seats, ${date} ${timeSlot})`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "lkr", // Use "usd" for testing if needed
            product_data: {
              name: productName,
             // description: `Name: ${customerName}, Contact: ${contactNumber}, NIC: ${nicNumber}`,
            },
            unit_amount: amount * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:5173/profile",
      cancel_url: "http://localhost:5173/booking",
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

module.exports = router;