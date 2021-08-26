/* @flow */
const express = require("express");
const debugLib = require("debug");
const debug = debugLib("SimpleApplication");
const app = express();
import RateLimiter from "../dist/RateLimiter";

debug.enabled = true;

var ConfigForAuthenticated = {
  maxRequest: 1000,              // Maximum number of requests allowed within in [duration] time limit.
  endpoint: "",                 // endpoint url eg. redis:// , dynamo etc. Empty for Inmemory
  duration: 3600,               // Time window size in seconds, maxRequests allowed in this time window.
  endpointType: "inmemory",     //  endpointType inmemory/redis/dynamo etc.
  onConnectError: {},           // Optional for inmemory, good to have for redis and other db connectors
  onConnect: {},                // Same as above.
  keyGenerator: function (req) { // keyGenerator passed to RateLimiter, it counts the nunber of requests based on the key
                                 //  return req.query.userid;  // We can customize the unique key comes with http request. For now we will just continue using ip.
    return req.ip;
  },
  headers: true,                 // If true it appends the Rate limit information in header
};

var ConfigForGeneral = {
  maxRequest: 100,
  endpoint: "",
  duration: 300,
  endpointType: "inmemory",
  onConnectError: {},
  onConnect: {},
  keyGenerator: function (req) {
    return req.ip;
  },
  headers: true,
};

var apiLimiterGeneral = {};
var apiLimiterAuthenticated = {};

function SimpleApplication(optsGeneral = {}, optsAuth = {}, port = {}) {
  /* Crerating RateLimiter Object */

  apiLimiterGeneral = new RateLimiter(optsGeneral);
  apiLimiterAuthenticated = new RateLimiter(optsAuth);

  /* Applying ratelimiter object to the middleware 
     This will intercept all the request and check for 
     request limit for source (ip by default)
  */
  app.use("/login", apiLimiterGeneral.rateLimit);
  app.use("/somepath/index", apiLimiterAuthenticated.rateLimit);

  app.get("/login", (req, res) => {
    res.send(
      "Please enter your Login Details => [ Beware don't pump too much of traffic, we are monitoring !!]"
    );
  });
  app.get("/somepath/index", (req, res) => {
    res.send("Awesome !! You Are Authenticated user, have a smooth ride !!");
  });

  port = port || 8000;
  return new Promise((resolve, reject) => {
    app.listen(port, () => {
      return resolve(
        `Application Server(with RateLimiter) Listening at  http://localhost:${port}`
      );
    });
  });
}

function throttleRateLimit() {
  debug("Now trying to change(decreasing) the RateLimit on the fly ");
  ConfigForGeneral.maxRequest = 2;
  ConfigForAuthenticated.maxRequest = 2;
  apiLimiterGeneral.throttleRateLimit(ConfigForGeneral);
  apiLimiterAuthenticated.throttleRateLimit(ConfigForAuthenticated);
}

SimpleApplication(ConfigForGeneral, ConfigForAuthenticated, 8000)
  .then((res) => {
    debug(res);
    debug("Setting timer to throttle ratelimit after 60 seconds");
    setTimeout(() => throttleRateLimit(), 60000);
    return res;
  })
  .catch((err) => {
    debug("Error in starting application server");
    throw new Error("Can't start Application server " + err);
  });
