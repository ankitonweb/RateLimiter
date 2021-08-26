/* @flow */
const debugLib = require("debug");
const debug = debugLib("index");
const express = require("express");
import RateLimiter from "../../dist/RateLimiter";
const app = express();

function Server(opts = {}, port = {}) {
  /* Crerating RateLimiter Object */

  var apiLimiter = new RateLimiter(opts);

  /* Applying ratelimiter object to the middleware 
       This will intercept all the request and check for 
       request limit for source (ip by default)
    */
  app.use("/", apiLimiter.rateLimit);

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });
  port = port || 8000;
  return new Promise((resolve, reject) => {
    app.listen(port, () => {
      return resolve(
        `Application Server(with RateLimiter) Listening at  http://localhost:${port}\n with following options\n ${JSON.stringify(opts)}`
      );
    });
  });
}

module.exports = (opts, port = {}) => {
  return Server(opts, port)
    .then((res) => {
      console.log(res);
      return res;
    })
    .catch((err) => {
      console.log("Error in starting application server");
      throw new Error("Can't start Application server " + err);
    });
};
