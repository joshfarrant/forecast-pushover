var Pushover = require('node-pushover');
var http = require('http');
var fs = require('fs');
var request = require('request');

// Reads config.json to get credentials for Pushover and Forecast.io APIs
var credentials = JSON.parse(fs.readFileSync('config.json'));
var pushoverToken = credentials['pushoverToken'];
var pushoverUser = credentials['pushoverUser'];
var forecastKey = credentials['forecastKey'];
var coordinates = "53.9892,-7.3628" // Coordinates for Ireland (because it always seems to be raining there)
// My rough coordinates 52.4782600,-1.8944970
var forecastURL = "https://api.forecast.io/forecast/" + forecastKey + "/" + coordinates + "?exclude=flags,alerts,daily,hourly&units=si";

// Sends the notifications
function sendNotification(title, message) {
  var push = new Pushover({
    token: pushoverToken,
    user:  pushoverUser
  });
  push.send(title, message);
  lastNotificationTime = currentTime;
  return lastNotificationTime;
};

// Converts intensity into a readable format
function getReadableIntensityAndPriority(intensity) {
  var intensity;
  var priority;
  var response;
  if (intensity < 0.432) {
    intensity = "Very light ";
    priority = "Low";
  } else if (intensity < 2.54) {
    intensity = "Light ";
    priority = "Low";
  } else if (intensity < 10.16) {
    intensity = "Moderate ";
    priority = "Medium";    
  } else if (intensity >= 10.16) {
    intensity = "Heavy ";
    priority = "High";    
  };
  response = [intensity, priority];
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
      var nextHour = bodyParsed['minutely']['data']; // All minutely weather data for the next hour
      var minPrecipProbability = 0.0007; // Minimum precipitation probability to class as weather event
      var currentPrecip = false;
      var currentTime = bodyParsed['currently']['time']; // Gets current time from response
      var notificationWaitTime = 1200; // Time to wait between sending notifications

      if (bodyParsed['currently']['precipType']) {
        currentPrecip = bodyParsed['currently']['precipType'];
      };

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
      if (upcomingPrecip && currentPrecip == false) {  
        var nextPrecip = upcomingPrecip[0];
        var secondsToPrecip = (upcomingPrecip[0]['time'] - currentTime);
        var minutesToPrecip = (secondsToPrecip / 60) | 0;

        var intensityAndPriority = getReadableIntensityAndPriority(upcomingPrecip[0]['precipIntensity']);
        var intensity = intensityAndPriority[0];
        var priority = intensityAndPriority[1];
        var message = "";
        var nextPrecipDuration = 0; // How many minutes the next precipitation will occur for

        var title = intensity + nextPrecip['precipType'];
        if (minutesToPrecip != 0){
          message = "Starting in " + minutesToPrecip + " minutes.";
        } else {
          message = "Starting now.";
        };
        var notificationLimitExpiry = lastNotificationTime + notificationWaitTime;

        // Checks priority of upcoming weather event
        // Low or medium priority event notifications are limited by the notificationWaitTime
        // High priority events are not limited
        if (priority == "Low" || priority == "Medium") {
          if (currentTime >= notificationLimitExpiry) {
            console.log("Notification sent:")
            console.log(title);
            console.log(message);
            console.log(priority);

            // lastNotificationTime = sendNotification(title, message);
          } else {
            console.log("Notification limit reached, limit resets in " + (currentTime - notificationLimitExpiry) + " seconds")
          };
        } else if (priority == "High") {
            console.log("Notification sent:")
            console.log(title);
            console.log(message);
            console.log(priority);

            // lastNotificationTime = sendNotification(title, message);
        };
      };
    };
  });
}, 180000);