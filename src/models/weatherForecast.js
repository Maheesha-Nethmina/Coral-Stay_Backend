// This is a JS class (not a database model like Mongoose)

class WeatherForecast {
  constructor(date, time, condition, humidity, windSpeed) {
    this.TourBookingDate = date;
    this.TourBookingTime = time;
    this.WeatherCondition = condition;
    this.Humidity = humidity;
    this.WindSpeed = windSpeed;
    this.IsSafe = true; // Default
  }

  // Evaluate weather safety
  checkSafety() {
    if (["Rain", "Thunderstorm"].includes(this.WeatherCondition) || this.WindSpeed > 7.5) {
      this.IsSafe = false;
    }
    return this.IsSafe;
  }
}

module.exports = WeatherForecast;
