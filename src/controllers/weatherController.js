const axios = require('axios');
const WeatherForecast = require('../models/WeatherForecast');

const getWeatherForecast = async (req, res) => {
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
    const results = [];

    forecastList.forEach(entry => {
      const [date, time] = entry.dt_txt.split(' ');
      const condition = entry.weather[0].main;
      const description = entry.weather[0].description;
      const temperature = entry.main.temp;
      const humidity = entry.main.humidity;
      const windSpeed = entry.wind.speed;
      const cloudiness = entry.clouds.all;
      const rainVolume = entry.rain?.['3h'] || 0;

      const forecast = new WeatherForecast(
        date,
        time,
        condition,
        description,
        temperature,
        humidity,
        windSpeed,
        cloudiness,
        rainVolume
      );

      forecast.checkSafety();

      results.push({
        date,
        time,
        condition,
        description,
        temperature,
        humidity,
        windSpeed,
        cloudiness,
        rainVolume,
        isSafe: forecast.IsSafe,
        suggestion: forecast.IsSafe ? '✅ Recommended slot' : '❌ Unsafe for boat rides',
      });
    });

    res.json({ forecast: results });
  } catch (error) {
    console.error('Error fetching weather:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather forecast' });
  }
};

module.exports = { getWeatherForecast };
