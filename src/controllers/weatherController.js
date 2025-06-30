const axios = require('axios');
const WeatherForecast = require('../models/WeatherForecast');

const getWeatherAlerts = async (req, res) => {
  const lat = 6.14; // Hikkaduwa
  const lon = 80.10;
  const apiKey = process.env.WEATHER_API_KEY;

  try {
    // Fetch weather forecast
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: { lat, lon, appid: apiKey, units: 'metric' }
    });

    const forecasts = response.data.list;
    const alerts = [];

    // Process forecast entries (every 3 hours)
    forecasts.forEach(entry => {
      const forecast = new WeatherForecast(
        entry.dt_txt.split(" ")[0],         // Date
        entry.dt_txt.split(" ")[1],         // Time
        entry.weather[0].main,              // Condition
        entry.main.humidity,                // Humidity
        entry.wind.speed                    // Wind speed
      );

      if (!forecast.checkSafety()) {
        alerts.push({
          date: forecast.TourBookingDate,
          time: forecast.TourBookingTime,
          condition: forecast.WeatherCondition,
          wind: forecast.WindSpeed,
          reason: `${forecast.WeatherCondition} with wind ${forecast.WindSpeed} m/s`
        });
      }
    });

    res.json({ alerts });

  } catch (error) {
    console.error('Error fetching weather:', error.message);
    res.status(500).json({ error: 'Failed to get weather alerts' });
  }
};

module.exports = { getWeatherAlerts };
