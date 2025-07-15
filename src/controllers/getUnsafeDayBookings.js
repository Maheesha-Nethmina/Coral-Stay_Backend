// File: controllers/getUnsafeDayBookings.js

const axios = require('axios');
const SeatBooking = require('../models/sheetBookingModel');

const getUnsafeDayBookings = async (req, res) => {
  const lat = 6.14; // Hikkaduwa
  const lon = 80.10;
  const apiKey = process.env.WEATHER_API_KEY;

  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat,
        lon,
        appid: apiKey,
        units: 'metric',
      },
    });

    const forecastList = response.data.list;
    const unsafeDates = new Set();

    forecastList.forEach(entry => {
      const [date, time] = entry.dt_txt.split(' ');
      const hour = parseInt(time.split(':')[0]);

      if (hour >= 9 && hour < 12) { // Only check 9AM - 12PM
        const windSpeed = entry.wind.speed;
        const rainVolume = entry.rain?.['3h'] || 0;
        const storm = entry.weather[0].main;

        const isUnsafe = windSpeed > 7.5 || rainVolume > 2.0 || storm.toLowerCase().includes('storm');
        if (isUnsafe) unsafeDates.add(date);
      }
    });

    const bookings = await SeatBooking.find({
      date: { $in: Array.from(unsafeDates) },
      timeSlot: { $in: [
         '09.00 am to 10.00 am',
         '10.30 am to 11.30 am',
      ] },
    });

    res.status(200).json({ unsafeDates: Array.from(unsafeDates), bookings });
  } catch (err) {
    console.error('Error in getUnsafeDayBookings:', err);
    res.status(500).json({ error: 'Failed to fetch unsafe bookings' });
  }
};

module.exports = getUnsafeDayBookings;
