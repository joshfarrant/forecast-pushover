var Pushover = require('node-pushover');
var fs = require('fs');

//Reads config.json to get API token and user key
fs.readFile("config.json", function (err, data) {
  if (err) {
    console.log('Error: ' + err);
  }
  var content = JSON.parse(data);
  token = content["token"];
  user = content["user"];
  sendNotification(token, user)
});

//Sends the notification
function sendNotification(token, user) {
  var push = new Pushover({
    token: token,
    user:  user
  });

  var title =   "Oh...";
  var message = "Hello!!!"

  push.send(title, message);
};

