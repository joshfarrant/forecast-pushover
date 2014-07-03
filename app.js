var httpreq = require('httpreq');
var fs = require('fs');

// Reads config.json to get credentials for Pushover and Forecast.io APIs
var credentials = JSON.parse(fs.readFileSync('config.json'));
var pushoverUsers = credentials['pushover'];
var boxcarUsers = credentials['boxcar'];
var forecastKey = credentials['forecastKey'];
var refreshTime = credentials['refreshTime'];
var locations = credentials['locations']; 

// Writes string to log.txt
function logString(string) {
  var currentDate = new Date();
  var currentTimestamp = currentDate.getTime();
  var logString = currentTimestamp + " - " + string + "\n";
  fs.appendFile('log.txt', logString);
};

// Sends the notification via Pushover
function sendPushover(user, title, message, sound) {
  var pushoverToken = pushoverUsers[user]['token'];
  var pushoverUser = pushoverUsers[user]['user'];
  var data = {
    token   : pushoverToken,
    user    : pushoverUser,
    title   : title,
    message : message,
    sound   : sound
  };
  var logData = "";
  httpreq.post("https://api.pushover.net/1/messages.json", {parameters: data}, function (err, res){
    if (err) {
      logData = "Error sending notification: " + err;
      logString(logData);
    } else {
      logData = "Notification sent: [TITLE: '" + title + "'], [MESSAGE: '" + message + "'], [SOUND: '" + sound + "']";
      logString(logData);
      lastNotificationTime = currentTimestamp;
    };
  });
  return lastNotificationTime;
};

// Sends the notification via Boxcar
function sendBoxcar(user, title, message, sound) {
  var boxcarToken = boxcarUsers[user]['token'];
  var data = {
    "user_credentials"          : boxcarToken,
    "notification[title]"       : title + " " + message,
    "notification[long_message]": "Grab a coat!",
    "notification[sound]"       : sound,
    "notification[source_name]" : "Weather Report!"
  };
  var logData = "";
  httpreq.post("https://new.boxcar.io/api/notifications", {parameters: data}, function (err, res){
    if (err) {
      logData = "Error sending Boxcar notification: " + err;
      logString(logData);
    } else {
      logData = "Boxcar notification sent: [TITLE: '" + title + "'], [MESSAGE: '" + message + "'], [SOUND: '" + sound + "']";
      logString(logData);
      lastNotificationTime = currentTimestamp;
    };
  });
  return lastNotificationTime;
};

// Converts intensity into a readable format
function getReadableIntensityAndPriority(intensity) {
  var intensity;
  var priority;
  var response;
  if (intensity < 0.432) {
    intensity = "Very light ";
    priority = "Very low";
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
var currentDate = new Date();
var currentDay = currentDate.getDay();
var currentTimestamp = (currentDate.getTime() / 1000) | 0;
var currentHour = currentDate.getHours();

// Queries forecast API for location, notifies user if there is upcoming precipitation
function checkForecastAndSendNotification(user, location) {
  var coordinates = locations[location];
  var forecastURL = "https://api.forecast.io/forecast/" + forecastKey + "/" + coordinates + "?exclude=flags,alerts,daily,hourly&units=si";

  // Gets current weather data from forecast.io API
  httpreq.get(forecastURL, function (err, res) {
    // Logs any errors
    if (err) {
      logData = "Error querying Forecast API: " + err;
      logString(logData);
    };
    if (!err && res.statusCode == 200) {
      var bodyParsed = JSON.parse(res.body);
      try {
        var nextHour = bodyParsed['minutely']['data']; // All minutely weather data for the next hour
      } catch(err) {
        logData = "No minutely data available for " + location; 
        logString(logData);
      };
      var minPrecipProbability = 0.0007; // Minimum precipitation probability to class as weather event
      var currentPrecip = false;
      var lastRequestTime = bodyParsed['currently']['time']; // Gets last request time from response
      var notificationWaitTime = 1200; // Time to wait between sending notifications

      if (bodyParsed['currently']['precipType']) {
        currentPrecip = bodyParsed['currently']['precipType'];
      };
      logData = "Forecast API successfully queried";
      logString(logData);
      var precipProbability;
      var previousPrecip = false;

      // Gets next time when precipitation probability is greater than the specified minimum
      // If this precipitation will last more than 1 min, builds an array of all items in the next precipitation event
      // Stops building array if a precipitation event stops
      for (var i in nextHour) {
        precipProbability = nextHour[i]['precipProbability'];
        if (precipProbability >= minPrecipProbability) {
          if (!upcomingPrecip) {
            var upcomingPrecip = [];
          };
          upcomingPrecip.push(nextHour[i]);
          previousPrecip = true;
        } else if (previousPrecip == true) {
          break;
        };
      };
    };

    // Builds and sends notification if there is precipitation within the next hour
    if (upcomingPrecip) { 
      var upcomingPrecipDuration = upcomingPrecip.length - 1; // How many minutes the next precipitation will occur for
      var nextPrecip = upcomingPrecip[0];
      var secondsToPrecip = (upcomingPrecip[0]['time'] - lastRequestTime);
      var minutesToPrecip = (secondsToPrecip / 60) | 0;

      var intensityAndPriority = getReadableIntensityAndPriority(upcomingPrecip[0]['precipIntensity']);
      var intensity = intensityAndPriority[0];
      var priority = intensityAndPriority[1];
      var message = "";

      var title = intensity + nextPrecip['precipType'];
      if (minutesToPrecip != 0){
        message = "starting in " + minutesToPrecip + " minutes, for " + upcomingPrecipDuration + " minutes.";
      } else {
        message = "for " + upcomingPrecipDuration + " minutes.";
      };
      var notificationLimitExpiry = lastNotificationTime + notificationWaitTime;
      // Checks priority of upcoming weather event
      // Medium priority event notifications are limited by the notificationWaitTime
      // High priority events are not limited
      if (priority == "Medium") {
        if (lastRequestTime >= notificationLimitExpiry) {
          lastNotificationTime = sendPushover(user, title, message);
        } else {
          logData = "Notification limit reached, resets in " + (lastRequestTime - notificationLimitExpiry) + " seconds";
          logString(logData);
        };
      } else if (priority == "High") {
          lastNotificationTime = sendPushover(user, title, message);
      };
    };
  });
};

// Prevents API calls and notifications from going out early in the morning or late at night
if (currentHour >= 8 && currentHour < 22) {
  // Checks forecast.io API periodically for up-to-date weather data
  setInterval(function() {
    checkForecastAndSendNotification("Josh", "Birmingham")
  }, refreshTime);
};