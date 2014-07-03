forecast-pushover
=================

A Node.js client that notifies you if it's about to rain via either Pushover or Boxcar, using data from Forecast.io.

Credentials are stored in a `config.json` file in the root of the project and should be formatted as follows:

```json
{
  "forecastKey" : "FORECAST_API_KEY",
  "refreshTime" : 180000,
  "locations"   : {
    "Birmingham" : "52.4782600,-1.8944970",
    "Warrington" : "53.3873,2.6029",
    "LOCATION_3" : "50.0000,0.0000"
  },
  "pushover" : {
    "Josh" : {
        "user"  : "PUSHOVER_USER_KEY_1",
        "token" : "PUSHOVER_API_TOKEN_1"
    },
    "USER_2" : {
        "user"  : "PUSHOVER_USER_KEY_2",
        "token" : "PUSHOVER_API_TOKEN_2"
    },
    "USER_3" : {
        "user"  : "PUSHOVER_USER_KEY_3",
        "token" : "PUSHOVER_API_TOKEN_3"
    }
  },
  "boxcar" : {
    "Josh" : {
        "token" : "BOXCAR_API_TOKEN_1"
    },
    "USER_2" : {
        "token" : "BOXCAR_API_TOKEN_1"
    },
    "USER_3" : {
        "token" : "BOXCAR_API_TOKEN_1"
    }
  }
}
```

The `pushover` object can be omitted if using Boxcar, as can the `boxcar` object if using Pushover. Multiple locations to check can be specified, and multiple users can be notified.

Refresh time specifies (in milliseconds) the time between each refresh and call to the Forecast.io API, must be minimum 180 seconds to avoid Forecast daily API query limit. Coordinates are the latitude and longitude of the location that you would like to monitor, comma separated.