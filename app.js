var Pushover = require('node-pushover');
var http = require('http');
var fs = require('fs');
var request = require('request');

// Reads config.json to get credentials for Pushover and Forecast.io APIs
var credentials = JSON.parse(fs.readFileSync('config.json'));
var pushoverToken = credentials['pushoverToken'];
var pushoverUser = credentials['pushoverUser'];
var forecastKey = credentials['forecastKey'];
var forecastURL = "https://api.forecast.io/forecast/" + forecastKey + "/52.4782600,-1.8944970?exclude=flags,alerts,daily,hourly&units=si";

// Sends the notifications
function sendNotification(title, message) {
  var push = new Pushover({
    token: pushoverToken,
    user:  pushoverUser
  });
  push.send(title, message);
};

// Converts intensity into a readable format
function getReadableIntensity(intensity) {
  if (intensity < 0.432) {
    response = "Very light ";
  } else if (intensity < 2.54) {
    response = "Light ";
  } else if (intensity < 10.16) {
    response = "Moderate ";
  } else if (intensity >= 10.16) {
    response = "Heavy ";
  };
  return response;
};

var lastNotificationTime = 0;

// Checks forecast.io API periodically for up-to-date weather data
setInterval(function() {
  console.log('tick');
  // Gets current weather data from forecast.io API
  request(forecastURL, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var bodyParsed = JSON.parse(body);
      var nextHour = bodyParsed['minutely']['data'];
      var minPrecipProbability = 0.0007;
      var currentTime = bodyParsed['currently']['time'];
      var notificationWaitTime = 600;

      // Builds array of all times when precipitation probability is greater than the specified minimum
      for (var i in nextHour) {
        var precipProbability = nextHour[i]['precipProbability'];
        if (precipProbability >= minPrecipProbability) {
          if (!upcomingPrecip) {
            var upcomingPrecip = [];
          };
          upcomingPrecip.push(nextHour[i]);
        };
      };
      
      // Builds and sends notification if there is precipitation within the next hour
      if (upcomingPrecip) {  
        var nextPrecip = upcomingPrecip[0];
        var secondsToPrecip = (upcomingPrecip[0]['time'] - currentTime);
        var minutesToPrecip = (secondsToPrecip / 60) | 0;
        var intensity = getReadableIntensity(upcomingPrecip[0]['precipIntensity']);

        console.log(nextPrecip);

        var title = intensity + nextPrecip['precipType'];
        var message = "Starting in " + minutesToPrecip + " minutes.";

        if (currentTime >= (lastNotificationTime + notificationWaitTime)) {
          console.log("Notification sent:")
          console.log(title);
          console.log(message);
          sendNotification(title, message);

          lastNotificationTime = currentTime;
        };
      };
    };
  });
}, 60000);