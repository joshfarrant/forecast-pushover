forecast-pushover
=================

A Node.js client that notifies you if it's about to rain via Pushover, using data from Forecast.io.

Credentials are stored in a `config.json` file in the root of the project and should be formatted as follows:

```
{
  "pushoverToken" : "PUSHOVER_API_TOKEN",
  "pushoverUser"  : "PUSHOVER_USER_KEY",
  "forecastKey"   : "FORECAST_API_KEY",
  "refreshTime"   : 180000,
  "coordinates"   : "52.4782600,-1.8944970"
}
```

Refresh time specifies (in milliseconds) the time between each refresh and call to the Forecast.io API. Coordinates are the latitude and longitude of the location that you would like to monitor, comma separated.