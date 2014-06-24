forecast-pushover
=================

A Node.js client that notifies you if it's about to rain via Pushover, using data from Forecast.io.

Credentials are stored in the `config.json` file and should be formatted as follows:

```
{
  "pushoverToken" : "PUSHOVER_API_TOKEN",
  "pushoverUser"  : "PUSHOVER_USER_KEY",
  "forecastKey"   : "FORECAST_API_KEY"
}
```
