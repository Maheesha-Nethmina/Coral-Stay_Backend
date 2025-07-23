class WeatherForecast {
  constructor(date, time, condition, description, temperature, humidity, windSpeed, cloudiness, rainVolume = 0) {
    this.TourBookingDate = date;
    this.TourBookingTime = time;
    this.WeatherCondition = condition;
    this.Description = description;
    this.Temperature = temperature;
    this.Humidity = humidity;
    this.WindSpeed = windSpeed;
    this.Cloudiness = cloudiness;
    this.RainVolume = rainVolume;
    this.IsSafe = true; // Default assumption
  }

  checkSafety() {
    if (this.WeatherCondition === 'Thunderstorm') {
      this.IsSafe = false;
    } else if (this.WeatherCondition === 'Rain' && this.RainVolume > 2.0) {
      this.IsSafe = false;
    } else if (this.WindSpeed > 7.5) {
      this.IsSafe = false;
    }
    return this.IsSafe;
  }
}

module.exports = WeatherForecast;
