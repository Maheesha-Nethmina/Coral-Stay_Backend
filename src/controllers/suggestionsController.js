// File: src/controllers/suggestionsController.js
const Booking = require("../models/Booking");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

exports.getPackingSuggestions = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Get check-in date
    const { checkIn } = booking;

    // Weather API
    const apiKey = process.env.WEATHER_API_KEY;
    const city = "Hikkaduwa, LK"; // location of your hotel
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    const response = await fetch(url);
    const data = await response.json();

    // Find forecast for the check-in date
    const forecast = data.list.find(entry =>
      entry.dt_txt.startsWith(checkIn.toISOString().split("T")[0])
    );

    let suggestions = [];

    if (forecast) {
      const condition = forecast.weather[0].main.toLowerCase();
      const wind = forecast.wind.speed;

      if (condition.includes("rain")) {
        suggestions.push("Umbrella", "Raincoat" , "Quick-dry clothing" ,"Waterproof shoes or sandals", "Waterproof phone pouch / dry bags");
      }
      if (wind > 6) {
        suggestions.push("Light sweater", "Avoid long dresses");
      }
      if (condition.includes("clear")) {
        suggestions.push("Sunscreen", "Sunglasses", "Hat" , "Light cotton clothes" , "Reusable water bottle (hydration)");
      }
    } else {
      suggestions.push("Normal clothing");
    }

    // Respond with booking details + suggestions
    res.json({
      bookingId,
      guest: booking.guestName,
      roomType: booking.roomTitle,   
      quantity: booking.quantity,    
      checkIn,
      checkOut: booking.checkOut,
      suggestions,
    });
  } catch (err) {
    console.error("Error generating suggestions:", err);
    res.status(500).json({ error: "Failed to generate packing suggestions" });
  }
};
